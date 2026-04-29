// frontend/src/components/AI/AIGate.jsx
// Gates AI features behind BOTH:
//   1. AI toggle (user must opt in)
//   2. Premium subscription

import { Zap, Crown } from 'lucide-react';
import { useAI } from './AIToggle.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';

export default function AIGate({ children, compact = false, onUpgrade }) {
  const aiEnabled        = useAI();
  const { premium, loading } = usePremium();

  if (loading) return compact ? null : children;

  // AI toggle off
  if (!aiEnabled) {
    if (compact) return (
      <button title="Enable AI in the navbar first"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
          border border-game-border text-slate-700 cursor-not-allowed opacity-50">
        <Zap className="w-3.5 h-3.5"/>Hint
      </button>
    );
    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
        <Zap className="w-8 h-8 text-slate-700 mb-3"/>
        <p className="text-slate-500 text-sm font-medium mb-1">AI features are off</p>
        <p className="text-slate-700 text-xs">
          Enable AI using the <span className="text-purple-500">AI toggle</span> in the navbar.
        </p>
      </div>
    );
  }

  // AI on but not premium
  if (!premium) {
    if (compact) return (
      <button onClick={onUpgrade}
        title="Premium required for AI features"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
          border border-yellow-500/30 text-yellow-600 hover:text-yellow-400
          bg-yellow-500/5 transition-colors">
        <Crown className="w-3.5 h-3.5"/>Hint
      </button>
    );
    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
        <Crown className="w-8 h-8 text-yellow-500 mb-3"/>
        <p className="text-white text-sm font-medium mb-1">Premium Required</p>
        <p className="text-slate-500 text-xs mb-3">
          AI features are available for Premium members only.
        </p>
        {onUpgrade && (
          <button onClick={onUpgrade}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            Upgrade — ₹99/mo
          </button>
        )}
      </div>
    );
  }

  // AI on + premium = show content
  return children;
}