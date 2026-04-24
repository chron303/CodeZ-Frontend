// frontend/src/components/AI/AIToggle.jsx
// Toggle button for the nav bar. Shows onboarding slideshow first time.
// Persists AI on/off state to localStorage.

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import AIOnboarding from './AIOnboarding.jsx';

// ── Global AI state helpers ────────────────────────────────────
export function isAIEnabled() {
  return localStorage.getItem('dsa-ai-enabled') === 'true';
}

export function useAI() {
  const [enabled, setEnabled] = useState(isAIEnabled);

  useEffect(() => {
    function handler(e) {
      if (e.key === 'dsa-ai-enabled') setEnabled(e.newValue === 'true');
    }
    window.addEventListener('storage', handler);
    // Also listen to custom event for same-tab updates
    window.addEventListener('ai-toggle', () => setEnabled(isAIEnabled()));
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('ai-toggle', () => {});
    };
  }, []);

  return enabled;
}

export default function AIToggle() {
  const [enabled,    setEnabled]    = useState(isAIEnabled);
  const [showSlides, setShowSlides] = useState(false);

  function toggle() {
    if (!enabled) {
      // Turning ON — show onboarding if not seen
      const seen = localStorage.getItem('dsa-ai-onboarding-seen') === 'true';
      if (!seen) {
        setShowSlides(true);
      }
      localStorage.setItem('dsa-ai-enabled', 'true');
      setEnabled(true);
      window.dispatchEvent(new Event('ai-toggle'));
    } else {
      // Turning OFF
      localStorage.setItem('dsa-ai-enabled', 'false');
      setEnabled(false);
      window.dispatchEvent(new Event('ai-toggle'));
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        title={enabled ? 'AI features ON — click to disable' : 'Enable AI features'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs
          font-medium transition-all duration-300 border
          ${enabled
            ? 'bg-purple-600/25 border-purple-500/50 text-purple-300'
            : 'bg-game-surface border-game-border text-slate-600 hover:text-slate-400'
          }`}
        style={enabled ? {
          boxShadow: '0 0 12px rgba(124,58,237,0.25)',
        } : {}}
      >
        <Zap className={`w-3.5 h-3.5 transition-all ${enabled ? 'text-purple-400' : ''}`}
          style={enabled ? { filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' } : {}}/>
        <span>AI</span>
        {/* Pill indicator */}
        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300
          ${enabled ? 'bg-green-400' : 'bg-slate-600'}`}
          style={enabled ? { boxShadow: '0 0 6px rgba(74,222,128,0.8)' } : {}}/>
      </button>

      {showSlides && (
        <AIOnboarding onClose={() => setShowSlides(false)} />
      )}
    </>
  );
}