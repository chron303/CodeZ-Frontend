// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth, googleProvider, db,
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
} from '../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function loadProfile(firebaseUser) {
    try {
      const ref  = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const profile = {
          displayName: firebaseUser.displayName || '',
          email:       firebaseUser.email || '',
          photoURL:    firebaseUser.photoURL || '',
          isAdmin:     false,
          joinedAt:    serverTimestamp(),
        };
        await setDoc(ref, profile);
        setUserProfile(profile);
        setIsAdmin(false);
      } else {
        const data = snap.data();
        setUserProfile(data);
        setIsAdmin(!!data.isAdmin);
      }
    } catch (err) {
      console.error('loadProfile error:', err);
      setIsAdmin(false);
    }
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function registerWithEmail(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
      displayName,
      email,
      photoURL: '',
      isAdmin:  false,
      joinedAt: serverTimestamp(),
    });
    return result.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      user, userProfile, isAdmin, authLoading,
      loginWithGoogle, loginWithEmail, registerWithEmail, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};