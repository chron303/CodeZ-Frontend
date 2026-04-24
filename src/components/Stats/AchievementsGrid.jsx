// frontend/src/components/Stats/AchievementsGrid.jsx
//
// Displays all achievements as a grid of cards.
// Unlocked achievements show full color; locked ones are dimmed with a lock.

import { evaluateAchievements, getTierStyle } from '../../utils/achievements.js';
import { useApp } from '../../context/AppContext.jsx';

function AchievementCard({ achievement }) {
  const { unlocked, icon, title, desc, tier } = achievement;
  const ts = getTierStyle(tier);

  return (
    <div className={`
      relative rounded-xl border p-3 flex flex-col items-center text-center gap-2
      transition-all duration-300
      ${unlocked
        ? `${ts.bg} ${ts.border}`
        : 'bg-game-surface border-game-border opacity-40 grayscale'
      }
    `}>
      {/* Tier badge */}
      <div className={`absolute top-1.5 right-1.5 text-xs px-1 rounded ${ts.text}`}
           style={{ fontSize: '8px', fontFamily: '"Press Start 2P", monospace' }}>
        {ts.badge}
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
        ${unlocked ? ts.bg : 'bg-game-card'} border ${unlocked ? ts.border : 'border-game-border'}`}>
        {unlocked ? icon : '🔒'}
      </div>

      {/* Title & desc */}
      <div>
        <p className={`text-xs font-semibold ${unlocked ? ts.text : 'text-slate-600'}`}>{title}</p>
        <p className="text-slate-600 mt-0.5" style={{ fontSize: '10px' }}>{desc}</p>
      </div>

      {/* Unlocked shimmer */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-10"
               style={{ background: 'linear-gradient(135deg, white 0%, transparent 60%)' }} />
        </div>
      )}
    </div>
  );
}

export default function AchievementsGrid() {
  const { summary, progression } = useApp();
  const achievements = evaluateAchievements(summary, progression);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="pixel text-xs text-yellow-400">Achievements</p>
        <p className="text-xs text-slate-600">{unlockedCount}/{achievements.length} unlocked</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {achievements.map(a => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  );
}