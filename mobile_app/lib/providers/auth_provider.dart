import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

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
      }
    } catch (e) {
      debugPrint("Error fetching user profile: $e");
    }
  }

  Future<String?> login(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(
        email: email.trim(),
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
