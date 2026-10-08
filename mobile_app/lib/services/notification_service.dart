import 'dart:async';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Top-level background message handler (must be a top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message received: ${message.messageId}');
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'temple_notifications', // id
    'Temple Notifications', // name
    description: 'Notifications from Sri Kedareshwara Ashramam',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  /// Initialize FCM and local notifications. Call once in main().
  static Future<void> initialize() async {
    // 1. Request notification permission (required on Android 13+ and iOS)
    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');
    } catch (e) {
      debugPrint('[FCM] Error requesting FCM permission: $e');
    }

    // 2. Request Android 13+ runtime POST_NOTIFICATIONS permission
    try {
      final androidImplementation = _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      final granted = await androidImplementation?.requestNotificationsPermission();
      debugPrint('[Notifications] Android notification permission granted: $granted');
    } catch (e) {
      debugPrint('[Notifications] Error requesting Android notification permission: $e');
    }

    // 3. Create the Android notification channel with max priority
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // 4. Initialize flutter_local_notifications
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // 5. Subscribe to 'all_devotees' topic so device gets push notifications even when app is closed
    try {
      await _messaging.subscribeToTopic('all_devotees');
      debugPrint('[FCM] Subscribed to all_devotees topic');
    } catch (e) {
      debugPrint('[FCM] Error subscribing to topic: $e');
    }

    // 6. Listen for foreground FCM messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 7. Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // 8. Check if app was opened from a terminated state via notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[FCM] App opened from terminated state via notification');
    }

    // 9. Start robust real-time Firestore notification listener
    startFirestoreNotificationListener();
  }

  static StreamSubscription<QuerySnapshot>? _firestoreNotificationSub;
  static bool _isListening = false;
  static bool _initialSnapshotReceived = false;
  static final Set<String> _seenDocIds = <String>{};

  /// Start listening to Firestore notifications collection and show local
  /// notifications for any NEW documents created after the app started.
  /// Delivers instant heads-up banners on mobile devices.
  static void startFirestoreNotificationListener() {
    if (_isListening) {
      return;
    }

    _firestoreNotificationSub?.cancel();
    _isListening = true;
    _initialSnapshotReceived = false;
    _seenDocIds.clear();

    debugPrint('[Notifications] Starting real-time Firestore notification listener');

    _firestoreNotificationSub = FirebaseFirestore.instance
        .collection('notifications')
        .snapshots()
        .listen((snapshot) {
      // First snapshot: record existing doc IDs so we don't spam old notifications
      if (!_initialSnapshotReceived) {
        for (final doc in snapshot.docs) {
          _seenDocIds.add(doc.id);
        }
        _initialSnapshotReceived = true;
        debugPrint('[Notifications] Initialized listener with ${_seenDocIds.length} existing notification(s)');
        return;
      }

      // Subsequent snapshots: notify for any newly added documents in real-time
      for (final change in snapshot.docChanges) {
        if (change.type == DocumentChangeType.added) {
          final docId = change.doc.id;
          if (_seenDocIds.contains(docId)) continue;
          _seenDocIds.add(docId);

          final data = change.doc.data();
          if (data == null) continue;

          final title = data['title'] as String? ?? '';
          final body = data['body'] as String? ?? '';
          final type = data['type'] as String? ?? 'announcement';

          if (title.isEmpty) continue;

          // Prevent duplicate if FCM foreground message already displayed it
          if (_displayedForegroundIds.contains(docId)) continue;
          _displayedForegroundIds.add(docId);

          debugPrint('[Notifications] Real-time notification received from dashboard: "$title"');

          // Get emoji prefix based on type
          String prefix = '';
          switch (type) {
            case 'urgent':
              prefix = '⚠️ ';
              break;
            case 'puja':
              prefix = '🪔 ';
              break;
            case 'darshan':
              prefix = '🙏 ';
              break;
            case 'event':
              prefix = '🎉 ';
              break;
            case 'general':
              prefix = '🕊️ ';
              break;
            case 'announcement':
              prefix = '📢 ';
              break;
          }

          // Show local notification with heads-up popup
          _localNotifications.show(
            docId.hashCode,
            '$prefix$title',
            body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                importance: Importance.max,
                priority: Priority.max,
                icon: '@mipmap/ic_launcher',
                playSound: true,
                enableVibration: true,
                styleInformation: BigTextStyleInformation(body),
              ),
            ),
            payload: data['actionRoute'] as String?,
          );
        }
      }
    }, onError: (e) {
      debugPrint('[Notifications] Firestore listener error: $e');
    });
  }

  /// Stop the Firestore notification listener
  static void stopFirestoreNotificationListener() {
    _firestoreNotificationSub?.cancel();
    _firestoreNotificationSub = null;
    _isListening = false;
    _initialSnapshotReceived = false;
    _seenDocIds.clear();
    debugPrint('[Notifications] Stopped Firestore notification listener');
  }

  /// Save or refresh the FCM token for the currently logged-in user.
  /// Call this after successful authentication.
  static Future<void> saveTokenForUser(String userId) async {
    try {
      final token = await _messaging.getToken();
      if (token == null) {
        debugPrint('[FCM] Could not get FCM token');
        return;
      }

      debugPrint('[FCM] Token obtained: ${token.substring(0, 20)}...');

      // Save token to Firestore under user's tokens subcollection
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('tokens')
          .doc(token)
          .set({
        'token': token,
        'platform': Platform.isAndroid ? 'android' : 'ios',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) async {
        final currentUser = FirebaseAuth.instance.currentUser;
        if (currentUser != null) {
          // Delete old token doc if different
          if (newToken != token) {
            await FirebaseFirestore.instance
                .collection('users')
                .doc(currentUser.uid)
                .collection('tokens')
                .doc(token)
                .delete()
                .catchError((_) {});
          }

          // Save new token
          await FirebaseFirestore.instance
              .collection('users')
              .doc(currentUser.uid)
              .collection('tokens')
              .doc(newToken)
              .set({
            'token': newToken,
            'platform': Platform.isAndroid ? 'android' : 'ios',
            'createdAt': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          });

          debugPrint('[FCM] Token refreshed and saved');
        }
      });
    } catch (e) {
      debugPrint('[FCM] Error saving token: $e');
    }
  }

  static final Set<String> _displayedForegroundIds = <String>{};

  /// Handle foreground FCM messages — show a local notification
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    final notifKey = message.data['notificationId'] ?? message.messageId ?? '${notification.title}_${notification.body}';
    if (_displayedForegroundIds.contains(notifKey)) {
      debugPrint('[FCM] Duplicate foreground message ignored: $notifKey');
      return;
    }
    _displayedForegroundIds.add(notifKey);

    if (_displayedForegroundIds.length > 50) {
      _displayedForegroundIds.remove(_displayedForegroundIds.first);
    }

    _localNotifications.show(
      notifKey.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          tag: notifKey,
          playSound: true,
          enableVibration: true,
        ),
      ),
      payload: message.data['actionRoute'],
    );
  }

  /// Handle notification tap when app was in background
  static void _handleMessageOpenedApp(RemoteMessage message) {
    debugPrint('[FCM] Notification tapped (from background): ${message.data}');
  }

  /// Handle local notification tap
  static void _onNotificationTapped(NotificationResponse response) {
    debugPrint('[FCM] Local notification tapped, payload: ${response.payload}');
  }
}
