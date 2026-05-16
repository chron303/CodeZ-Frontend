// frontend/src/context/AppContext.jsx
//
// Loads problems from Firestore (real-time listener).
// Stores user progress, notes, and XP in Firestore per UID.
// localStorage used as write-through cache — keyed by uid to prevent
// cross-user data bleed when multiple accounts share a device.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadProgression, saveProgression, clearProgression, awardSolve, defaultProgression } from '../utils/progression.js';
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
    t.problems.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
  }
  return Object.values(topicMap).sort((a, b) => a.topic.localeCompare(b.topic));
}

export function AppProvider({ children }) {
  const { user } = useAuth();

  const [rawProblems,  setRawProblems]  = useState([]);
  const [progressMap,  setProgressMap]  = useState({});
  const [notesMap,     setNotesMap]     = useState({});
  const [customLists,  setCustomLists]  = useState([]);
  const [topics,       setTopics]       = useState([]);
  const [activeProblem,setActiveProblem]= useState(null);

  // ── Key fix: initialise progression to default (not localStorage)
  // We wait for Firestore to load the correct per-user data.
  // localStorage is only used as a write-through cache after uid is known.
  const [progression,  setProgression]  = useState(() => defaultProgression());

  const [levelCompleteEvent, setLevelCompleteEvent] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);

  const progressMapRef = useRef(progressMap);
  const notesMapRef    = useRef(notesMap);
  useEffect(() => { progressMapRef.current = progressMap; }, [progressMap]);
  useEffect(() => { notesMapRef.current    = notesMap; },   [notesMap]);

  // ── 1. Real-time listener for built-in problems ───────────────
  useEffect(() => {
    const unsub = listenToProblems(problems => {
      setRawProblems(problems);
    });
    return unsub;
  }, []);

  // ── 2. Load user-specific data when auth changes ──────────────
  useEffect(() => {
    if (!user) {
      // User logged out — reset ALL state to defaults.
      // Do NOT load from localStorage here (would show previous user's data).
      setProgressMap({});
      setNotesMap({});
      setCustomLists([]);
      setProgression(defaultProgression()); // blank slate, not localStorage
      setActiveProblem(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    // Immediately load from this user's localStorage cache while Firestore loads
    // (uid-keyed so it's always this user's data)
    const cachedProg = loadProgression(user.uid);
    if (cachedProg) setProgression(cachedProg);

    Promise.all([
      loadUserProgress(user.uid),
      loadUserNotes(user.uid),
      loadUserProgression(user.uid),
      loadCustomLists(user.uid),
    ]).then(([progress, notes, prog, lists]) => {
      setProgressMap(progress || {});
      setNotesMap(notes || {});
      if (prog) {
        // Firestore is authoritative — overwrite the localStorage cache
        setProgression(prog);
        saveProgression(prog, user.uid); // sync cache with Firestore data
      }
      setCustomLists(lists || []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [user?.uid]);

  // ── 3. Rebuild topics whenever problems or user data change ───
  useEffect(() => {
    setTopics(buildTopics(rawProblems, progressMap, notesMap));
  }, [rawProblems, progressMap, notesMap]);

  // ── Mark one problem solved/unsolved ──────────────────────────
  const markSolved = useCallback((topicName, problemId, fromJudge = false) => {
    const current   = progressMapRef.current[problemId];
    const nowSolved = !(current?.solved);
    const rawProblem = rawProblems.find(p => p.id === problemId);

    setProgressMap(prev => ({
      ...prev,
      [problemId]: {
        ...(prev[problemId] || {}),
        solved:   nowSolved,
        attempts: ((prev[problemId]?.attempts) || 0) + 1,
      },
    }));

    if (user) markProblemSolved(user.uid, problemId, nowSolved);

    if (nowSolved && rawProblem) {
      setProgression(prev => {
        const { newProg, xpGained, leveledUp, newLevel, streakBonus } = awardSolve(prev, rawProblem);
        // Save to both localStorage (uid-keyed) and Firestore
        saveProgression(newProg, user?.uid);
        if (user) saveUserProgression(user.uid, newProg);
        if (fromJudge) {
          setLevelCompleteEvent({
            problem: rawProblem, xpGained, leveledUp, newLevel,
            streakBonus: streakBonus ?? 0,
          });
        }
        return newProg;
      });
    }
  }, [user, rawProblems]);

  // ── Mark every problem in a topic solved ──────────────────────
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

  // ── Open problem in editor ────────────────────────────────────
  const openProblem = useCallback((problem) => {
    const testCases = problem.testCases?.length ? problem.testCases : [
      { id: 1, input: 'null', stdinLines: '', expected: 'null', label: 'Test 1' },
      { id: 2, input: 'null', stdinLines: '', expected: 'null', label: 'Test 2' },
    ];
    setActiveProblem({ ...problem, testCases });
  }, []);

  const updateTestCases = useCallback((testCases) => {
    setActiveProblem(prev => prev ? { ...prev, testCases } : prev);
  }, []);

  // ── Save note ─────────────────────────────────────────────────
  const saveNote = useCallback((topicName, problemId, note) => {
    setNotesMap(prev => ({ ...prev, [problemId]: note }));
    setActiveProblem(prev => prev?.id === problemId ? { ...prev, note } : prev);
    if (user) saveUserNote(user.uid, problemId, note);
  }, [user]);

  // ── Reset progress ────────────────────────────────────────────
  const resetProgress = useCallback(() => {
    setProgressMap({});
    setNotesMap({});
    setActiveProblem(null);
    // Also clear this user's localStorage cache
    if (user) clearProgression(user.uid);
    showToast('Progress cleared locally. Firestore data preserved for safety.', 'info');
  }, [user]);

  // ── Export progress ───────────────────────────────────────────
  const exportProgress = useCallback(() => {
    exportProgressCSV(topics);
  }, [topics]);

  // ── Save custom list ──────────────────────────────────────────
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

  // ── Derived summary ───────────────────────────────────────────
  const totalProblems = topics.reduce((s, t) => s + t.total, 0);
  const totalSolved   = topics.reduce((s, t) => s + t.solved, 0);
  const summary = {
    totalProblems,
    totalSolved,
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