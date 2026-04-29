// frontend/src/context/PremiumContext.jsx
// Single source of truth for premium state across the app.
// Reads from Firestore users/{uid} in real-time.
// Works with: Razorpay payments, manual admin grants, expiry checks.

import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from './AuthContext.jsx';

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const { user } = useAuth();
  const [premium,     setPremium]     = useState(false);
  const [premiumInfo, setPremiumInfo] = useState(null); // full record
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) {
      setPremium(false);
      setPremiumInfo(null);
      setLoading(false);
      return;
    }

    // Real-time listener — updates instantly when admin grants/revokes
    const unsub = onSnapshot(doc(db, 'users', user.uid), function(snap) {
      if (!snap.exists()) {
        setPremium(false);
        setPremiumInfo(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Check expiry
      let active = false;
      let info   = null;

      if (data.premium) {
        const expires = data.premiumExpiresAt?.toDate?.();
        if (!expires || expires > new Date()) {
          active = true;
          info   = {
            plan:      data.premiumPlan || 'manual',
            expiresAt: expires || null,
            grantedBy: data.premiumGrantedBy || 'payment',
            activatedAt: data.premiumActivatedAt?.toDate?.() || null,
            paymentId:  data.lastPaymentId || null,
          };
        }
      }

      setPremium(active);
      setPremiumInfo(info);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  // Friendly expiry string
  function expiryText() {
    if (!premiumInfo?.expiresAt) return 'Lifetime';
    const d = premiumInfo.expiresAt;
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  }

  // Days remaining
  function daysRemaining() {
    if (!premiumInfo?.expiresAt) return null;
    const diff = premiumInfo.expiresAt - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <PremiumContext.Provider value={{
      premium,
      premiumInfo,
      loading,
      expiryText,
      daysRemaining,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be inside PremiumProvider');
  return ctx;
}