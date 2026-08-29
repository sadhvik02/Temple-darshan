import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for ios - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBBKnCXhO27GvKFl64s_O_YRb2QU00XVQw',
    appId: '1:1046724129762:web:13c202bbbb9aefa470bfbb',
    messagingSenderId: '1046724129762',
    projectId: 'temple-darshan-app-d1719',
    authDomain: 'temple-darshan-app-d1719.firebaseapp.com',
    storageBucket: 'temple-darshan-app-d1719.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBBKnCXhO27GvKFl64s_O_YRb2QU00XVQw',
    appId: '1:1046724129762:android:8ef7578c4070730f70bfbb',
    messagingSenderId: '1046724129762',
    projectId: 'temple-darshan-app-d1719',
    storageBucket: 'temple-darshan-app-d1719.firebasestorage.app',
  );
}
