import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB45Jge0-TUpgYjvh_cICl8XPLJ-n0huEE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pawcation-c45d6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pawcation-c45d6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pawcation-c45d6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "626035465977",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:626035465977:web:9922db084a03847e9c0c28",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y7QXVYCLTM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Connected to Firebase Emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase Emulators:', error);
  }
}

export default app;
