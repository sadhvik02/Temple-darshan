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

    // Real-time notifications are handled directly by Firebase Cloud Messaging (FCM).
    // The Firestore listener is not used to prevent duplicate system alerts.
  }

  /// Deprecated: Local Firestore listener is disabled because Firebase Cloud Messaging (FCM)
  /// triggers notifications for background, terminated, and foreground states.
  static void startFirestoreNotificationListener() {
    // No-op: FCM handles notifications cleanly without duplicates.
  }

  /// Stop the Firestore notification listener
  static void stopFirestoreNotificationListener() {
    // No-op
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

  static final Map<String, int> _recentlyDisplayedTimestamps = <String, int>{};

  /// Thread-safe deduplication to guarantee each notification is shown exactly ONCE
  /// across FCM topic, FCM device token, and Firestore snapshot listener.
  static bool _shouldDisplayAndMark(String id, String title, String body) {
    final now = DateTime.now().millisecondsSinceEpoch;
    // Clean entries older than 2 minutes
    _recentlyDisplayedTimestamps.removeWhere((_, timestamp) => now - timestamp > 120000);

    final cleanTitle = title.replaceAll(RegExp(r'^[^\w\s]+'), '').trim().toLowerCase();
    final cleanBody = body.trim().toLowerCase();
    final textKey = 'text:$cleanTitle|$cleanBody';
    final idKey = 'id:$id';

    if ((id.isNotEmpty && _recentlyDisplayedTimestamps.containsKey(idKey)) ||
        (cleanTitle.isNotEmpty && _recentlyDisplayedTimestamps.containsKey(textKey))) {
      debugPrint('[Notifications] Suppressed duplicate notification: "$title"');
      return false;
    }

    if (id.isNotEmpty) _recentlyDisplayedTimestamps[idKey] = now;
    if (cleanTitle.isNotEmpty) _recentlyDisplayedTimestamps[textKey] = now;
    return true;
  }

  /// Handle foreground FCM messages — show a local notification
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    final title = notification.title ?? '';
    final body = notification.body ?? '';

    final notifKey = message.data['notificationId'] as String? ??
        message.messageId ??
        '${notification.title}_${notification.body}';

    if (!_shouldDisplayAndMark(notifKey, title, body)) {
      debugPrint('[FCM] Duplicate notification suppressed: $notifKey');
      return;
    }

    final cleanTitle = title.replaceAll(RegExp(r'^[^\w\s]+'), '').trim().toLowerCase();
    final notifId = (cleanTitle.isNotEmpty ? cleanTitle.hashCode : notifKey.hashCode).abs();

    _localNotifications.show(
      notifId,
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
          tag: 'temple_$notifKey',
          playSound: true,
          enableVibration: true,
          styleInformation: BigTextStyleInformation(notification.body ?? ''),
        ),
      ),
      payload: message.data['actionRoute'] as String?,
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
