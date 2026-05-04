// frontend/src/components/Profile/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Loader, CheckCircle, AlertCircle,
         MessageSquare, ArrowUp, Eye, BookOpen, Trophy, Star, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp }  from '../../context/AppContext.jsx';
import { getUserProfile, createOrUpdateProfile, isUsernameTaken, getUserPosts } from '../../utils/communityService.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Avatar, timeAgo } from '../Community/PostCard.jsx';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="game-card p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
        <Icon className="w-4 h-4"/>
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value ?? 0}</p>
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const { summary, progression } = useApp();

  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [username,  setUsername]  = useState('');
  const [bio,       setBio]       = useState('');
  const [photoURL,  setPhotoURL]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState('profile'); // profile | posts
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserProfile(user.uid),
      getUserPosts(user.uid),
    ]).then(([p, userPostsList]) => {
      if (p) {
        setProfile(p);
        setUsername(p.username || '');
        setBio(p.bio || '');
        setPhotoURL(p.photoURL || user.photoURL || '');
      } else {
        setUsername(user.displayName?.toLowerCase().replace(/\s+/g,'.') || '');
        setPhotoURL(user.photoURL || '');
      }
      setPosts(userPostsList);
      setLoading(false);
    });
  }, [user]);

  async function handleSave() {
    if (!username.trim()) { setError('Username is required.'); return; }
    const clean = username.toLowerCase().replace(/[^a-z0-9_.]/g,'');
    if (clean.length < 3) { setError('Username must be at least 3 characters.'); return; }

    setSaving(true); setError('');
    try {
      const taken = await isUsernameTaken(clean, user.uid);
      if (taken) { setError('Username is already taken.'); setSaving(false); return; }

      const data = {
        username:    clean,
        displayName: user.displayName || clean,
        bio:         bio.trim(),
        photoURL:    photoURL,
        email:       user.email || '',
      };

      // Upsert userProfiles
      const ref = doc(db, 'userProfiles', user.uid);
      await setDoc(ref, {
        ...data,
        stats: profile?.stats || { postsCount:0, repliesCount:0, totalUpvotes:0, totalViews:0 },
        joinedAt:  profile?.joinedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setProfile(prev => ({ ...(prev||{}), ...data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  // Handle avatar URL input (or Google photo as default)
  function handlePhotoInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 data URL (simple client-side approach)
    const reader = new FileReader();
    reader.onload = ev => setPhotoURL(ev.target.result);
    reader.readAsDataURL(file);
  }

  if (!user) return (
    <div className="flex items-center justify-center h-48 text-slate-600">
      <p className="text-sm">Sign in to view your profile.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader className="w-6 h-6 animate-spin text-purple-400"/>
    </div>
  );

  const stats = profile?.stats || {};

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className="game-card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-game-border">
              {photoURL
                ? <img src={photoURL} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-purple-600/30 flex items-center justify-center">
                    <span className="text-3xl font-bold text-purple-300">
                      {(username||user.displayName||'?')[0].toUpperCase()}
                    </span>
                  </div>
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600
                border-2 border-game-bg flex items-center justify-center
                hover:bg-purple-500 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={handlePhotoInput}/>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold text-lg">
                {profile?.username ? '@' + profile.username : user.displayName}
              </p>
              {userProfile?.isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400
                  text-xs border border-purple-500/30 font-medium">Admin</span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{user.email}</p>
            {profile?.bio && (
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <p className="text-slate-700 text-xs mt-2">
              Member since {profile?.joinedAt?.toDate
                ? profile.joinedAt.toDate().toLocaleDateString('en-US', {month:'long', year:'numeric'})
                : 'recently'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-game-border">
        {[['profile','Edit Profile'],['posts','My Posts'],['stats','Stats']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors
              ${tab===id?'text-purple-400 border-b-2 border-purple-500':'text-slate-600 hover:text-slate-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Edit Profile tab */}
      {tab === 'profile' && (
        <div className="game-card p-5 space-y-4">
          {/* Display name for phone users */}
          {user.phoneNumber && (
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Display Name</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-game-surface border border-game-border rounded-xl">
                <input value={profile?.displayName || ''}
                  onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your name"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-700"/>
              </div>
            </div>
          )}

          {/* Phone number display */}
          {user.phoneNumber && (
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Phone Number</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-game-surface border border-game-border rounded-xl opacity-60">
                <Phone className="w-4 h-4 text-slate-600"/>
                <span className="text-sm text-slate-400">{user.phoneNumber}</span>
                <Shield className="w-3.5 h-3.5 text-green-500 ml-auto"/>
              </div>
              <p className="text-xs text-slate-700 mt-1">Verified via SMS</p>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Username</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-game-surface border border-game-border rounded-xl">
              <span className="text-slate-500 text-sm">@</span>
              <input value={username} onChange={e=>setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-700"/>
            </div>
            <p className="text-xs text-slate-700 mt-1">Only letters, numbers, dots, underscores. Min 3 chars.</p>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Avatar URL</label>
            <div className="flex gap-2">
              <input value={photoURL} onChange={e=>setPhotoURL(e.target.value)}
                placeholder="https://... or upload above"
                className="flex-1 px-3 py-2.5 text-sm bg-game-surface border border-game-border rounded-xl
                  text-white placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors"/>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Bio</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3}
              placeholder="Tell the community about yourself…"
              className="w-full px-3 py-2.5 text-sm bg-game-surface border border-game-border rounded-xl
                text-slate-300 placeholder-slate-700 outline-none resize-none
                focus:border-purple-500/60 transition-colors"/>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0"/>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors">
            {saving ? <Loader className="w-4 h-4 animate-spin"/> : saved
              ? <CheckCircle className="w-4 h-4 text-green-300"/> : <Save className="w-4 h-4"/>}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* My Posts tab */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-slate-500 text-sm">No posts yet</p>
              <p className="text-slate-700 text-xs mt-1">Share your thoughts in the Community tab</p>
            </div>
          ) : posts.map(p => (
            <div key={p.id} className="game-card p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-white">{p.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
                  <ArrowUp className="w-3 h-3"/>
                  <span>{p.upvoteCount||0}</span>
                  <MessageSquare className="w-3 h-3 ml-1"/>
                  <span>{p.replyCount||0}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{p.body}</p>
              <p className="text-xs text-slate-700 mt-2">{timeAgo(p.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BookOpen}     label="Problems Solved"  value={summary?.totalSolved}      color="text-green-400 bg-green-500"/>
            <StatCard icon={Trophy}       label="Level"            value={progression?.level}        color="text-purple-400 bg-purple-500"/>
            <StatCard icon={MessageSquare}label="Posts"            value={stats.postsCount}          color="text-blue-400 bg-blue-500"/>
            <StatCard icon={ArrowUp}      label="Upvotes received" value={stats.totalUpvotes}        color="text-orange-400 bg-orange-500"/>
            <StatCard icon={MessageSquare}label="Replies"          value={stats.repliesCount}        color="text-teal-400 bg-teal-500"/>
            <StatCard icon={Star}         label="Streak"           value={progression?.streak}       color="text-yellow-400 bg-yellow-500"/>
          </div>

          {/* XP progress */}
          {progression && (
            <div className="game-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Level {progression.level}</p>
                <p className="text-xs text-slate-500">{progression.xp || 0} XP</p>
              </div>
              <div className="h-2 bg-game-surface rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((progression.xp||0) % 100))}%` }}/>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}