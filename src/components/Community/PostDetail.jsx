// frontend/src/components/Community/PostDetail.jsx
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { ArrowUp, ArrowLeft, Send, Code2, X, Trash2, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { listenToPost, listenToReplies, createReply,
  toggleUpvote, toggleReplyUpvote, deletePost, deleteReply, warnPost } from '../../utils/communityService.js';
import { getUserProfile } from '../../utils/communityService.js';
import { Avatar, timeAgo } from './PostCard.jsx';

const LANGS = ['cpp','python','java'];

function CodeBlock({ code, lang }) {
  if (!code) return null;
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-game-border">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-game-surface border-b border-game-border">
        <Code2 className="w-3 h-3 text-slate-600"/>
        <span className="text-xs text-slate-600">{lang==='cpp'?'C++':lang==='python'?'Python':'Java'}</span>
      </div>
      <Editor height="200px" language={lang==='cpp'?'cpp':lang} theme="vs-dark"
        value={code} options={{readOnly:true,fontSize:12,minimap:{enabled:false},
          lineNumbers:'on',scrollBeyondLastLine:false,padding:{top:8}}}/>
    </div>
  );
}

function ReplyBox({ postId, onPosted }) {
  const { user } = useAuth();
  const [body,    setBody]    = useState('');
  const [code,    setCode]    = useState('');
  const [lang,    setLang]    = useState('cpp');
  const [showCode,setShowCode]= useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim() || !user) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid) || {
        username: user.displayName, displayName: user.displayName, photoURL: user.photoURL
      };
      await createReply(postId, user.uid, profile, {
        body, code: showCode ? code : '', codeLanguage: lang,
      });
      setBody(''); setCode(''); setShowCode(false);
      onPosted?.();
    } finally { setLoading(false); }
  }

  if (!user) return (
    <p className="text-slate-600 text-sm text-center py-4">Sign in to reply</p>
  );

  return (
    <div className="game-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Avatar name={user.displayName} photoURL={user.photoURL} size="sm"/>
        <span className="text-xs text-slate-500 font-medium">{user.displayName}</span>
      </div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3}
        placeholder="Write your reply…"
        className="w-full px-3 py-2.5 text-sm bg-game-surface border border-game-border rounded-xl
          text-slate-300 placeholder-slate-700 outline-none resize-none
          focus:border-purple-500/60 transition-colors leading-relaxed"/>

      <div className="flex items-center gap-2">
        <button onClick={()=>setShowCode(s=>!s)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors
            ${showCode?'bg-purple-600/20 text-purple-400 border border-purple-500/30'
            :'bg-game-surface border border-game-border text-slate-500 hover:text-slate-300'}`}>
          <Code2 className="w-3 h-3"/>{showCode?'Remove code':'Add code'}
        </button>
        <button onClick={submit} disabled={loading||!body.trim()}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium
            bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors">
          <Send className="w-3 h-3"/>{loading?'Posting…':'Reply'}
        </button>
      </div>

      {showCode && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {LANGS.map(l=>(
              <button key={l} onClick={()=>setLang(l)}
                className={`px-2 py-1 rounded text-xs transition-colors
                  ${lang===l?'bg-purple-600/20 text-purple-300':'text-slate-600 hover:text-slate-400'}`}>
                {l==='cpp'?'C++':l==='python'?'Python':'Java'}
              </button>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden border border-game-border">
            <Editor height="150px" language={lang==='cpp'?'cpp':lang} theme="vs-dark"
              value={code} onChange={v=>setCode(v||'')}
              options={{fontSize:12,minimap:{enabled:false},lineNumbers:'off',
                scrollBeyondLastLine:false,padding:{top:8}}}/>
          </div>
        </div>
      )}
    </div>
  );
}

function Reply({ reply, postId, isAdmin }) {
  const { user } = useAuth();
  const [upvoted, setUpvoted] = useState((reply.upvotes||[]).includes(user?.uid));
  const [count,   setCount]   = useState(reply.upvoteCount||0);

  async function handleUpvote() {
    if (!user) return;
    await toggleReplyUpvote(postId, reply.id, user.uid);
    setUpvoted(u=>!u); setCount(c=>upvoted?c-1:c+1);
  }

  return (
    <div className="game-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={reply.authorName} photoURL={reply.authorAvatar} size="sm"/>
        <span className="text-sm font-medium text-white">{reply.authorName}</span>
        <span className="text-xs text-slate-600 ml-1">{timeAgo(reply.createdAt)}</span>
        {isAdmin && (
          <div className="ml-auto flex items-center gap-1">
            <button onClick={()=>deleteReply(postId, reply.id)}
              className="p-1 text-slate-700 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-2">{reply.body}</p>

      {reply.code && <CodeBlock code={reply.code} lang={reply.codeLanguage||'cpp'}/>}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={handleUpvote}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors
            ${upvoted?'text-orange-400 bg-orange-500/10':'text-slate-600 hover:text-orange-400'}`}>
          <ArrowUp className="w-3 h-3"/>{count}
        </button>
      </div>
    </div>
  );
}

export default function PostDetail({ postId, isAdmin, onBack }) {
  const { user } = useAuth();
  const [post,    setPost]    = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [count,   setCount]   = useState(0);

  useEffect(() => {
    if (!postId) return;
    const unsubPost    = listenToPost(postId, p => {
      setPost(p);
      setLoading(false);
      setCount(p.upvoteCount||0);
      setUpvoted((p.upvotes||[]).includes(user?.uid));
    });
    const unsubReplies = listenToReplies(postId, setReplies);
    return () => { unsubPost(); unsubReplies(); };
  }, [postId, user?.uid]);

  async function handleUpvote() {
    if (!user || !post) return;
    await toggleUpvote(post.id, user.uid);
    setUpvoted(u=>!u); setCount(c=>upvoted?c-1:c+1);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader className="w-6 h-6 animate-spin text-purple-400"/>
    </div>
  );
  if (!post) return <p className="text-slate-600 text-center py-8">Post not found.</p>;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ArrowLeft className="w-4 h-4"/> Back to community
      </button>

      {/* Post */}
      <div className="game-card p-5">
        <div className="flex items-start gap-4">
          {/* Upvote */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button onClick={handleUpvote}
              className={`p-2 rounded-xl transition-colors ${
                upvoted?'text-orange-400 bg-orange-500/20':'text-slate-600 hover:text-orange-400 hover:bg-orange-500/10'
              }`}>
              <ArrowUp className="w-5 h-5"/>
            </button>
            <span className={`text-sm font-bold ${upvoted?'text-orange-400':'text-slate-400'}`}>{count}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2 className="text-lg font-bold text-white leading-snug">{post.title}</h2>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={()=>{const r=window.prompt('Warning reason:');if(r)warnPost(post.id,r);}}
                    className="p-1.5 text-yellow-600 hover:text-yellow-400 transition-colors">
                    <AlertTriangle className="w-4 h-4"/>
                  </button>
                  <button onClick={()=>window.confirm('Delete?')&&deletePost(post.id)}
                    className="p-1.5 text-red-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Avatar name={post.authorName} photoURL={post.authorAvatar} size="sm"/>
              <span className="text-sm font-medium text-slate-400">{post.authorName}</span>
              <span className="text-xs text-slate-600">{timeAgo(post.createdAt)}</span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>

            {post.code && <CodeBlock code={post.code} lang={post.codeLanguage||'cpp'}/>}

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {post.tags.map(t=>(
                  <span key={t} className="px-2 py-0.5 rounded-full bg-game-surface text-slate-600
                    text-xs border border-game-border">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div>
        <p className="text-xs text-slate-600 mb-3 font-medium uppercase tracking-wider">
          {replies.length} {replies.length===1?'Reply':'Replies'}
        </p>
        <div className="space-y-3">
          {replies.map(r => <Reply key={r.id} reply={r} postId={postId} isAdmin={isAdmin}/>)}
        </div>
      </div>

      {/* Reply box */}
      <ReplyBox postId={postId} />
    </div>
  );
}