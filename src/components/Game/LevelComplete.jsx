// frontend/src/components/Game/LevelComplete.jsx
//
// Full-screen overlay shown for ~3 seconds when a problem is solved.
// Uses CSS animations only — no external dependencies.
//
// Props:
//   problem    — the solved problem { title, difficulty, topic }
//   xpGained   — XP awarded this solve
//   leveledUp  — boolean, show extra level-up badge if true
//   newLevel   — new level number (shown if leveledUp)
//   streakBonus— XP from streak bonus (0 if no streak)
//   onDismiss  — called when the overlay should close

import { useEffect } from 'react';

const DIFF_COLOR = {
  Easy:   'text-green-400',
  Medium: 'text-yellow-400',
  Hard:   'text-red-400',
};

// Confetti particle data — generated once, static positions
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,           // % from left
  delay: (Math.random() * 0.8).toFixed(2),  // s
  dur: (0.8 + Math.random() * 0.6).toFixed(2), // s
  color: ['#7c3aed','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6'][i % 6],
  size: 6 + Math.floor(Math.random() * 6),    // px
  rotate: Math.floor(Math.random() * 360),
}));

export default function LevelComplete({ problem, xpGained, leveledUp, newLevel, streakBonus, onDismiss }) {
  // Auto-dismiss after 3.5s
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,8,23,0.92)' }}
      onClick={onDismiss}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI.map(p => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: '-10px',
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.id % 3 === 0 ? '50%' : '2px',
              transform: `rotate(${p.rotate}deg)`,
              animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="relative game-card p-8 text-center max-w-sm w-full mx-4"
        style={{ animation: 'levelCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Trophy icon (pixel art via CSS) */}
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="w-full h-full rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <span style={{ fontSize: '32px', lineHeight: 1 }}>🏆</span>
          </div>
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-yellow-400"
            style={{ animation: 'pulseRing 1s ease-out infinite' }}
          />
        </div>

        <p className="pixel text-sm text-yellow-400 mb-1">Level Clear!</p>
        <p className="text-slate-500 text-xs mb-4">Problem solved</p>

        {/* Problem title */}
        <p className="text-white font-semibold text-sm mb-1 leading-snug">{problem.title}</p>
        <p className={`text-xs mb-5 ${DIFF_COLOR[problem.difficulty] ?? 'text-slate-400'}`}>
          {problem.difficulty} · {problem.topic}
        </p>

        {/* XP breakdown */}
        <div className="bg-game-surface rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{problem.difficulty} bonus</span>
            <span className="text-purple-400 font-mono">+{xpGained - streakBonus} XP</span>
          </div>
          {streakBonus > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">🔥 Streak bonus</span>
              <span className="text-orange-400 font-mono">+{streakBonus} XP</span>
            </div>
          )}
          <div className="border-t border-game-border pt-1.5 flex justify-between text-sm font-medium">
            <span className="text-slate-400">Total</span>
            <span className="text-yellow-400 font-mono">+{xpGained} XP</span>
          </div>
        </div>

        {/* Level-up badge */}
        {leveledUp && (
          <div
            className="mb-4 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40"
            style={{ animation: 'levelBadgeIn 0.5s 0.3s ease-out both' }}
          >
            <p className="pixel text-xs text-purple-300">Level Up! → {newLevel}</p>
          </div>
        )}

        <p className="text-slate-700 text-xs">Click anywhere to continue</p>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes levelCardIn {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes levelBadgeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}