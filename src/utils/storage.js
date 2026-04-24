// frontend/src/utils/storage.js
// Persists solve progress, notes, language preference, and per-problem code.

var KEYS = {
  solves: 'dsa-quest-solves',
  notes:  'dsa-quest-notes',
  lang:   'dsa-quest-lang',
  code:   'dsa-quest-code',   // { "problemId:langId": "code string" }
};

function safeGet(key) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

// ── Solved state ──────────────────────────────────────────────
export function loadSolvedIds() { return safeGet(KEYS.solves) || {}; }

export function saveSolvedId(problemId, solved) {
  var current = loadSolvedIds();
  if (solved) current[problemId] = true;
  else delete current[problemId];
  safeSet(KEYS.solves, current);
}

export function clearSolvedIds() { safeSet(KEYS.solves, {}); }

// ── Notes ─────────────────────────────────────────────────────
export function loadNotes() { return safeGet(KEYS.notes) || {}; }

export function saveNote(problemId, note) {
  var current = loadNotes();
  if (note && note.trim()) current[problemId] = note;
  else delete current[problemId];
  safeSet(KEYS.notes, current);
}

export function clearNotes() { safeSet(KEYS.notes, {}); }

// ── Language preference ───────────────────────────────────────
export function loadLang() {
  return localStorage.getItem(KEYS.lang) || 'python';
}
export function saveLang(lang) {
  try { localStorage.setItem(KEYS.lang, lang); } catch(e) {}
}

// ── Per-problem code (keyed by "problemId:langId") ────────────
export function loadCode(problemId, langId) {
  var all = safeGet(KEYS.code) || {};
  return all[problemId + ':' + langId] || null;
}

export function saveCode(problemId, langId, code) {
  var all = safeGet(KEYS.code) || {};
  all[problemId + ':' + langId] = code;
  // Keep only last 200 entries to avoid bloat
  var keys = Object.keys(all);
  if (keys.length > 200) {
    delete all[keys[0]];
  }
  safeSet(KEYS.code, all);
}

export function clearCode() { safeSet(KEYS.code, {}); }

// ── Apply persisted state to freshly-loaded topics ────────────
export function applyPersistedState(topics) {
  var solvedIds = loadSolvedIds();
  var notes     = loadNotes();

  return topics.map(function(t) {
    var updatedProblems = t.problems.map(function(p) {
      return Object.assign({}, p, {
        solved: p.solved || !!solvedIds[p.id],
        note:   notes[p.id] || '',
      });
    });
    var solvedCount = updatedProblems.filter(function(p) { return p.solved; }).length;
    return Object.assign({}, t, {
      problems:   updatedProblems,
      solved:     solvedCount,
      percentage: Math.round((solvedCount / t.total) * 100),
    });
  });
}

// ── Export progress as CSV ────────────────────────────────────
export function exportProgressCSV(topics) {
  var rows = [['Title','Topic','Difficulty','Solved','Notes']];
  topics.forEach(function(t) {
    t.problems.forEach(function(p) {
      rows.push([
        '"' + (p.title  || '').replace(/"/g, '""') + '"',
        '"' + (p.topic  || '').replace(/"/g, '""') + '"',
        p.difficulty || '',
        p.solved ? 'true' : 'false',
        '"' + (p.note   || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"',
      ]);
    });
  });
  var csv  = rows.map(function(r) { return r.join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'dsa-quest-progress.csv';
  a.click();
  URL.revokeObjectURL(url);
}