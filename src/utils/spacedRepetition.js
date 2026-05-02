// frontend/src/utils/spacedRepetition.js
// Spaced repetition logic using SM-2 algorithm (simplified)
// Intervals: 1 → 3 → 7 → 14 → 30 → done
// Firestore: userReviews/{uid}/reviews/{problemId}

import { db } from '../firebase.js';
import {
  doc, setDoc, getDoc, getDocs, collection,
  query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';

const INTERVALS = [1, 3, 7, 14, 30]; // days between reviews

export function getNextInterval(currentStage, remembered) {
  if (!remembered) return { stage: 0, days: INTERVALS[0] }; // reset
  const nextStage = Math.min(currentStage + 1, INTERVALS.length - 1);
  return { stage: nextStage, days: INTERVALS[nextStage] };
}

export function isDueToday(nextReviewAt) {
  if (!nextReviewAt) return false;
  const reviewDate = nextReviewAt.toDate ? nextReviewAt.toDate() : new Date(nextReviewAt);
  const today      = new Date();
  today.setHours(0, 0, 0, 0);
  return reviewDate <= today;
}

// Schedule a problem for review
export async function scheduleReview(uid, problem, daysFromNow = 1) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysFromNow);
  nextDate.setHours(0, 0, 0, 0);

  await setDoc(
    doc(db, 'userReviews', uid, 'reviews', problem.id),
    {
      problemId:    problem.id,
      problemTitle: problem.title,
      topic:        problem.topic,
      difficulty:   problem.difficulty,
      stage:        0,
      nextReviewAt: Timestamp.fromDate(nextDate),
      scheduledAt:  serverTimestamp(),
      solvedCount:  0,
    },
    { merge: true }
  );
}

// Mark a review as done (remembered or not)
export async function completeReview(uid, problemId, remembered) {
  const ref  = doc(db, 'userReviews', uid, 'reviews', problemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data          = snap.data();
  const { stage, days } = getNextInterval(data.stage || 0, remembered);

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(0, 0, 0, 0);

  await setDoc(ref, {
    ...data,
    stage,
    nextReviewAt: Timestamp.fromDate(nextDate),
    lastReviewedAt: serverTimestamp(),
    solvedCount: (data.solvedCount || 0) + (remembered ? 1 : 0),
    completed: stage === INTERVALS.length - 1 && remembered,
  }, { merge: true });

  return { nextDate, stage, days };
}

// Dismiss without solving (snooze 1 day)
export async function snoozeReview(uid, problemId) {
  const ref      = doc(db, 'userReviews', uid, 'reviews', problemId);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(0, 0, 0, 0);
  await setDoc(ref, {
    nextReviewAt: Timestamp.fromDate(nextDate),
    snoozedAt:    serverTimestamp(),
  }, { merge: true });
}

// Get all reviews due today
export async function getDueReviews(uid) {
  const snap = await getDocs(
    collection(db, 'userReviews', uid, 'reviews')
  );
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => {
      if (r.completed) return false;
      const reviewDate = r.nextReviewAt?.toDate?.() || new Date(r.nextReviewAt);
      return reviewDate <= today;
    });
}

// Get all scheduled reviews (for profile/stats view)
export async function getAllReviews(uid) {
  const snap = await getDocs(collection(db, 'userReviews', uid, 'reviews'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Remove a review entirely
export async function removeReview(uid, problemId) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'userReviews', uid, 'reviews', problemId));
}

export { INTERVALS };