// frontend/src/components/Community/PostComposer.jsx
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Send, Code2, X, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { createPost } from '../../utils/communityService.js';
import { getUserProfile } from '../../utils/communityService.js';

const LANGS = ['cpp','python','java'];

export default function PostComposer({ onClose, onPosted }) {
  const { user } = useAuth();
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [code,     setCode]     = useState('');
  const [lang,     setLang]     = useState('cpp');
  const [showCode, setShowCode] = useState(false);
  const [tags,     setTags]     = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim())  { setError('Body is required.'); return; }
    setLoading(true); setError('');
    try {
      const profile = await getUserProfile(user.uid) || {
        username: user.displayName, displayName: user.displayName, photoURL: user.photoURL
      };
      await createPost(user.uid, profile, {
        title, body,
        code: showCode ? code : '',
        codeLanguage: lang, tags,
      });
      onPosted?.(); onClose?.();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g,'');
      if (t && !tags.includes(t) && tags.length < 5) setTags(p => [...p, t]);
      setTagInput('');
    }
  }

  return (
    <div className="game-card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-game-border">
        <p className="font-semibold text-white text-sm">New Post</p>
        {onClose && <button onClick={onClose} className="text-slate-600 hover:text-slate-300"><X className="w-4 h-4"/></button>}
      </div>
      <div className="p-5 space-y-4">
        <input value={title} onChange={e=>setTitle(e.target.value)}
          placeholder="What's your question or topic?"
          className="w-full px-4 py-2.5 text-sm bg-game-surface border border-game-border rounded-xl
            text-white placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors"/>

        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5}
          placeholder="Describe your question, approach, or thoughts…"
          className="w-full px-4 py-3 text-sm bg-game-surface border border-game-border rounded-xl
            text-slate-300 placeholder-slate-700 outline-none resize-none focus:border-purple-500/60
            transition-colors leading-relaxed"/>

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
                {t}<button onClick={()=>setTags(tags.filter(x=>x!==t))}><X className="w-2.5 h-2.5"/></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="Add tags (Enter) — max 5"
              className="flex-1 text-xs bg-transparent text-slate-400 placeholder-slate-700
                outline-none border-b border-game-border focus:border-purple-500/40 pb-1"/>
          </div>
        </div>

        {/* Code block */}
        <div>
          <button onClick={()=>setShowCode(s=>!s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors
              ${showCode?'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              :'bg-game-surface border border-game-border text-slate-500 hover:text-slate-300'}`}>
            <Code2 className="w-3.5 h-3.5"/>{showCode?'Remove code':'Add code block'}
          </button>
          {showCode && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {LANGS.map(l=>(
                  <button key={l} onClick={()=>setLang(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                      ${lang===l?'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      :'bg-game-surface text-slate-500 border border-game-border hover:text-slate-300'}`}>
                    {l==='cpp'?'C++':l==='python'?'Python':'Java'}
                  </button>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden border border-game-border">
                <Editor height="180px" language={lang==='cpp'?'cpp':lang} theme="vs-dark"
                  value={code} onChange={v=>setCode(v||'')}
                  options={{fontSize:12,minimap:{enabled:false},lineNumbers:'off',
                    scrollBeyondLastLine:false,padding:{top:8}}}/>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex justify-end gap-2">
          {onClose && <button onClick={onClose}
            className="px-4 py-2 text-sm bg-game-surface border border-game-border
              text-slate-400 rounded-xl hover:text-slate-200 transition-colors">Cancel</button>}
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium
              bg-purple-600 hover:bg-purple-500 text-white rounded-xl
              disabled:opacity-40 transition-colors">
            <Send className="w-3.5 h-3.5"/>{loading?'Posting…':'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}