// frontend/src/components/Premium/PremiumGate.jsx
// Wrapper that blocks content behind premium wall.
// Shows upgrade modal when non-premium user tries to access.

import { useState } from 'react';
import { Crown, Lock, Zap, X } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext.jsx';

// ── Upgrade Modal ──────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade, reason }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-sm game-card overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(124,58,237,0.3)' }}
        onClick={e => e.stopPropagation()}>

        {/* Purple gradient top */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#7c3aed,#1d4ed8)' }}/>

        <button onClick={onClose}
          className="absolute top-3 right-3 text-slate-600 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4"/>
        </button>

        <div className="p-6 text-center space-y-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(29,78,216,0.3))',
                     border: '1px solid rgba(124,58,237,0.4)' }}>
            <Crown className="w-7 h-7 text-purple-400"/>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-1">Premium Feature</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {reason || 'This feature is available for Premium members only.'}
            </p>
          </div>

          {/* Feature list */}
          <div className="text-left space-y-2 py-2">
            {[
              'AI Hints — get unstuck instantly',
              'AI Code Review after solving',
              'Personalized Study Plan',
              'Premium problems unlocked',
              'Full solutions in 3 languages',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                <Zap className="w-3 h-3 text-purple-400 shrink-0"/>
                {f}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button onClick={onUpgrade}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all
                hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)',
                       boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}>
              Upgrade to Premium — ₹99/mo
            </button>
            <button onClick={onClose}
              className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PremiumGate ────────────────────────────────────────────────
// Usage:
//   <PremiumGate reason="AI Hints require Premium">
//     <HintButton ... />
//   </PremiumGate>
//
//   <PremiumGate locked={problem.isPremium} compact onUpgrade={() => setTab('premium')}>
//     <EditorView ... />
//   </PremiumGate>

export default function PremiumGate({
  children,
  reason,
  compact = false,
  onUpgrade,
  locked,        // override — pass true to always lock regardless of premium
}) {
  const { premium, loading } = usePremium();
  const [showModal, setShowModal]   = useState(false);

  if (loading) return children; // don't flash gate while loading

  const isLocked = locked !== undefined ? locked : !premium;

  if (!isLocked) return children;

  function handleUpgrade() {
    setShowModal(false);
    if (onUpgrade) onUpgrade();
  }

  // Compact mode — for toolbar buttons, inline locks
  if (compact) {
    return (
      <>
        <div onClick={() => setShowModal(true)} className="cursor-pointer">
          <div className="relative pointer-events-none select-none opacity-50">
            {children}
          </div>
          <Lock className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400"/>
        </div>
        {showModal && (
          <UpgradeModal reason={reason} onClose={() => setShowModal(false)} onUpgrade={handleUpgrade}/>
        )}
      </>
    );
  }

  // Full block mode — for problem editor, page sections
  return (
    <>
      <div className="relative">
        {/* Blurred preview */}
        <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.4 }}>
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(15,14,23,0.7)', backdropFilter: 'blur(2px)' }}>
          <div className="text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center
              bg-purple-500/20 border border-purple-500/30">
              <Crown className="w-6 h-6 text-purple-400"/>
            </div>
            <p className="text-white font-semibold text-sm">Premium Problem</p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              {reason || 'Subscribe to Premium to unlock this problem and all AI features.'}
            </p>
            <button onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all
                hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)',
                       boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
              Unlock with Premium
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <UpgradeModal reason={reason} onClose={() => setShowModal(false)} onUpgrade={handleUpgrade}/>
      )}
    </>
  );
}