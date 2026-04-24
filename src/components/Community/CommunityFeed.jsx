// frontend/src/components/Community/CommunityFeed.jsx
import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Clock, Code2, Search, X, Loader } from 'lucide-react';
import { listenToPosts } from '../../utils/communityService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PostCard from './PostCard.jsx';
import PostComposer from './PostComposer.jsx';
import PostDetail from './PostDetail.jsx';

const FILTERS = [
  { id: 'latest', label: 'Latest',   icon: Clock },
  { id: 'top',    label: 'Top',      icon: TrendingUp },
  { id: 'problem',label: 'Problems', icon: Code2 },
];

export default function CommunityFeed({ isAdmin }) {
  const { user } = useAuth();
  const [posts,       setPosts]       = useState([]);
  const [filter,      setFilter]      = useState('latest');
  const [search,      setSearch]      = useState('');
  const [showComposer,setShowComposer]= useState(false);
  const [activePost,  setActivePost]  = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToPosts(filter, data => {
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, [filter]);

  const filtered = search.trim()
    ? posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.body.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags||[]).some(t => t.includes(search.toLowerCase()))
      )
    : posts;

  if (activePost) {
    return (
      <PostDetail
        postId={activePost}
        isAdmin={isAdmin}
        onBack={() => setActivePost(null)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="pixel text-sm text-purple-400">Community</h2>
          <p className="text-slate-500 text-xs mt-1">
            Ask questions, share solutions, discuss DSA
          </p>
        </div>
        {user && (
          <button onClick={() => setShowComposer(s=>!s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
              transition-colors ${showComposer
                ? 'bg-game-surface border border-game-border text-slate-400'
                : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
            <Plus className="w-4 h-4"/>
            {showComposer ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="mb-5">
          <PostComposer
            onClose={() => setShowComposer(false)}
            onPosted={() => setShowComposer(false)}
          />
        </div>
      )}

      {/* Filter + Search bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                font-medium transition-colors
                ${filter === id
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'bg-game-surface text-slate-500 border border-game-border hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-40 bg-game-surface border
          border-game-border rounded-xl px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder-slate-700"/>
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-purple-400"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <p className="text-slate-500 text-sm mb-1">
            {search ? 'No posts match your search' : 'No posts yet'}
          </p>
          {!search && user && (
            <p className="text-slate-700 text-xs">Be the first to post something!</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned posts first */}
          {filtered.filter(p=>p.pinned).map(p => (
            <PostCard key={p.id} post={p} isAdmin={isAdmin}
              onClick={() => setActivePost(p.id)}/>
          ))}
          {filtered.filter(p=>!p.pinned).map(p => (
            <PostCard key={p.id} post={p} isAdmin={isAdmin}
              onClick={() => setActivePost(p.id)}/>
          ))}
        </div>
      )}
    </div>
  );
}