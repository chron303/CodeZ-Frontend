// frontend/src/utils/communityService.js
// All Firestore operations for the community forum

import { db } from '../firebase.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  getDocs, onSnapshot, query, orderBy, where, limit,
  serverTimestamp, arrayUnion, arrayRemove, increment,
  startAfter, writeBatch,
} from 'firebase/firestore';

// ── Posts ─────────────────────────────────────────────────────

export function listenToPosts(filter, callback) {
  // Simple queries that work without composite indexes
  // Deleted posts are filtered client-side
  let q;
  if (filter === 'top') {
    q = query(collection(db, 'posts'),
      orderBy('upvoteCount', 'desc'),
      limit(50));
  } else if (filter === 'problem') {
    q = query(collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50));
  } else {
    q = query(collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50));
  }
  return onSnapshot(q, snap => {
    let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Filter deleted client-side
    posts = posts.filter(p => !p.deleted);
    if (filter === 'problem') posts = posts.filter(p => p.problemSlug);
    callback(posts);
  });
}

export async function createPost(uid, profile, data) {
  const ref = await addDoc(collection(db, 'posts'), {
    title:        data.title,
    body:         data.body,
    code:         data.code || '',
    codeLanguage: data.codeLanguage || 'cpp',
    problemSlug:  data.problemSlug || null,
    tags:         data.tags || [],
    authorUid:    uid,
    authorName:   profile.username || profile.displayName || 'Anonymous',
    authorAvatar: profile.photoURL || '',
    upvotes:      [],
    upvoteCount:  0,
    viewCount:    0,
    replyCount:   0,
    pinned:       false,
    flagged:      false,
    deleted:      false,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  // Update user stats
  await updateDoc(doc(db, 'userProfiles', uid), {
    'stats.postsCount': increment(1),
  });
  return ref;
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  // Increment view count
  await updateDoc(snap.ref, { viewCount: increment(1) });
  return { id: snap.id, ...snap.data() };
}

export function listenToPost(postId, callback) {
  return onSnapshot(doc(db, 'posts', postId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function toggleUpvote(postId, uid) {
  const ref  = doc(db, 'posts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const post = snap.data();
  const upvoted = (post.upvotes || []).includes(uid);
  await updateDoc(ref, {
    upvotes:     upvoted ? arrayRemove(uid) : arrayUnion(uid),
    upvoteCount: upvoted ? increment(-1)   : increment(1),
  });
}

export async function deletePost(postId) {
  await updateDoc(doc(db, 'posts', postId), {
    deleted: true, deletedAt: serverTimestamp(),
  });
}

export async function warnPost(postId, reason) {
  await updateDoc(doc(db, 'posts', postId), {
    flagged: true, flagReason: reason, flaggedAt: serverTimestamp(),
  });
}

export async function pinPost(postId, pinned) {
  await updateDoc(doc(db, 'posts', postId), { pinned });
}

// ── Replies ───────────────────────────────────────────────────

export function listenToReplies(postId, callback) {
  const q = query(
    collection(db, 'posts', postId, 'replies'),
    where('deleted', '==', false),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function createReply(postId, uid, profile, data) {
  await addDoc(collection(db, 'posts', postId, 'replies'), {
    body:         data.body,
    code:         data.code || '',
    codeLanguage: data.codeLanguage || 'cpp',
    authorUid:    uid,
    authorName:   profile.username || profile.displayName || 'Anonymous',
    authorAvatar: profile.photoURL || '',
    upvotes:      [],
    upvoteCount:  0,
    flagged:      false,
    deleted:      false,
    createdAt:    serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), {
    replyCount: increment(1), updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'userProfiles', uid), {
    'stats.repliesCount': increment(1),
  });
}

export async function toggleReplyUpvote(postId, replyId, uid) {
  const ref  = doc(db, 'posts', postId, 'replies', replyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const upvoted = (snap.data().upvotes || []).includes(uid);
  await updateDoc(ref, {
    upvotes:     upvoted ? arrayRemove(uid) : arrayUnion(uid),
    upvoteCount: upvoted ? increment(-1)   : increment(1),
  });
}

export async function deleteReply(postId, replyId) {
  await updateDoc(doc(db, 'posts', postId, 'replies', replyId), {
    deleted: true, deletedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), { replyCount: increment(-1) });
}

// ── User profiles ──────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'userProfiles', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createOrUpdateProfile(uid, data) {
  const ref  = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } else {
    await updateDoc(ref, {
      ...data,
      stats: { postsCount:0, repliesCount:0, totalUpvotes:0, totalViews:0 },
      joinedAt:  serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(async () => {
      // doc doesn't exist yet
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, {
        ...data,
        stats: { postsCount:0, repliesCount:0, totalUpvotes:0, totalViews:0 },
        joinedAt:  serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
}

export async function isUsernameTaken(username, excludeUid) {
  const q = query(
    collection(db, 'userProfiles'),
    where('username', '==', username.toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  return snap.docs[0].id !== excludeUid;
}

export async function getUserPosts(uid) {
  const q = query(
    collection(db, 'posts'),
    where('authorUid', '==', uid),
    where('deleted', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}