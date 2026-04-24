// frontend/src/utils/achievements.js
//
// Defines all achievements and checks which ones are unlocked.
//
// Each achievement:
//   id       — unique string key
//   title    — display name
//   desc     — how to earn it
//   icon     — emoji
//   tier     — 'bronze' | 'silver' | 'gold' | 'platinum'
//   check(summary, progression) → boolean

export const ACHIEVEMENTS = [
  // ── First steps ──────────────────────────────────────────────
  {
    id: 'first_solve',
    title: 'First Blood',
    desc: 'Solve your first problem',
    icon: '⚔️',
    tier: 'bronze',
    check: (s, p) => p.totalSolved >= 1,
  },
  {
    id: 'ten_solved',
    title: 'Getting Warmed Up',
    desc: 'Solve 10 problems',
    icon: '🔥',
    tier: 'bronze',
    check: (s, p) => p.totalSolved >= 10,
  },
  {
    id: 'fifty_solved',
    title: 'On a Roll',
    desc: 'Solve 50 problems',
    icon: '🚀',
    tier: 'silver',
    check: (s, p) => p.totalSolved >= 50,
  },
  {
    id: 'hundred_solved',
    title: 'Centurion',
    desc: 'Solve 100 problems',
    icon: '💯',
    tier: 'gold',
    check: (s, p) => p.totalSolved >= 100,
  },

  // ── Difficulty ────────────────────────────────────────────────
  {
    id: 'hard_first',
    title: 'Brave Soul',
    desc: 'Solve a Hard problem',
    icon: '💀',
    tier: 'silver',
    check: (s, p) => p.recentEvents?.some(e => e.difficulty === 'Hard'),
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
    check: (s) => s.topics?.some(t => t.percentage === 100),
  },
  {
    id: 'all_topics',
    title: 'Polymath',
    desc: 'Solve at least one problem in every topic',
    icon: '🌐',
    tier: 'gold',
    check: (s) => s.topics?.every(t => t.solved > 0),
  },

  // ── Streaks ───────────────────────────────────────────────────
  {
    id: 'streak_3',
    title: 'Consistent',
    desc: 'Maintain a 3-day streak',
    icon: '🔥',
    tier: 'bronze',
    check: (s, p) => p.streak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    desc: 'Maintain a 7-day streak',
    icon: '📅',
    tier: 'silver',
    check: (s, p) => p.streak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    desc: 'Maintain a 30-day streak',
    icon: '⚡',
    tier: 'platinum',
    check: (s, p) => p.streak >= 30,
  },

  // ── XP / Levels ───────────────────────────────────────────────
  {
    id: 'level_5',
    title: 'Rising Star',
    desc: 'Reach Level 5',
    icon: '⭐',
    tier: 'silver',
    check: (s, p) => p.level >= 5,
  },
  {
    id: 'level_10',
    title: 'Veteran',
    desc: 'Reach Level 10',
    icon: '🌟',
    tier: 'gold',
    check: (s, p) => p.level >= 10,
  },

  // ── Completion ────────────────────────────────────────────────
  {
    id: 'halfway',
    title: 'Halfway There',
    desc: 'Solve 50% of your problem list',
    icon: '🎯',
    tier: 'silver',
    check: (s) => s.overallPct >= 50,
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
      if (!p.recentEvents) return false;
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
  bronze:   { bg: 'bg-amber-900/30',    border: 'border-amber-700/40',   text: 'text-amber-400',   badge: 'Bronze' },
  silver:   { bg: 'bg-slate-700/30',    border: 'border-slate-500/40',   text: 'text-slate-300',   badge: 'Silver' },
  gold:     { bg: 'bg-yellow-900/30',   border: 'border-yellow-600/40',  text: 'text-yellow-400',  badge: 'Gold' },
  platinum: { bg: 'bg-purple-900/30',   border: 'border-purple-500/40',  text: 'text-purple-300',  badge: 'Platinum' },
};

export function getTierStyle(tier) {
  return TIER_COLOR[tier] ?? TIER_COLOR.bronze;
}

// Returns achievements sorted by tier desc, with unlocked flag
export function evaluateAchievements(summary, progression) {
  return ACHIEVEMENTS
    .map(a => ({
      ...a,
      unlocked: a.check(summary, progression),
    }))
    .sort((a, b) => {
      // Unlocked first, then by tier desc
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
    });
}