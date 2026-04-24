// frontend/src/context/AppContext.jsx
//
// Loads problems from Firestore (real-time listener — admin changes reflect immediately).
// Stores user progress, notes, and XP in Firestore per UID.
// localStorage still used for offline fallback and language pref.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadProgression, saveProgression, awardSolve } from '../utils/progression.js';
import { exportProgressCSV } from '../utils/storage.js';
import {
  listenToProblems,
  loadUserProgress, markProblemSolved,
  loadUserNotes,    saveUserNote,
  loadUserProgression, saveUserProgression,
  saveCustomList, loadCustomLists,
} from '../utils/firestoreService.js';
import { useAuth } from './AuthContext.jsx';

const AppContext = createContext(null);

// Build topics array from flat problem list + user progress/notes
function buildTopics(problems, progressMap, notesMap) {
  const topicMap = {};
  for (const p of problems) {
    if (!topicMap[p.topic]) {
      topicMap[p.topic] = { topic: p.topic, total: 0, solved: 0, percentage: 0, problems: [] };
    }
    const isSolved = !!(progressMap[p.id]?.solved);
    const note     = notesMap[p.id] || '';
    topicMap[p.topic].problems.push({ ...p, solved: isSolved, note });
    topicMap[p.topic].total++;
    if (isSolved) topicMap[p.topic].solved++;
  }
  for (const t of Object.values(topicMap)) {
    t.percentage = t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0;
    // Sort problems by order field then title
    t.problems.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
  }
  return Object.values(topicMap).sort((a, b) => a.topic.localeCompare(b.topic));
}

export function AppProvider({ children }) {
  const { user } = useAuth();

  // Raw Firestore data
  const [rawProblems,  setRawProblems]  = useState([]);   // from Firestore listener
  const [progressMap,  setProgressMap]  = useState({});   // { [problemId]: { solved, attempts } }
  const [notesMap,     setNotesMap]     = useState({});   // { [problemId]: "note text" }
  const [customLists,  setCustomLists]  = useState([]);   // user-uploaded CSVs

  // Derived topics array (computed from above)
  const [topics,       setTopics]       = useState([]);

  // Editor state
  const [activeProblem,setActiveProblem]= useState(null);

  // Progression (XP etc)
  const [progression,  setProgression]  = useState(() => loadProgression());

  // Level complete overlay
  const [levelCompleteEvent, setLevelCompleteEvent] = useState(null);

  // UI
  const [toast,        setToast]        = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);

  // Keep refs for callbacks that need current state without re-creating
  const progressMapRef = useRef(progressMap);
  const notesMapRef    = useRef(notesMap);
  useEffect(() => { progressMapRef.current = progressMap; }, [progressMap]);
  useEffect(() => { notesMapRef.current    = notesMap; },   [notesMap]);

  // ── 1. Real-time listener for built-in problems ───────────
  useEffect(() => {
    const unsub = listenToProblems(problems => {
      setRawProblems(problems);
    });
    return unsub;
  }, []);

  // ── 2. Load user-specific data when auth changes ──────────
  useEffect(() => {
    if (!user) {
      setProgressMap({});
      setNotesMap({});
      setCustomLists([]);
      setProgression(loadProgression());
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    Promise.all([
      loadUserProgress(user.uid),
      loadUserNotes(user.uid),
      loadUserProgression(user.uid),
      loadCustomLists(user.uid),
    ]).then(([progress, notes, prog, lists]) => {
      setProgressMap(progress || {});
      setNotesMap(notes || {});
      if (prog) setProgression(prog);
      setCustomLists(lists || []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [user?.uid]);

  // ── 3. Rebuild topics whenever problems or user data change ──
  useEffect(() => {
    setTopics(buildTopics(rawProblems, progressMap, notesMap));
  }, [rawProblems, progressMap, notesMap]);

  // ── Mark one problem solved/unsolved ──────────────────────
  const markSolved = useCallback((topicName, problemId, fromJudge = false) => {
    const current    = progressMapRef.current[problemId];
    const nowSolved  = !(current?.solved);
    const rawProblem = rawProblems.find(p => p.id === problemId);

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [problemId]: { ...(prev[problemId] || {}), solved: nowSolved, attempts: ((prev[problemId]?.attempts) || 0) + 1 },
    }));

    // Persist to Firestore
    if (user) markProblemSolved(user.uid, problemId, nowSolved);

    // Award XP on solve
    if (nowSolved && rawProblem) {
      setProgression(prev => {
        const { newProg, xpGained, leveledUp, newLevel, streakBonus } = awardSolve(prev, rawProblem);
        saveProgression(newProg);
        if (user) saveUserProgression(user.uid, newProg);
        if (fromJudge) {
          setLevelCompleteEvent({ problem: rawProblem, xpGained, leveledUp, newLevel, streakBonus: streakBonus ?? 0 });
        }
        return newProg;
      });
    }
  }, [user, rawProblems]);

  // ── Mark every problem in a topic solved ──────────────────
  const markTopicSolved = useCallback((topicName) => {
    const topic = topics.find(t => t.topic === topicName);
    if (!topic) return;
    const updates = {};
    topic.problems.forEach(p => {
      if (!p.solved) {
        updates[p.id] = { solved: true, attempts: (progressMap[p.id]?.attempts || 0) + 1 };
        if (user) markProblemSolved(user.uid, p.id, true);
      }
    });
    setProgressMap(prev => ({ ...prev, ...updates }));
  }, [topics, progressMap, user]);

  // ── Open problem in editor ────────────────────────────────
  const openProblem = useCallback((problem) => {
    // Use Firestore test cases (authoritative), with fallback
    const testCases = problem.testCases?.length ? problem.testCases : [
      { id: 1, input: 'null', stdinLines: '', expected: 'null', label: 'Test 1' },
      { id: 2, input: 'null', stdinLines: '', expected: 'null', label: 'Test 2' },
    ];
    setActiveProblem({ ...problem, testCases });
  }, []);

  const updateTestCases = useCallback((testCases) => {
    setActiveProblem(prev => prev ? { ...prev, testCases } : prev);
  }, []);

  // ── Save note ─────────────────────────────────────────────
  const saveNote = useCallback((topicName, problemId, note) => {
    setNotesMap(prev => ({ ...prev, [problemId]: note }));
    setActiveProblem(prev => prev?.id === problemId ? { ...prev, note } : prev);
    if (user) saveUserNote(user.uid, problemId, note);
  }, [user]);

  // ── Reset progress ────────────────────────────────────────
  const resetProgress = useCallback(() => {
    // Can't bulk-delete Firestore easily; just clear local state
    // The user will have to individually unsolved or re-upload
    setProgressMap({});
    setNotesMap({});
    setActiveProblem(null);
    showToast('Progress cleared locally. Firestore data preserved for safety.', 'info');
  }, []);

  // ── Export progress ───────────────────────────────────────
  const exportProgress = useCallback(() => {
    exportProgressCSV(topics);
  }, [topics]);

  // ── Save custom list (CSV upload) ─────────────────────────
  const saveList = useCallback(async (name, problems) => {
    if (!user) return;
    const ref = await saveCustomList(user.uid, name, problems);
    const lists = await loadCustomLists(user.uid);
    setCustomLists(lists);
    return ref;
  }, [user]);

  const dismissLevelComplete = useCallback(() => setLevelCompleteEvent(null), []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Derived summary ───────────────────────────────────────
  const totalProblems = topics.reduce((s, t) => s + t.total, 0);
  const totalSolved   = topics.reduce((s, t) => s + t.solved, 0);
  const summary = {
    totalProblems, totalSolved,
    totalTopics: topics.length,
    topics,
    overallPct: totalProblems === 0 ? 0 : Math.round((totalSolved / totalProblems) * 100),
    weakTopics: [...topics].sort((a, b) => a.percentage - b.percentage).slice(0, 5),
  };

  return (
    <AppContext.Provider value={{
      topics, summary, toast, dataLoading, customLists,
      activeProblem, progression, levelCompleteEvent,
      markSolved, markTopicSolved, openProblem, updateTestCases,
      saveNote, resetProgress, exportProgress, saveList,
      dismissLevelComplete, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};