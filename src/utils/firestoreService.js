// frontend/src/utils/firestoreService.js
//
// All Firestore reads and writes live here.
//
// Collections:
//   problems/           — built-in problem bank (admin manages)
//     {id}/
//       title, topic, difficulty, description, url, tags
//       testCases: [{ id, input, stdinLines, expected, label, hidden }]
//       order: number   (for sorting within topic)
//       createdAt, updatedAt
//
//   users/{uid}/
//     displayName, email, photoURL, isAdmin, joinedAt
//
//   userProgress/{uid}/problems/{problemId}
//     solved: bool, solvedAt: timestamp, attempts: number
//
//   userNotes/{uid}/notes/{problemId}
//     text: string, updatedAt: timestamp
//
//   userProgression/{uid}
//     xp, level, streak, lastSolveDate, totalSolved, recentEvents[]
//
//   customLists/{uid}/lists/{listId}
//     name, problems[], createdAt

import { db } from '../firebase.js';
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc,
  deleteDoc, addDoc, onSnapshot, query, orderBy, where,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';

// ── Problems (built-in problem bank) ─────────────────────────

export async function fetchAllProblems() {
  const snap = await getDocs(
    query(collection(db, 'problems'), orderBy('topic'), orderBy('order'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Real-time listener for problems — used in user app so admin changes appear live
export function listenToProblems(callback) {
  return onSnapshot(
    query(collection(db, 'problems'), orderBy('topic'), orderBy('order')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// Admin: create a new problem
export async function createProblem(data) {
  return addDoc(collection(db, 'problems'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Admin: update problem fields
export async function updateProblem(id, data) {
  return updateDoc(doc(db, 'problems', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Admin: delete a problem
export async function deleteProblem(id) {
  return deleteDoc(doc(db, 'problems', id));
}

// ── User profile ──────────────────────────────────────────────

export async function getOrCreateUserProfile(user) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || '',
      email:       user.email || '',
      photoURL:    user.photoURL || '',
      isAdmin:     false,
      joinedAt:    serverTimestamp(),
    });
    return { isAdmin: false };
  }
  return snap.data();
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── User progress ─────────────────────────────────────────────

export async function loadUserProgress(uid) {
  const snap = await getDocs(collection(db, 'userProgress', uid, 'problems'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result; // { [problemId]: { solved, solvedAt, attempts } }
}

export async function markProblemSolved(uid, problemId, solved) {
  const ref = doc(db, 'userProgress', uid, 'problems', problemId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : { attempts: 0 };
  await setDoc(ref, {
    solved,
    attempts: (existing.attempts || 0) + 1,
    solvedAt: solved ? serverTimestamp() : existing.solvedAt || null,
  }, { merge: true });
}

// ── User notes ────────────────────────────────────────────────

export async function loadUserNotes(uid) {
  const snap = await getDocs(collection(db, 'userNotes', uid, 'notes'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data().text || ''; });
  return result; // { [problemId]: "note text" }
}

export async function saveUserNote(uid, problemId, text) {
  const ref = doc(db, 'userNotes', uid, 'notes', problemId);
  if (text && text.trim()) {
    await setDoc(ref, { text, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await deleteDoc(ref);
  }
}

// ── User progression (XP, streak, etc.) ──────────────────────

export async function loadUserProgression(uid) {
  const snap = await getDoc(doc(db, 'userProgression', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProgression(uid, progression) {
  return setDoc(doc(db, 'userProgression', uid), progression, { merge: true });
}

// ── Custom lists (user-uploaded CSVs) ─────────────────────────

export async function saveCustomList(uid, name, problems) {
  return addDoc(collection(db, 'customLists', uid, 'lists'), {
    name,
    problems,
    createdAt: serverTimestamp(),
  });
}

export async function loadCustomLists(uid) {
  const snap = await getDocs(
    query(collection(db, 'customLists', uid, 'lists'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteCustomList(uid, listId) {
  return deleteDoc(doc(db, 'customLists', uid, 'lists', listId));
}

// ── Admin: seed the default problem bank ─────────────────────
// Call once from the Admin panel to populate Firestore with
// the built-in problems from testCaseLibrary.js

export async function seedProblemsToFirestore(problems) {
  const batch = writeBatch(db);
  problems.forEach((p, i) => {
    const ref = doc(collection(db, 'problems'));
    batch.set(ref, {
      ...p,
      order: i,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}