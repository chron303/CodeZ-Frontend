// frontend/src/components/Dashboard/Dashboard.jsx

import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Trophy, Target, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import SolveHeatmap     from '../Stats/SolveHeatmap.jsx';
import AchievementsGrid from '../Stats/AchievementsGrid.jsx';
import LeetCodeSync     from '../Stats/LeetCodeSync.jsx';
import MockReportCards  from '../Mock/MockReportCards.jsx';
import { xpProgress }   from '../../utils/progression.js';
import StudyPlan        from '../AI/StudyPlan.jsx';
import ReviewDashboard  from '../Review/ReviewDashboard.jsx';
import { usePremium }   from '../../context/PremiumContext.jsx';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="game-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-game-surface flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
        <p className="text-slate-500 text-xs mt-0.5">{label}</p>
        {sub && <p className="text-slate-700 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressRing({ pct, size = 96, stroke = 10 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2d2a45" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7c3aed" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

function WeakTopicRow({ topic, rank }) {
  const pct      = topic.percentage;
  const barColor = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-yellow-500' : 'bg-green-500';
  const txtColor = pct < 20 ? 'text-red-400' : pct < 50 ? 'text-yellow-400' : 'text-green-400';
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-slate-700 w-4 text-center font-mono">{rank}</span>
      <span className="text-sm text-slate-300 w-36 truncate shrink-0">{topic.topic}</span>
      <div className="flex-1 bg-game-surface rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-10 text-right ${txtColor}`}>{pct}%</span>
      <span className="text-xs text-slate-600 w-14 text-right">{topic.total - topic.solved} left</span>
    </div>
  );
}

function XpCard({ progression }) {
  const { xpIntoLevel, xpNeeded, pct } = xpProgress(progression);
  return (
    <div className="game-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <p className="pixel text-xs text-purple-400">Progression</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-purple-600/20 border border-purple-500/30 flex flex-col items-center justify-center shrink-0">
          <span className="text-purple-300 text-xs">Lv</span>
          <span className="text-white font-bold text-xl leading-none">{progression.level}</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">XP to next level</span>
            <span className="text-purple-400 font-mono">{xpIntoLevel}/{xpNeeded}</span>
          </div>
          <div className="h-2 bg-game-surface rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-slate-600">Total XP: <span className="text-slate-400 font-mono">{progression.xp}</span></span>
            {progression.streak > 0 && (
              <span className="text-orange-400">🔥 {progression.streak} day streak</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ progression }) {
  const events = progression?.recentEvents ?? [];
  if (events.length === 0) return null;
  return (
    <div className="game-card p-4">
      <p className="pixel text-xs text-slate-400 mb-3">Recent Activity</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-game-border last:border-0">
            <span className="text-slate-700 shrink-0 font-mono w-20">
              {new Date(e.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className="flex-1 text-slate-400 truncate">{e.label}</span>
            {e.difficulty && (
              <span className={`shrink-0 ${
                e.difficulty === 'Easy'   ? 'text-green-500' :
                e.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
              }`}>{e.difficulty[0]}</span>
            )}
            <span className="text-purple-400 font-mono shrink-0">+{e.xp} XP</span>
            {e.streak && <span className="text-orange-400 shrink-0">🔥</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AllTopicsTable({ topics }) {
  const sorted = [...topics].sort((a, b) => b.percentage - a.percentage);
  return (
    <div className="game-card p-4">
      <p className="pixel text-xs text-slate-400 mb-4">All Topics</p>
      <div className="space-y-2">
        {sorted.map(t => (
          <div key={t.topic} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-36 truncate shrink-0">{t.topic}</span>
            <div className="flex-1 bg-game-surface rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${t.percentage}%`,
                  background: t.percentage === 100 ? '#10b981' : t.percentage >= 50 ? '#f59e0b' : '#7c3aed' }} />
            </div>
            <span className="text-xs font-mono text-slate-500 w-14 text-right">{t.solved}/{t.total}</span>
            <span className={`text-xs font-mono w-10 text-right ${t.percentage === 100 ? 'text-green-400' : 'text-slate-600'}`}>
              {t.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressControls() {
  const { exportProgress, resetProgress, showToast } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  function handleExport() { exportProgress(); }
  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetProgress(); setConfirmReset(false); showToast('Progress has been reset.');
  }

  return (
    <div className="game-card p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-400 mb-0.5">Manage Data</p>
        <p className="text-xs text-slate-600">Export your progress or start fresh</p>
      </div>
      <div className="flex gap-2">
        <button onClick={handleExport}
          className="px-3 py-1.5 text-xs rounded-lg bg-game-surface border border-game-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          Export CSV
        </button>
        <button onClick={handleReset} onBlur={() => setConfirmReset(false)}
          className={"px-3 py-1.5 text-xs rounded-lg border transition-colors " + (confirmReset
            ? "bg-red-500/20 border-red-500/40 text-red-400"
            : "bg-game-surface border-game-border text-slate-600 hover:text-red-400 hover:border-red-500/40")}>
          {confirmReset ? "Confirm reset?" : "Reset progress"}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function Dashboard({ onPractice }) {
  const { topics, summary, progression } = useApp();
  const { premium } = usePremium();

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-700">
        <p className="pixel text-xs">No data yet — upload a CSV first</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Spaced Repetition Reviews ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">Review Schedule</h3>
          <span className="text-xs text-slate-600">Spaced repetition</span>
        </div>
        <ReviewDashboard onPractice={onPractice} />
      </div>

      {/* ── AI Study Plan ── */}
      <StudyPlan />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}   label="Problems" value={summary.totalProblems}    color="text-slate-300" />
        <StatCard icon={Trophy}     label="Solved"   value={summary.totalSolved}       color="text-green-400" />
        <StatCard icon={Target}     label="Topics"   value={summary.totalTopics}       color="text-purple-400" />
        <StatCard icon={TrendingUp} label="Complete" value={`${summary.overallPct}%`} color="text-blue-400" />
      </div>

      {/* ── Progress ring + Weak topics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="game-card p-5 flex items-center gap-5">
          <div className="relative shrink-0">
            <ProgressRing pct={summary.overallPct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{summary.overallPct}%</span>
            </div>
          </div>
          <div>
            <p className="pixel text-xs text-purple-400 mb-2">Overall</p>
            <p className="text-slate-400 text-sm">
              <span className="text-green-400 font-medium">{summary.totalSolved}</span>
              {' '}of{' '}
              <span className="text-white font-medium">{summary.totalProblems}</span>
              {' '}solved
            </p>
            {summary.overallPct === 100 && <p className="pixel text-xs text-yellow-400 mt-2">🏆 All done!</p>}
            {summary.overallPct < 100 && (
              <p className="text-slate-600 text-xs mt-1">{summary.totalProblems - summary.totalSolved} remaining</p>
            )}
          </div>
        </div>

        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="pixel text-xs text-yellow-400">Focus Areas</p>
          </div>
          <p className="text-xs text-slate-600 mb-2">Lowest completion — tackle these first</p>
          <div className="divide-y divide-game-border">
            {summary.weakTopics.map((t, i) => <WeakTopicRow key={t.topic} topic={t} rank={i + 1} />)}
          </div>
        </div>
      </div>

      {/* ── XP Progression ── */}
      {progression && <XpCard progression={progression} />}

      {/* ── Heatmap ── */}
      {progression && (
        <div className="game-card p-4">
          <SolveHeatmap progression={progression} />
        </div>
      )}

      {/* ── Achievements ── */}
      <div className="game-card p-4">
        <AchievementsGrid />
      </div>

      {/* ── Mock Interview Report Cards (premium only) ── */}
      {premium && (
        <div className="game-card p-4">
          <MockReportCards />
        </div>
      )}

      {/* ── LeetCode Sync ── */}
      <LeetCodeSync />

      {/* ── Recent activity ── */}
      {progression && <ActivityFeed progression={progression} />}

      {/* ── All topics table ── */}
      <AllTopicsTable topics={topics} />

      {/* ── Export / Reset ── */}
      <ProgressControls />
    </div>
  );
}