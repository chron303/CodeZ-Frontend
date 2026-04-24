// frontend/src/components/Community/PostCard.jsx
import { useState } from 'react';
import { ArrowUp, MessageSquare, Eye, Code2, AlertTriangle, Trash2, Star } from 'lucide-react';
import { toggleUpvote, deletePost, warnPost, pinPost } from '../../utils/communityService.js';
import { useAuth } from '../../context/AuthContext.jsx';

function Avatar({ name, photoURL, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
  if (photoURL) return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover`}/>;
  return (
    <div className={`${sz} rounded-full bg-purple-600/40 border border-purple-500/30
      flex items-center justify-center font-bold text-purple-300`}>
      {(name||'?')[0].toUpperCase()}
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

export { Avatar, timeAgo };

export default function PostCard({ post, onClick, isAdmin }) {
  const { user } = useAuth();
  const [upvoted, setUpvoted] = useState((post.upvotes||[]).includes(user?.uid));
  const [count,   setCount]   = useState(post.upvoteCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleUpvote(e) {
    e.stopPropagation();
    if (!user) return;
    await toggleUpvote(post.id, user.uid);
    setUpvoted(u => !u);
    setCount(c => upvoted ? c-1 : c+1);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm('Delete this post?')) await deletePost(post.id);
    setMenuOpen(false);
  }

  async function handleWarn(e) {
    e.stopPropagation();
    const reason = window.prompt('Reason for warning:');
    if (reason) { await warnPost(post.id, reason); setMenuOpen(false); }
  }

  async function handlePin(e) {
    e.stopPropagation();
    await pinPost(post.id, !post.pinned);
    setMenuOpen(false);
  }

  return (
    <div onClick={onClick}
      className={`game-card p-4 cursor-pointer hover:border-purple-500/30 transition-all
        ${post.pinned ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
        ${post.flagged ? 'border-red-500/20' : ''}`}>
      <div className="flex gap-3">
        {/* Upvote column */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button onClick={handleUpvote}
            className={`p-1.5 rounded-lg transition-colors ${
              upvoted ? 'text-orange-400 bg-orange-500/20' : 'text-slate-600 hover:text-orange-400 hover:bg-orange-500/10'
            }`}>
            <ArrowUp className="w-4 h-4"/>
          </button>
          <span className={`text-xs font-bold ${upvoted ? 'text-orange-400' : 'text-slate-500'}`}>{count}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.pinned && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0"/>}
              {post.flagged && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0"/>}
              <h3 className="text-sm font-semibold text-white leading-snug">{post.title}</h3>
            </div>
            {isAdmin && (
              <div className="relative shrink-0">
                <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);}}
                  className="text-slate-700 hover:text-slate-400 transition-colors text-lg leading-none">
                  ⋯
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 game-card w-36 overflow-hidden">
                    <button onClick={handlePin}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-game-surface">
                      <Star className="w-3.5 h-3.5"/>{post.pinned?'Unpin':'Pin'}
                    </button>
                    <button onClick={handleWarn}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-yellow-400 hover:bg-game-surface">
                      <AlertTriangle className="w-3.5 h-3.5"/>Warn
                    </button>
                    <button onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-game-surface">
                      <Trash2 className="w-3.5 h-3.5"/>Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {post.body}
          </p>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded-md bg-game-surface text-slate-600
                  text-xs border border-game-border">{t}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <Avatar name={post.authorName} photoURL={post.authorAvatar} size="sm"/>
            <span className="text-slate-500 font-medium">{post.authorName}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <div className="flex items-center gap-1 ml-auto">
              {post.code && <Code2 className="w-3 h-3"/>}
              <MessageSquare className="w-3 h-3"/>
              <span>{post.replyCount || 0}</span>
              <Eye className="w-3 h-3 ml-1"/>
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}