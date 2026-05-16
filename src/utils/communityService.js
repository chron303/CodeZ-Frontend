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
  let q;
  if (filter === 'top') {
    q = query(collection(db, 'posts'), orderBy('upvoteCount', 'desc'), limit(50));
  } else {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  }
  return onSnapshot(q, snap => {
    let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  // Update author's post count
  await updateDoc(doc(db, 'userProfiles', uid), {
    'stats.postsCount': increment(1),
  }).catch(() => {}); // profile may not exist yet — non-fatal
  return ref;
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  // Increment view count + author's totalViews
  const post = snap.data();
  await updateDoc(snap.ref, { viewCount: increment(1) });
  if (post.authorUid) {
    await updateDoc(doc(db, 'userProfiles', post.authorUid), {
      'stats.totalViews': increment(1),
    }).catch(() => {});
  }
  return { id: snap.id, ...post };
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

  const post    = snap.data();
  const upvoted = (post.upvotes || []).includes(uid);

  // Update the post's own upvote count
  await updateDoc(ref, {
    upvotes:     upvoted ? arrayRemove(uid) : arrayUnion(uid),
    upvoteCount: upvoted ? increment(-1)   : increment(1),
  });

  // ── Fix: also update the POST AUTHOR's totalUpvotes stat ──
  // This was missing — causing totalUpvotes to always be 0 for all users.
  if (post.authorUid && post.authorUid !== uid) {
    // Don't count self-upvotes
    await updateDoc(doc(db, 'userProfiles', post.authorUid), {
      'stats.totalUpvotes': upvoted ? increment(-1) : increment(1),
    }).catch(() => {}); // non-fatal if profile doesn't exist
  }
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
  }).catch(() => {});
}

export async function toggleReplyUpvote(postId, replyId, uid) {
  const ref  = doc(db, 'posts', postId, 'replies', replyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const reply   = snap.data();
  const upvoted = (reply.upvotes || []).includes(uid);
  await updateDoc(ref, {
    upvotes:     upvoted ? arrayRemove(uid) : arrayUnion(uid),
    upvoteCount: upvoted ? increment(-1)   : increment(1),
  });
  // Also update reply author's totalUpvotes (excluding self-upvotes)
  if (reply.authorUid && reply.authorUid !== uid) {
    await updateDoc(doc(db, 'userProfiles', reply.authorUid), {
      'stats.totalUpvotes': upvoted ? increment(-1) : increment(1),
    }).catch(() => {});
  }
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
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, {
      ...data,
      stats: { postsCount: 0, repliesCount: 0, totalUpvotes: 0, totalViews: 0 },
      joinedAt:  serverTimestamp(),
      updatedAt: serverTimestamp(),
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

// ── Recompute stats from scratch for a user ────────────────────
// Call this once to fix existing users whose totalUpvotes is 0
// due to the missing increment bug. Can be triggered from admin panel.
export async function recomputeUserStats(uid) {
  // Count posts
  const postsSnap = await getDocs(query(
    collection(db, 'posts'),
    where('authorUid', '==', uid),
    where('deleted', '==', false)
  ));
  const postsCount = postsSnap.size;

  // Sum upvotes across all posts
  let totalUpvotes = 0;
  let totalViews   = 0;
  postsSnap.docs.forEach(d => {
    totalUpvotes += d.data().upvoteCount || 0;
    totalViews   += d.data().viewCount   || 0;
  });

  // Count replies
  // Note: querying subcollections requires a collection group query
  const repliesSnap = await getDocs(query(
    collection(db, 'posts'),
    where('authorUid', '==', uid) // posts authored by user for reply counting
  ));
  // For replies, we'd need collectionGroup — use stored count as fallback
  const profileSnap = await getDoc(doc(db, 'userProfiles', uid));
  const existingReplies = profileSnap.exists()
    ? (profileSnap.data().stats?.repliesCount || 0)
    : 0;

  await updateDoc(doc(db, 'userProfiles', uid), {
    'stats.postsCount':   postsCount,
    'stats.totalUpvotes': totalUpvotes,
    'stats.totalViews':   totalViews,
    // Keep repliesCount as-is since we track it correctly via increment
    'stats.repliesCount': existingReplies,
  });

  return { postsCount, totalUpvotes, totalViews, repliesCount: existingReplies };
}