import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBKnCXhO27GvKFl64s_O_YRb2QU00XVQw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "temple-darshan-app-d1719.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "temple-darshan-app-d1719",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "temple-darshan-app-d1719.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1046724129762",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1046724129762:web:13c202bbbb9aefa470bfbb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
