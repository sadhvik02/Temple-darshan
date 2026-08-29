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
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return e.message ?? "An error occurred during login.";
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> register(String name, String phone, String email, String password) async {
    try {
      UserCredential cred = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      if (cred.user != null) {
        // Create user profile in Firestore
        await _firestore.collection('users').doc(cred.user!.uid).set({
          'name': name,
          'phone': phone,
          'email': email,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
        return null; // Success
      }
      return "Registration failed.";
    } on FirebaseAuthException catch (e) {
      return e.message ?? "An error occurred during registration.";
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> logout() async {
    await _auth.signOut();
  }
}
