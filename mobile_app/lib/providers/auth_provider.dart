import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  UserModel? _userModel;
  UserModel? get userModel => _userModel;
  
  bool _isLoading = true;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _auth.authStateChanges().listen((User? user) async {
      if (user != null) {
        await _fetchUserProfile(user.uid);
      } else {
        _userModel = null;
      }
      _isLoading = false;
      notifyListeners();
    });
  }

  Future<void> _fetchUserProfile(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists) {
        _userModel = UserModel.fromFirestore(doc);
        // Automatically sync phone_lookup for instant future mobile logins
        _cachePhoneMapping(_userModel?.phone, _userModel?.email);
      } else {
        // Fallback for users missing a Firestore profile (e.g. manually created accounts)
        final user = _auth.currentUser;
        _userModel = UserModel(
          id: uid,
          name: user?.displayName ?? 'Devotee',
          email: user?.email ?? '',
          phone: user?.phoneNumber ?? '',
        );
      }
    } catch (e) {
      debugPrint("Error fetching user profile: $e");
    }
  }

  void _cachePhoneMapping(String? phone, String? email) {
    if (phone == null || email == null) return;
    final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final last10 = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;
    if (last10.isNotEmpty && email.trim().isNotEmpty) {
      _firestore.collection('phone_lookup').doc(last10).set({
        'email': email.trim().toLowerCase(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true)).catchError((_) {});
    }
  }

  Future<String?> login(String identifier, String password) async {
    try {
      final trimmed = identifier.trim();
      String emailToAuth = trimmed;

      if (!trimmed.contains('@')) {
        // Devotee entered a mobile number
        final digits = trimmed.replaceAll(RegExp(r'[^0-9]'), '');
        if (digits.length < 10) {
          return 'Please enter a valid 10-digit mobile number or email.';
        }
        final last10 = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;

        String? resolvedEmail;

        // 1. Direct fast check in phone_lookup collection
        try {
          final doc = await _firestore.collection('phone_lookup').doc(last10).get();
          if (doc.exists && doc.data()?['email'] != null) {
            resolvedEmail = (doc.data()!['email'] as String).trim();
          }
        } catch (e) {
          debugPrint('Fast phone lookup error: $e');
        }

        // 2. Cloud Function fallback (searches users collection via Admin SDK)
        if (resolvedEmail == null || resolvedEmail.isEmpty) {
          try {
            final callable = _functions.httpsCallable('getEmailByPhone');
            final res = await callable.call({'phone': digits});
            if (res.data is Map && res.data['email'] != null) {
              resolvedEmail = (res.data['email'] as String).trim();
            }
          } on FirebaseFunctionsException catch (fe) {
            debugPrint('Cloud Function getEmailByPhone error: ${fe.code} - ${fe.message}');
            if (fe.code == 'not-found') {
              return 'No devotee account found with mobile number $digits. Please register or check the number.';
            }
          } catch (e) {
            debugPrint('Cloud function callable error: $e');
          }
        }

        if (resolvedEmail == null || resolvedEmail.isEmpty) {
          return 'No devotee account found with mobile number $digits. Please check the number or register.';
        }

        emailToAuth = resolvedEmail;
      }

      await _auth.signInWithEmailAndPassword(
        email: emailToAuth.trim(),
        password: password,
      );
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return _mapAuthError(e.code, e.message);
    } catch (e) {
      return "An unexpected error occurred. Please try again.";
    }
  }

  Future<String?> register(String name, String phone, String email, String password) async {
    try {
      final UserCredential cred = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      if (cred.user != null) {
        // Create user profile in Firestore matching rules
        await _firestore.collection('users').doc(cred.user!.uid).set({
          'name': name.trim(),
          'phone': phone.trim(),
          'email': email.trim(),
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });

        // Store fast phone-to-email mapping
        _cachePhoneMapping(phone, email);

        await _fetchUserProfile(cred.user!.uid);
        return null; // Success
      }
      return "Registration could not be completed. Please try again.";
    } on FirebaseAuthException catch (e) {
      return _mapAuthError(e.code, e.message);
    } catch (e) {
      return "Registration failed: ${e.toString()}";
    }
  }

  Future<String?> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return _mapAuthError(e.code, e.message);
    } catch (e) {
      return "Unable to send reset link. Please try again.";
    }
  }

  Future<void> logout() async {
    await _auth.signOut();
  }

  String _mapAuthError(String code, String? defaultMessage) {
    switch (code) {
      case 'user-not-found':
        return 'No devotee account found with this email.';
      case 'wrong-password':
      case 'invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'email-already-in-use':
        return 'An account already exists with this email.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'network-request-failed':
        return 'Network connection issue. Please check your internet connection.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait a few moments and try again.';
      default:
        return defaultMessage ?? 'Authentication error. Please try again.';
    }
  }
}
