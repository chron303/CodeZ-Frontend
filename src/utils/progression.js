// frontend/src/utils/progression.js
//
// XP and streak system for Phase 3.
// Persisted in localStorage so progress survives page refreshes.
//
// XP awards:
//   Easy   solved → +10 XP
//   Medium solved → +25 XP
//   Hard   solved → +50 XP
//   Daily streak bonus → +5 XP per day
//
// Levels: XP thresholds double each level starting at 100.
//   Level 1 → 0–99 XP
//   Level 2 → 100–299 XP
//   Level 3 → 300–699 XP  (threshold = prev + 200 * level)

const STORAGE_KEY = 'dsa-quest-progression';

const XP_PER_DIFFICULTY = { Easy: 10, Medium: 25, Hard: 50 };

// ── Level thresholds ────────────────────────────────────────────
// Returns XP needed to reach a given level
function xpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += 100 + (l - 1) * 50;
  return total;
}

// Returns which level a given XP total corresponds to
function levelForXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

// ── Load / save ────────────────────────────────────────────────
export function loadProgression() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultProgression();
}

export function saveProgression(prog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
  } catch {}
}

function defaultProgression() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastSolveDate: null,   // ISO date string (YYYY-MM-DD)
    totalSolved: 0,
    solvedIds: [],         // problem ids solved this session
    recentEvents: [],      // [{ type, label, xp, ts }] for the feed
  };
}

// ── Award XP for solving a problem ────────────────────────────
// Returns { newProg, xpGained, leveledUp, newLevel }
export function awardSolve(currentProg, problem) {
  // Don't double-award the same problem
  if (currentProg.solvedIds.includes(problem.id)) {
    return { newProg: currentProg, xpGained: 0, leveledUp: false, newLevel: currentProg.level };
  }

  const baseXp   = XP_PER_DIFFICULTY[problem.difficulty] ?? 10;
  const today    = new Date().toISOString().slice(0, 10);
  const lastDate = currentProg.lastSolveDate;

  // Streak: consecutive calendar days
  let streak = currentProg.streak;
  let streakBonus = 0;

  if (lastDate === today) {
    // Same day — streak unchanged
  } else if (lastDate === prevDay(today)) {
    // Consecutive day — extend streak
    streak += 1;
    streakBonus = 5;
  } else {
    // Streak broken
    streak = 1;
  }

  const xpGained   = baseXp + streakBonus;
  const oldLevel   = currentProg.level;
  const newXp      = currentProg.xp + xpGained;
  const newLevel   = levelForXp(newXp);
  const leveledUp  = newLevel > oldLevel;

  const event = {
    type: 'solve',
    label: problem.title,
    xp: xpGained,
    difficulty: problem.difficulty,
    streak: streakBonus > 0 ? streak : null,
    ts: Date.now(),
  };

  const newProg = {
    ...currentProg,
    xp: newXp,
    level: newLevel,
    streak,
    lastSolveDate: today,
    totalSolved: currentProg.totalSolved + 1,
    solvedIds: [...currentProg.solvedIds, problem.id],
    recentEvents: [event, ...currentProg.recentEvents].slice(0, 20),
  };

  return { newProg, xpGained, leveledUp, newLevel, streakBonus };
}

// ── XP progress within current level ─────────────────────────
export function xpProgress(prog) {
  const currentLevelXp = xpForLevel(prog.level);
  const nextLevelXp    = xpForLevel(prog.level + 1);
  const xpIntoLevel    = prog.xp - currentLevelXp;
  const xpNeeded       = nextLevelXp - currentLevelXp;
  const pct            = Math.round((xpIntoLevel / xpNeeded) * 100);
  return { xpIntoLevel, xpNeeded, pct };
}

// ── Helper ─────────────────────────────────────────────────────
function prevDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export { levelForXp, xpForLevel };