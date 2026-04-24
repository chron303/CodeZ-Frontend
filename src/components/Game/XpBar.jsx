// frontend/src/components/Game/XpBar.jsx
//
// Compact HUD displayed in the nav header showing:
//   Level badge · XP progress bar · Streak flame
//
// Animates XP fill when xp changes.

import { useEffect, useRef } from 'react';
import { xpProgress } from '../../utils/progression.js';

export default function XpBar({ progression }) {
  const { level, streak } = progression;
  const { xpIntoLevel, xpNeeded, pct } = xpProgress(progression);
  const barRef = useRef(null);

  // Animate bar width on xp change
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${pct}%`;
    }
  }, [pct]);

  return (
    <div className="flex items-center gap-2">
      {/* Level badge */}
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 shrink-0">
        <span className="text-purple-300 font-bold" style={{ fontSize: '10px' }}>{level}</span>
      </div>

      {/* XP bar */}
      <div className="flex flex-col gap-0.5" style={{ width: '80px' }}>
        <div className="flex justify-between" style={{ fontSize: '9px' }}>
          <span className="text-slate-600">XP</span>
          <span className="text-slate-600 font-mono">{xpIntoLevel}/{xpNeeded}</span>
        </div>
        <div className="h-1.5 bg-game-border rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full bg-purple-500"
            style={{
              width: `${pct}%`,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/25">
          <span style={{ fontSize: '11px' }}>🔥</span>
          <span className="text-orange-400 font-mono" style={{ fontSize: '10px' }}>{streak}</span>
        </div>
      )}
    </div>
  );
}