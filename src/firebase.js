// frontend/src/firebase.js
// Firebase SDK initialization.
// This file uses the project config — update with your own values
// from Firebase Console → Project Settings → Your apps → Web app.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ── Your Firebase project config ──────────────────────────────
// Replace these values with your own from the Firebase console.
const firebaseConfig = {
  apiKey:            "AIzaSyAoSTTpAvUAfwgTkOmU1tHHO5-ti8ZAZFM",
  authDomain:        "dsa-quest-865d4.firebaseapp.com",
  projectId:         "dsa-quest-865d4",
  storageBucket:     "dsa-quest-865d4.firebasestorage.app",
  messagingSenderId: "1094610145496",
  appId:             "1:1094610145496:web:47cc24b01e1f78a76bc7ad",
};
// ──────────────────────────────────────────────────────────────

const app            = initializeApp(firebaseConfig);
const auth           = getAuth(app);
const db             = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};