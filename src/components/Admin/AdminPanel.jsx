// frontend/src/components/Admin/AdminPanel.jsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronRight,
  Server, AlertTriangle, Check, Loader, ExternalLink, ClipboardList,
  Code2, MessageSquare, Lightbulb, BookOpen, RefreshCw, CheckSquare,
  Square, Minus } from 'lucide-react';
import {
  fetchAllProblems, createProblem, updateProblem, deleteProblem, seedProblemsToFirestore,
} from '../../utils/firestoreService.js';
import { useAuth }  from '../../context/AuthContext.jsx';
import { useTheme } from '../../themes/ThemeContext.jsx';
import { BUILT_IN_PROBLEMS } from '../../utils/builtInProblems.js';
import PremiumManager from './PremiumManager.jsx';

const DIFFICULTIES = ['Easy','Medium','Hard'];
const TOPICS = [
  'Arrays','Strings','Linked Lists','Trees','Graphs',
  'Dynamic Programming','Recursion','Backtracking','Sorting',
  'Binary Search','Heaps','Stacks','Queues','Hashing',
  'Two Pointers','Sliding Window','Greedy','Tries',
  'Bit Manipulation','Math',
];
const LANGS = ['cpp','python','java'];

function emptyProblem() {
  return {
    title: '', topic: 'Arrays', difficulty: 'Easy', isPremium: false,
    description: '', url: '', tags: [], order: 0,
    testCases: [
      { id:1, input:'', stdinLines:'', expected:'', label:'Example 1', hidden:false },
    ],
    examples: [],
    solution: { cpp:'', python:'', java:'' },
    comment: {
      intuition: '', approach: '', walkthrough: [],
      complexity: { time:'', space:'' },
      hints: ['','',''],
      commonMistakes: [],
    },
  };
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-3 py-2 text-sm bg-game-surface border border-game-border rounded-xl
  text-white placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors`;
const textareaCls = `w-full px-3 py-2 text-sm bg-game-surface border border-game-border rounded-xl
  text-slate-300 placeholder-slate-700 outline-none resize-none focus:border-purple-500/60 transition-colors`;

function TestCaseRow({ tc, index, onChange, onRemove, canRemove }) {
  return (
    <div className="game-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input value={tc.label||''} onChange={e=>onChange(index,'label',e.target.value)}
          placeholder={`Test ${index+1}`}
          className="text-xs text-slate-400 bg-transparent outline-none border-b border-transparent
            hover:border-game-border focus:border-purple-500 transition-colors w-32"/>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={!!tc.hidden}
              onChange={e=>onChange(index,'hidden',e.target.checked)}
              className="accent-purple-500"/>
            Hidden
          </label>
          {canRemove && (
            <button onClick={()=>onRemove(index)} className="text-slate-700 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Python input (JSON)">
          <textarea value={tc.input} onChange={e=>onChange(index,'input',e.target.value)}
            rows={2} placeholder='e.g. [[1,2], 6]'
            className="w-full text-xs font-mono bg-game-surface border border-game-border rounded-lg
              px-2 py-1.5 text-slate-300 outline-none resize-none focus:border-purple-500/60"/>
        </Field>
        <Field label="C++/Java stdin">
          <textarea value={tc.stdinLines||''} onChange={e=>onChange(index,'stdinLines',e.target.value)}
            rows={2} placeholder={'e.g. 2\\n1 2\\n6'}
            className="w-full text-xs font-mono bg-game-surface border border-game-border rounded-lg
              px-2 py-1.5 text-slate-300 outline-none resize-none focus:border-purple-500/60"/>
        </Field>
      </div>
      <Field label="Expected output">
        <input value={tc.expected} onChange={e=>onChange(index,'expected',e.target.value)}
          placeholder='e.g. [0,1] or "true" or 42'
          className="w-full text-xs font-mono bg-game-surface border border-game-border rounded-lg
            px-2 py-1.5 text-slate-300 outline-none focus:border-purple-500/60"/>
      </Field>
    </div>
  );
}

function HintRow({ value, index, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const preview = value?.trim().slice(0, 60) || 'Empty hint';
  return (
    <div className="border border-game-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-game-surface cursor-pointer"
        onClick={()=>setOpen(o=>!o)}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400 font-medium">Hint {index+1}</span>
          {!open && <span className="text-xs text-slate-600 truncate max-w-xs">{preview}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e=>{e.stopPropagation();onRemove(index);}}
            className="text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3"/>
          </button>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-600"/>
                : <ChevronRight className="w-3.5 h-3.5 text-slate-600"/>}
        </div>
      </div>
      {open && (
        <div className="p-3 border-t border-game-border">
          <textarea value={value||''} onChange={e=>onChange(index,e.target.value)}
            rows={3} placeholder="Write a hint that guides without giving away the answer…"
            className={textareaCls + ' text-sm'}/>
        </div>
      )}
    </div>
  );
}

function ProblemForm({ initial, onSave, onCancel, saving }) {
  const [form,    setForm]    = useState(() => {
    const base = emptyProblem();
    if (!initial) return base;
    return { ...base, ...initial, solution: initial.solution || base.solution, comment: initial.comment || base.comment };
  });
  const [activeTab, setActiveTab] = useState('details');
  const [codeLang,  setCodeLang]  = useState('cpp');
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  function onTestChange(i, field, val) {
    set('testCases', form.testCases.map((tc,idx) => idx===i ? {...tc,[field]:val} : tc));
  }
  function addTest() {
    const newId = Math.max(0,...form.testCases.map(t=>t.id))+1;
    set('testCases',[...form.testCases,{id:newId,input:'',stdinLines:'',expected:'',label:`Test ${newId}`,hidden:false}]);
  }
  function removeTest(i) { if (form.testCases.length>1) set('testCases', form.testCases.filter((_,idx)=>idx!==i)); }
  function setSolutionLang(lang, code) { set('solution', {...(form.solution||{}), [lang]: code }); }
  function setComment(field, val) { set('comment', {...(form.comment||{}), [field]: val }); }
  function setComplexity(field, val) { set('comment', {...(form.comment||{}), complexity:{...(form.comment?.complexity||{}), [field]:val}}); }
  function setHint(i, val) { const h=[...(form.comment?.hints||[])]; h[i]=val; setComment('hints',h); }
  function addHint() { setComment('hints', [...(form.comment?.hints||[]), '']); }
  function removeHint(i) { setComment('hints', (form.comment?.hints||[]).filter((_,idx)=>idx!==i)); }
  function setWalkLine(i, val) { const l=[...(form.comment?.walkthrough||[])]; l[i]=val; setComment('walkthrough',l); }
  function addWalkLine() { setComment('walkthrough', [...(form.comment?.walkthrough||[]), '']); }
  function removeWalkLine(i) { setComment('walkthrough', (form.comment?.walkthrough||[]).filter((_,idx)=>idx!==i)); }

  const TABS = [
    { id:'details',  label:'Details',  icon:BookOpen },
    { id:'tests',    label:'Tests',    icon:ClipboardList },
    { id:'solution', label:'Solution', icon:Code2 },
    { id:'comments', label:'Comments', icon:MessageSquare },
    { id:'hints',    label:'Hints',    icon:Lightbulb },
  ];

  return (
    <div className="space-y-4">
      <div className="flex border-b border-game-border">
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors
              ${activeTab===id?'text-purple-400 border-b-2 border-purple-500':'text-slate-600 hover:text-slate-400'}`}>
            <Icon className="w-3.5 h-3.5"/>{label}
          </button>
        ))}
      </div>

      {activeTab==='details' && (
        <div className="space-y-3">
          <Field label="Problem title *">
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Two Sum" className={inputCls}/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Topic">
              <select value={form.topic} onChange={e=>set('topic',e.target.value)} className={inputCls}>
                {TOPICS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={e=>set('difficulty',e.target.value)} className={inputCls}>
                {DIFFICULTIES.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={5} placeholder="Problem statement…" className={textareaCls}/>
          </Field>
          <Field label="LeetCode URL (optional)">
            <input value={form.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://leetcode.com/problems/two-sum/" className={inputCls}/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tags (comma separated)">
              <input value={(form.tags||[]).join(',')} onChange={e=>set('tags',e.target.value.split(',').map(t=>t.trim()).filter(Boolean))} placeholder="array, hash-map" className={inputCls}/>
            </Field>
            <Field label="Order">
              <input type="number" value={form.order??0} onChange={e=>set('order',parseInt(e.target.value)||0)} className={inputCls}/>
            </Field>
          </div>
        </div>
      )}

      {activeTab==='tests' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">Test Cases ({form.testCases.length})</p>
            <button onClick={addTest} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
              <Plus className="w-3 h-3"/>Add
            </button>
          </div>
          <div className="space-y-2">
            {form.testCases.map((tc,i)=>(
              <TestCaseRow key={tc.id} tc={tc} index={i} onChange={onTestChange} onRemove={removeTest} canRemove={form.testCases.length>1}/>
            ))}
          </div>
        </div>
      )}

      {activeTab==='solution' && (
        <div className="space-y-3">
          <div className="flex gap-1">
            {LANGS.map(l=>(
              <button key={l} onClick={()=>setCodeLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${codeLang===l?'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  :'bg-game-surface text-slate-500 border border-game-border hover:text-slate-300'}`}>
                {l==='cpp'?'C++':l==='python'?'Python':'Java'}
              </button>
            ))}
          </div>
          <textarea value={form.solution?.[codeLang]||''} onChange={e=>setSolutionLang(codeLang,e.target.value)} rows={16}
            placeholder={codeLang==='cpp'?'#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}'
              :codeLang==='python'?'def solve():\n    pass'
              :'class Main {\n    public static void main(String[] args) {}\n}'}
            className="w-full px-3 py-2 text-sm font-mono bg-game-surface border border-game-border rounded-xl text-slate-300 outline-none resize-none focus:border-purple-500/60"/>
        </div>
      )}

      {activeTab==='comments' && (
        <div className="space-y-4">
          <Field label="Intuition"><textarea value={form.comment?.intuition||''} onChange={e=>setComment('intuition',e.target.value)} rows={3} placeholder="Core insight…" className={textareaCls}/></Field>
          <Field label="Approach"><textarea value={form.comment?.approach||''} onChange={e=>setComment('approach',e.target.value)} rows={4} placeholder="Step by step…" className={textareaCls}/></Field>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500">Walkthrough</label>
              <button onClick={addWalkLine} className="text-xs text-purple-400 flex items-center gap-1"><Plus className="w-3 h-3"/>Add line</button>
            </div>
            <div className="space-y-1.5">
              {(form.comment?.walkthrough||[]).map((line,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 w-4 shrink-0">{i+1}.</span>
                  <input value={line} onChange={e=>setWalkLine(i,e.target.value)} className="flex-1 px-2 py-1.5 text-xs font-mono bg-game-surface border border-game-border rounded-lg text-slate-300 outline-none focus:border-purple-500/60"/>
                  <button onClick={()=>removeWalkLine(i)} className="text-slate-700 hover:text-red-400"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time Complexity"><input value={form.comment?.complexity?.time||''} onChange={e=>setComplexity('time',e.target.value)} placeholder="O(n)" className={inputCls}/></Field>
            <Field label="Space Complexity"><input value={form.comment?.complexity?.space||''} onChange={e=>setComplexity('space',e.target.value)} placeholder="O(n)" className={inputCls}/></Field>
          </div>
        </div>
      )}

      {activeTab==='hints' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {(form.comment?.hints||[]).map((hint,i)=>(
              <HintRow key={i} value={hint} index={i} onChange={setHint} onRemove={removeHint}/>
            ))}
          </div>
          <button onClick={addHint} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-game-surface border border-game-border text-slate-500 hover:text-slate-300">
            <Plus className="w-3.5 h-3.5"/>Add Hint
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-game-border">
        <button onClick={()=>onSave(form)} disabled={saving||!form.title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors">
          {saving?<Loader className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>}
          {saving?'Saving…':'Save Problem'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-game-surface border border-game-border text-slate-400 hover:text-slate-200">
          <X className="w-3.5 h-3.5"/>Cancel
        </button>
      </div>
    </div>
  );
}

// ── Topic group with checkboxes ────────────────────────────────
function TopicGroup({ topic, problems, onEdit, onDelete, deletingId, selected, onToggle, onToggleAll }) {
  const [open, setOpen] = useState(true);
  const topicIds = problems.map(p => p.id);
  const allSelected = topicIds.every(id => selected.has(id));
  const someSelected = topicIds.some(id => selected.has(id));

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-game-surface transition-colors">
        {/* Topic-level checkbox */}
        <button onClick={() => onToggleAll(topicIds, !allSelected)} className="shrink-0">
          {allSelected
            ? <CheckSquare className="w-4 h-4 text-purple-400"/>
            : someSelected
            ? <Minus className="w-4 h-4 text-purple-400"/>
            : <Square className="w-4 h-4 text-slate-600"/>}
        </button>
        <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 flex-1 text-left">
          {open?<ChevronDown className="w-4 h-4 text-slate-600"/>:<ChevronRight className="w-4 h-4 text-slate-600"/>}
          <span className="font-medium text-slate-300 text-sm flex-1">{topic}</span>
          <span className="text-slate-600 text-xs">{problems.length} problems</span>
        </button>
      </div>

      {open && (
        <div className="ml-2 space-y-1.5 mt-1">
          {problems.map(p=>(
            <div key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
                ${selected.has(p.id)
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-game-surface border-game-border'}`}>
              {/* Per-problem checkbox */}
              <button onClick={() => onToggle(p.id)} className="shrink-0">
                {selected.has(p.id)
                  ? <CheckSquare className="w-4 h-4 text-purple-400"/>
                  : <Square className="w-4 h-4 text-slate-600"/>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{p.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium
                    ${p.difficulty==='Easy'?'bg-green-500/20 text-green-400'
                    :p.difficulty==='Medium'?'bg-yellow-500/20 text-yellow-400'
                    :'bg-red-500/20 text-red-400'}`}>
                    {p.difficulty}
                  </span>
                  {p.solution?.cpp    && <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 rounded">C++</span>}
                  {p.solution?.python && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 rounded">Py</span>}
                  {p.solution?.java   && <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 rounded">Java</span>}
                  {p.comment?.intuition && <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 rounded">💬</span>}
                  {(p.comment?.hints?.filter(Boolean).length>0) && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 rounded">💡{p.comment.hints.filter(Boolean).length}</span>}
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-blue-400"><ExternalLink className="w-3 h-3"/></a>}
                </div>
                <p className="text-xs text-slate-600">{p.testCases?.length||0} test cases{!p.description&&' · no description'}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={()=>onEdit(p)} className="p-1.5 rounded-lg text-slate-600 hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
                  <Pencil className="w-3.5 h-3.5"/>
                </button>
                <button onClick={()=>onDelete(p)} disabled={deletingId===p.id}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors">
                  {deletingId===p.id?<Loader className="w-3.5 h-3.5 animate-spin"/>:<Trash2 className="w-3.5 h-3.5"/>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────
export default function AdminPanel() {
  const { userProfile, logout } = useAuth();
  const { isMario, toggle }     = useTheme();
  const [problems,       setProblems]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [mode,           setMode]           = useState('list');
  const [adminTab,       setAdminTab]       = useState('problems');
  const [editingProblem, setEditingProblem] = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [deletingId,     setDeletingId]     = useState(null);
  const [seeding,        setSeeding]        = useState(false);
  const [seedDone,       setSeedDone]       = useState(false);
  const [toast,          setToast]          = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [search,         setSearch]         = useState('');

  // ── Multi-select state ────────────────────────────────────────
  const [selected,       setSelected]       = useState(new Set());
  const [bulkDeleting,   setBulkDeleting]   = useState(false);
  const [confirmBulk,    setConfirmBulk]    = useState(false);

  function showToast(msg, type='success') {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  }

  useEffect(()=>{ loadProblems(); },[]);

  async function loadProblems() {
    setLoading(true);
    try { setProblems(await fetchAllProblems()); }
    catch(e) { showToast('Failed to load: '+e.message,'error'); }
    finally { setLoading(false); }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (mode==='edit' && editingProblem?.id) {
        await updateProblem(editingProblem.id, form);
        showToast('Problem updated.');
      } else {
        await createProblem(form);
        showToast('Problem created.');
      }
      await loadProblems();
      setMode('list'); setEditingProblem(null);
    } catch(e) { showToast('Save failed: '+e.message,'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(problem) {
    if (confirmDelete?.id!==problem.id) { setConfirmDelete(problem); return; }
    setDeletingId(problem.id); setConfirmDelete(null);
    try {
      await deleteProblem(problem.id);
      showToast('Deleted.');
      setSelected(prev => { const n = new Set(prev); n.delete(problem.id); return n; });
      await loadProblems();
    } catch(e) { showToast('Delete failed: '+e.message,'error'); }
    finally { setDeletingId(null); }
  }

  async function handleSeed() {
    if (problems.length>0 && !window.confirm(`Firestore already has ${problems.length} problems. Continue?`)) return;
    setSeeding(true);
    try {
      await seedProblemsToFirestore(BUILT_IN_PROBLEMS);
      setSeedDone(true);
      showToast(`Seeded ${BUILT_IN_PROBLEMS.length} problems.`);
      await loadProblems();
    } catch(e) { showToast('Seed failed: '+e.message,'error'); }
    finally { setSeeding(false); }
  }

  // ── Multi-select handlers ─────────────────────────────────────
  function toggleOne(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleTopicAll(ids, shouldSelect) {
    setSelected(prev => {
      const n = new Set(prev);
      ids.forEach(id => shouldSelect ? n.add(id) : n.delete(id));
      return n;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map(p => p.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    if (!confirmBulk) { setConfirmBulk(true); return; }
    setBulkDeleting(true);
    setConfirmBulk(false);
    const ids = Array.from(selected);
    let deleted = 0;
    let failed  = 0;
    for (const id of ids) {
      try { await deleteProblem(id); deleted++; }
      catch { failed++; }
    }
    setSelected(new Set());
    await loadProblems();
    setBulkDeleting(false);
    if (failed > 0) showToast(`Deleted ${deleted}, failed ${failed}.`, 'error');
    else showToast(`Deleted ${deleted} problem${deleted!==1?'s':''}.`);
  }

  // Filter + group
  const filtered = search.trim()
    ? problems.filter(p=>p.title.toLowerCase().includes(search.toLowerCase())
        || p.topic.toLowerCase().includes(search.toLowerCase()))
    : problems;

  const allSelected  = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const someSelected = filtered.some(p => selected.has(p.id));

  const byTopic = {};
  filtered.forEach(p => { if (!byTopic[p.topic]) byTopic[p.topic]=[]; byTopic[p.topic].push(p); });

  const headerBg = isMario ? '#c84b0c' : '#0f0e17';
  const headerBorder = isMario ? '4px solid #8b2e00' : '1px solid var(--game-border)';

  return (
    <div className="min-h-screen" style={{ background: isMario ? '#5c94fc' : '#0f0e17' }}>
      <header className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ background: headerBg, borderBottom: headerBorder, boxShadow: isMario?'0 4px 0 #5a1a00':undefined }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <span className="text-sm">⚙</span>
          </div>
          <div>
            <p className="pixel text-xs" style={{color:isMario?'#fbd000':'#a78bfa'}}>Admin Panel</p>
            <p className="text-xs" style={{color:isMario?'#ffe4b5':'#64748b'}}>{userProfile?.displayName||userProfile?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{problems.length} problems</span>
          <button onClick={toggle} className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
            style={isMario?{background:'#8b2e00',border:'2px solid #5a1a00',color:'#ffd000'}
              :{background:'var(--game-surface)',border:'1px solid var(--game-border)',color:'#a78bfa'}}>
            {isMario?'🌙 Dark':'🌞 Mario'}
          </button>
          <button onClick={logout} className="px-3 py-1.5 text-xs bg-game-surface border border-game-border rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium
            ${toast.type==='error'?'bg-red-500/20 border border-red-500/40 text-red-300':'bg-green-500/20 border border-green-500/40 text-green-300'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex gap-2 mb-5 border-b border-game-border pb-3">
          {[['problems','Problems'],['premium','Premium Users']].map(([id,label])=>(
            <button key={id} onClick={()=>setAdminTab(id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
                ${adminTab===id?'bg-purple-600/20 text-purple-400 border border-purple-500/30':'text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {adminTab==='premium' && <PremiumManager/>}

        {adminTab==='problems' && <>

          {/* Single delete confirm */}
          {confirmDelete && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0"/>
              <p className="text-red-300 text-sm flex-1">Delete <strong>"{confirmDelete.title}"</strong>? Cannot be undone.</p>
              <button onClick={()=>handleDelete(confirmDelete)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg font-medium">Delete</button>
              <button onClick={()=>setConfirmDelete(null)} className="px-3 py-1.5 bg-game-surface border border-game-border text-slate-400 text-xs rounded-lg">Cancel</button>
            </div>
          )}

          {/* Bulk delete confirm */}
          {confirmBulk && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0"/>
              <p className="text-red-300 text-sm flex-1">
                Delete <strong>{selected.size} problem{selected.size!==1?'s':''}</strong>? This cannot be undone.
              </p>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg font-medium">
                Yes, delete all
              </button>
              <button onClick={()=>setConfirmBulk(false)} className="px-3 py-1.5 bg-game-surface border border-game-border text-slate-400 text-xs rounded-lg">
                Cancel
              </button>
            </div>
          )}

          {mode==='list' && (
            <div className="space-y-3 mb-5">
              {/* Top action bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={()=>{setMode('create');setEditingProblem(null);}}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                  <Plus className="w-4 h-4"/>New Problem
                </button>
                {problems.length===0 && (
                  <button onClick={handleSeed} disabled={seeding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-game-surface border border-game-border text-slate-300 hover:border-purple-500 transition-colors disabled:opacity-50">
                    {seeding?<Loader className="w-4 h-4 animate-spin"/>:seedDone?<Check className="w-4 h-4 text-green-400"/>:<Server className="w-4 h-4"/>}
                    Seed Built-in ({BUILT_IN_PROBLEMS.length})
                  </button>
                )}
                <button onClick={loadProblems} disabled={loading} className="p-2 rounded-xl bg-game-surface border border-game-border text-slate-500 hover:text-slate-300 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
                </button>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search problems…"
                  className="flex-1 min-w-36 px-3 py-2 text-sm bg-game-surface border border-game-border rounded-xl text-slate-300 placeholder-slate-700 outline-none focus:border-purple-500/60"/>
              </div>

              {/* Multi-select toolbar — shown when problems exist */}
              {filtered.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-game-surface border border-game-border flex-wrap">
                  {/* Select all / none toggle */}
                  <button onClick={allSelected ? selectNone : selectAll}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-purple-400"/>
                      : someSelected
                      ? <Minus className="w-4 h-4 text-purple-400"/>
                      : <Square className="w-4 h-4"/>}
                    {allSelected ? 'Deselect all' : 'Select all'}
                    <span className="text-slate-600">({filtered.length})</span>
                  </button>

                  {selected.size > 0 && (
                    <>
                      <div className="w-px h-4 bg-game-border"/>
                      <span className="text-xs text-purple-400 font-medium">
                        {selected.size} selected
                      </span>
                      <button onClick={selectNone} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                        Clear
                      </button>
                      <div className="ml-auto">
                        <button
                          onClick={handleBulkDelete}
                          disabled={bulkDeleting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-red-600/20 border border-red-500/40 text-red-400
                            hover:bg-red-600/40 disabled:opacity-50 transition-colors">
                          {bulkDeleting
                            ? <><Loader className="w-3.5 h-3.5 animate-spin"/> Deleting…</>
                            : <><Trash2 className="w-3.5 h-3.5"/> Delete {selected.size} selected</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {(mode==='create'||mode==='edit') && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <button onClick={()=>{setMode('list');setEditingProblem(null);}} className="text-slate-600 hover:text-slate-300 transition-colors text-sm">← Back</button>
                <h2 className="text-white font-semibold">{mode==='create'?'New Problem':`Edit: ${editingProblem?.title}`}</h2>
              </div>
              <ProblemForm initial={mode==='edit'?editingProblem:null} onSave={handleSave} onCancel={()=>{setMode('list');setEditingProblem(null);}} saving={saving}/>
            </div>
          )}

          {mode==='list' && (
            loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader className="w-6 h-6 animate-spin text-purple-400"/>
              </div>
            ) : problems.length===0 ? (
              <div className="text-center py-16">
                <Server className="w-10 h-10 mx-auto mb-3 text-slate-700"/>
                <p className="text-slate-500 mb-2">No problems yet.</p>
                <p className="text-slate-700 text-sm">Click "Seed Built-in Problems" or "New Problem" to get started.</p>
              </div>
            ) : (
              <>
                {search && <p className="text-xs text-slate-600 mb-3">{filtered.length} result{filtered.length!==1?'s':''} for "{search}"</p>}
                {Object.keys(byTopic).sort().map(topic=>(
                  <TopicGroup key={topic} topic={topic} problems={byTopic[topic]}
                    onEdit={p=>{setEditingProblem(p);setMode('edit');}}
                    onDelete={handleDelete} deletingId={deletingId}
                    selected={selected}
                    onToggle={toggleOne}
                    onToggleAll={toggleTopicAll}
                  />
                ))}
              </>
            )
          )}
        </>}
      </main>
    </div>
  );
}