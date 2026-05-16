// frontend/src/utils/achievements.js
//
// Defines all achievements and checks which ones are unlocked.
//
// IMPORTANT: solve-count checks use `summary` (computed live from actual Firestore
// solve state) NOT `progression.totalSolved` (a running counter that never decrements
// when problems are deleted). This prevents ghost achievements showing when
// problems are deleted from the bank.
//
// Rule of thumb:
//   summary  → use for: solved count, topic completion, overall %
//   progression → use for: streak, level, XP, recentEvents

export const ACHIEVEMENTS = [
  // ── First steps ──────────────────────────────────────────────
  {
    id: 'first_solve',
    title: 'First Blood',
    desc: 'Solve your first problem',
    icon: '⚔️',
    tier: 'bronze',
    check: (s, p) => s.totalSolved >= 1,          // ← summary, not progression
  },
  {
    id: 'ten_solved',
    title: 'Getting Warmed Up',
    desc: 'Solve 10 problems',
    icon: '🔥',
    tier: 'bronze',
    check: (s, p) => s.totalSolved >= 10,
  },
  {
    id: 'fifty_solved',
    title: 'On a Roll',
    desc: 'Solve 50 problems',
    icon: '🚀',
    tier: 'silver',
    check: (s, p) => s.totalSolved >= 50,
  },
  {
    id: 'hundred_solved',
    title: 'Centurion',
    desc: 'Solve 100 problems',
    icon: '💯',
    tier: 'gold',
    check: (s, p) => s.totalSolved >= 100,
  },

  // ── Difficulty ────────────────────────────────────────────────
  {
    id: 'hard_first',
    title: 'Brave Soul',
    desc: 'Solve a Hard problem',
    icon: '💀',
    tier: 'silver',
    // recentEvents is fine here — it records what was actually solved
    check: (s, p) => p.recentEvents?.some(e => e.difficulty === 'Hard') ?? false,
  },
  {
    id: 'five_hard',
    title: 'Hardened',
    desc: 'Solve 5 Hard problems',
    icon: '🗡️',
    tier: 'gold',
    check: (s, p) => (p.recentEvents?.filter(e => e.difficulty === 'Hard').length ?? 0) >= 5,
  },

  // ── Topics ────────────────────────────────────────────────────
  {
    id: 'topic_master',
    title: 'Topic Master',
    desc: 'Complete all problems in any topic',
    icon: '🏛️',
    tier: 'silver',
    check: (s) => s.topics?.some(t => t.percentage === 100 && t.total > 0) ?? false,
  },
  {
    id: 'all_topics',
    title: 'Polymath',
    desc: 'Solve at least one problem in every topic',
    icon: '🌐',
    tier: 'gold',
    check: (s) => (s.topics?.length > 0) && s.topics.every(t => t.solved > 0),
  },

  // ── Streaks ───────────────────────────────────────────────────
  {
    id: 'streak_3',
    title: 'Consistent',
    desc: 'Maintain a 3-day streak',
    icon: '🔥',
    tier: 'bronze',
    // streak is time-based, lives correctly in progression
    check: (s, p) => (p.streak ?? 0) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    desc: 'Maintain a 7-day streak',
    icon: '📅',
    tier: 'silver',
    check: (s, p) => (p.streak ?? 0) >= 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    desc: 'Maintain a 30-day streak',
    icon: '⚡',
    tier: 'platinum',
    check: (s, p) => (p.streak ?? 0) >= 30,
  },

  // ── XP / Levels ───────────────────────────────────────────────
  // Level is earned over time and tied to XP — keep in progression.
  // BUT guard with s.totalSolved > 0 so a wiped bank doesn't
  // show level achievements when no problems are actually solved.
  {
    id: 'level_5',
    title: 'Rising Star',
    desc: 'Reach Level 5',
    icon: '⭐',
    tier: 'silver',
    check: (s, p) => s.totalSolved > 0 && (p.level ?? 0) >= 5,
  },
  {
    id: 'level_10',
    title: 'Veteran',
    desc: 'Reach Level 10',
    icon: '🌟',
    tier: 'gold',
    check: (s, p) => s.totalSolved > 0 && (p.level ?? 0) >= 10,
  },

  // ── Completion ────────────────────────────────────────────────
  {
    id: 'halfway',
    title: 'Halfway There',
    desc: 'Solve 50% of your problem list',
    icon: '🎯',
    tier: 'silver',
    check: (s) => s.totalProblems > 0 && s.overallPct >= 50,
  },
  {
    id: 'completionist',
    title: 'Completionist',
    desc: 'Solve every problem in your list',
    icon: '🏆',
    tier: 'platinum',
    check: (s) => s.overallPct === 100 && s.totalProblems > 0,
  },

  // ── Speed ─────────────────────────────────────────────────────
  {
    id: 'five_in_day',
    title: 'Grinder',
    desc: 'Solve 5 problems in one day',
    icon: '⚙️',
    tier: 'bronze',
    check: (s, p) => {
      if (!p.recentEvents?.length) return false;
      const today = new Date().toISOString().slice(0, 10);
      const todayCount = p.recentEvents.filter(e => {
        const d = new Date(e.ts).toISOString().slice(0, 10);
        return d === today;
      }).length;
      return todayCount >= 5;
    },
  },
];

const TIER_ORDER = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
const TIER_COLOR = {
  bronze:   { bg:'bg-amber-900/30',  border:'border-amber-700/40',  text:'text-amber-400',  badge:'Bronze'   },
  silver:   { bg:'bg-slate-700/30',  border:'border-slate-500/40',  text:'text-slate-300',  badge:'Silver'   },
  gold:     { bg:'bg-yellow-900/30', border:'border-yellow-600/40', text:'text-yellow-400', badge:'Gold'     },
  platinum: { bg:'bg-purple-900/30', border:'border-purple-500/40', text:'text-purple-300', badge:'Platinum' },
};

export function getTierStyle(tier) {
  return TIER_COLOR[tier] ?? TIER_COLOR.bronze;
}

// Returns achievements sorted by tier desc, with unlocked flag.
// summary  — computed live from actual solve state (never stale)
// progression — XP, level, streak (time-based, persisted in Firestore)
export function evaluateAchievements(summary, progression) {
  // Guard: if no problems exist, nothing should be unlocked
  // (handles the case where problems were deleted from the bank)
  const safeSummary     = summary     || { totalSolved:0, totalProblems:0, overallPct:0, topics:[] };
  const safeProgression = progression || { level:0, streak:0, xp:0, recentEvents:[] };

  return ACHIEVEMENTS
    .map(a => ({
      ...a,
      unlocked: safeSummary.totalProblems > 0
        ? a.check(safeSummary, safeProgression)
        : false,  // no problems in bank = nothing unlocked
    }))
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
    });
}