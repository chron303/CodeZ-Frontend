// frontend/src/utils/progression.js
//
// XP and streak system.
// Persisted in Firestore (source of truth) with localStorage as write-through cache.
//
// FIX: storage key is now per-user (includes uid) so different users on the same
// device don't share cached progression data.

const STORAGE_KEY_PREFIX = 'dsa-quest-progression-';

const XP_PER_DIFFICULTY = { Easy: 10, Medium: 25, Hard: 50 };

// ── Level thresholds ───────────────────────────────────────────
function xpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += 100 + (l - 1) * 50;
  return total;
}

function levelForXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

function storageKey(uid) {
  return uid ? STORAGE_KEY_PREFIX + uid : null;
}

// ── Load / save ────────────────────────────────────────────────
// uid is required — without it we never read from localStorage
// (prevents reading another user's cached data)
export function loadProgression(uid) {
  if (!uid) return defaultProgression();
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultProgression();
}

export function saveProgression(prog, uid) {
  if (!uid) return; // never save without uid
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(prog));
  } catch {}
}

// Clear a specific user's cached progression (call on logout)
export function clearProgression(uid) {
  if (!uid) return;
  try {
    localStorage.removeItem(storageKey(uid));
  } catch {}
}

// Clear ALL users' cached progression from localStorage
// (safety net — call from admin or on account delete)
export function clearAllProgressionCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

function defaultProgression() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastSolveDate: null,
    totalSolved: 0,
    solvedIds: [],
    recentEvents: [],
  };
}

export { defaultProgression };

// ── Award XP for solving a problem ────────────────────────────
export function awardSolve(currentProg, problem) {
  if (currentProg.solvedIds?.includes(problem.id)) {
    return { newProg: currentProg, xpGained: 0, leveledUp: false, newLevel: currentProg.level };
  }

  const baseXp   = XP_PER_DIFFICULTY[problem.difficulty] ?? 10;
  const today    = new Date().toISOString().slice(0, 10);
  const lastDate = currentProg.lastSolveDate;

  let streak = currentProg.streak ?? 0;
  let streakBonus = 0;

  if (lastDate === today) {
    // same day — no change
  } else if (lastDate === prevDay(today)) {
    streak += 1;
    streakBonus = 5;
  } else {
    streak = 1;
  }

  const xpGained  = baseXp + streakBonus;
  const oldLevel  = currentProg.level ?? 1;
  const newXp     = (currentProg.xp ?? 0) + xpGained;
  const newLevel  = levelForXp(newXp);
  const leveledUp = newLevel > oldLevel;

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
    totalSolved: (currentProg.totalSolved ?? 0) + 1,
    solvedIds: [...(currentProg.solvedIds ?? []), problem.id],
    recentEvents: [event, ...(currentProg.recentEvents ?? [])].slice(0, 20),
  };

  return { newProg, xpGained, leveledUp, newLevel, streakBonus };
}

// ── XP progress within current level ──────────────────────────
export function xpProgress(prog) {
  const currentLevelXp = xpForLevel(prog.level ?? 1);
  const nextLevelXp    = xpForLevel((prog.level ?? 1) + 1);
  const xpIntoLevel    = (prog.xp ?? 0) - currentLevelXp;
  const xpNeeded       = nextLevelXp - currentLevelXp;
  const pct            = Math.round((xpIntoLevel / xpNeeded) * 100);
  return { xpIntoLevel, xpNeeded, pct };
}

function prevDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export { levelForXp, xpForLevel };