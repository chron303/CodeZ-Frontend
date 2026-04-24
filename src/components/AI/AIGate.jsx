// frontend/src/components/AI/AIGate.jsx
// Wrapper that gates AI components behind the toggle.
// Shows a locked state when AI is off.

import { useAI } from './AIToggle.jsx';
import { Zap } from 'lucide-react';

export default function AIGate({ children, compact = false }) {
  const aiEnabled = useAI();

  if (aiEnabled) return children;

  if (compact) {
    // For toolbar buttons — show disabled button
    return (
      <button
        title="Enable AI features using the AI toggle in the navbar"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
          border border-game-border text-slate-700 cursor-not-allowed opacity-50"
      >
        <Zap className="w-3.5 h-3.5"/>
        Hint
      </button>
    );
  }

  // For panels — show locked message
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-game-surface border border-game-border
        flex items-center justify-center mb-3">
        <Zap className="w-5 h-5 text-slate-700"/>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">AI features are off</p>
      <p className="text-slate-700 text-xs leading-relaxed max-w-xs">
        Enable AI using the{' '}
        <span className="text-purple-500 font-medium">AI toggle</span>
        {' '}in the navigation bar to access hints, code review, and your study plan.
      </p>
    </div>
  );
}