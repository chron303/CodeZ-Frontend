// frontend/src/components/Editor/ProblemPanel.jsx
//
// Left panel in the editor. Three tabs:
//   Problem — title, description, examples
//   Tests   — view/edit test cases, add custom ones
//   Notes   — personal scratchpad per problem

import { useState, useCallback } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Plus, Trash2,
         BookOpen, ClipboardList, FileText, CheckCircle, Star, Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import SolutionsPanel from './SolutionsPanel.jsx';

const DIFF_COLOR = {
  Easy:   'text-green-400  bg-green-500/15  border-green-500/30',
  Medium: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  Hard:   'text-red-400    bg-red-500/15    border-red-500/30',
};

// ── Neighbor navigation ────────────────────────────────────────
function useNeighbors(problem) {
  const { topics } = useApp();
  if (!problem) return { prev: null, next: null };
  const topicData = topics.find(t => t.topic === problem.topic);
  if (!topicData) return { prev: null, next: null };
  const idx = topicData.problems.findIndex(p => p.id === problem.id);
  return {
    prev: idx > 0                         ? topicData.problems[idx - 1] : null,
    next: idx < topicData.problems.length - 1 ? topicData.problems[idx + 1] : null,
  };
}

// ── Tab: Problem description ───────────────────────────────────
function ProblemTab({ p }) {
  const visibleTests = (p.testCases || []).filter(tc => !tc.hidden);
  return (
    <div className="space-y-4">
      {/* Curated badge */}
      {p.hasCuratedTests && (
        <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1.5 rounded-lg">
          <Star className="w-3 h-3" />
          Curated test cases loaded
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
        {p.description ? (
          <p className="text-slate-300 text-sm leading-relaxed">{p.description}</p>
        ) : (
          <p className="text-slate-600 text-sm italic">
            No description in CSV.
            {p.url && (
              <> <a href={p.url} target="_blank" rel="noreferrer"
                className="text-blue-400 hover:underline not-italic">
                View on LeetCode →
              </a></>
            )}
          </p>
        )}
      </div>

      {/* Example test cases */}
      {visibleTests.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Examples</p>
          <div className="space-y-2">
            {visibleTests.map((tc, i) => (
              <div key={tc.id} className="game-card p-3 text-xs font-mono space-y-1.5">
                <p className="text-slate-600 not-mono text-xs mb-1" style={{ fontFamily: 'inherit' }}>
                  Example {i + 1}{tc.label ? ` · ${tc.label}` : ''}
                </p>
                <div className="flex gap-2">
                  <span className="text-slate-600 w-14 shrink-0">Input:</span>
                  <span className="text-slate-300 whitespace-pre-wrap break-all">{tc.input}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-600 w-14 shrink-0">Output:</span>
                  <span className="text-green-400 whitespace-pre-wrap break-all">{tc.expected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint box */}
      <div className="game-card p-3 text-xs text-slate-600 leading-relaxed">
        <p className="font-medium text-slate-500 mb-1">How the judge works</p>
        Write a <code className="text-purple-400 bg-purple-500/10 px-1 rounded">solve(input)</code> function.
        The input is JSON-parsed, so <code className="text-slate-400">[[1,2],3]</code> gives you an array
        and a number. Return any JSON-serializable value.
      </div>
    </div>
  );
}

// ── Tab: Test case editor ──────────────────────────────────────
function TestsTab({ p }) {
  const { updateTestCases } = useApp();
  const tests = p.testCases || [];

  const update = useCallback((id, field, value) => {
    updateTestCases(tests.map(tc =>
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  }, [tests, updateTestCases]);

  const addTest = useCallback(() => {
    const newId = Math.max(0, ...tests.map(t => t.id)) + 1;
    updateTestCases([...tests, { id: newId, input: '', expected: '', label: `Test ${newId}` }]);
  }, [tests, updateTestCases]);

  const removeTest = useCallback((id) => {
    if (tests.length <= 1) return; // keep at least one
    updateTestCases(tests.filter(tc => tc.id !== id));
  }, [tests, updateTestCases]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{tests.length} test case{tests.length !== 1 ? 's' : ''}</p>
        <button
          onClick={addTest}
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add test
        </button>
      </div>

      <div className="space-y-2">
        {tests.map((tc, i) => (
          <div key={tc.id} className="game-card p-3 space-y-2">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <input
                value={tc.label || ''}
                onChange={e => update(tc.id, 'label', e.target.value)}
                placeholder={`Test ${i + 1}`}
                className="text-xs text-slate-400 bg-transparent outline-none border-b border-transparent
                  hover:border-game-border focus:border-purple-500 transition-colors w-32"
              />
              <div className="flex items-center gap-2">
                {tc.hidden && <span className="text-xs text-slate-700">hidden</span>}
                <button
                  onClick={() => update(tc.id, 'hidden', !tc.hidden)}
                  className="text-xs text-slate-700 hover:text-slate-400 transition-colors"
                  title="Toggle hidden"
                >
                  {tc.hidden ? '👁️' : '👁'}
                </button>
                <button
                  onClick={() => removeTest(tc.id)}
                  disabled={tests.length <= 1}
                  className="text-slate-700 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Input */}
            <div>
              <p className="text-xs text-slate-600 mb-1">Input (JSON)</p>
              <textarea
                value={tc.input}
                onChange={e => update(tc.id, 'input', e.target.value)}
                rows={2}
                placeholder="e.g. [[1,2,3], 6]"
                className="w-full text-xs font-mono bg-game-surface border border-game-border rounded-lg
                  px-2 py-1.5 text-slate-300 outline-none resize-none
                  focus:border-purple-500/60 transition-colors placeholder-slate-700"
              />
            </div>

            {/* Expected */}
            <div>
              <p className="text-xs text-slate-600 mb-1">Expected output</p>
              <input
                value={tc.expected}
                onChange={e => update(tc.id, 'expected', e.target.value)}
                placeholder='e.g. [0,1] or "hello" or 42'
                className="w-full text-xs font-mono bg-game-surface border border-game-border rounded-lg
                  px-2 py-1.5 text-slate-300 outline-none
                  focus:border-purple-500/60 transition-colors placeholder-slate-700"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        Inputs are JSON-parsed before being passed to <code className="text-slate-500">solve()</code>.
        Pass multiple arguments as a JSON array: <code className="text-slate-500">[[1,2], 6]</code>
        → destructure with <code className="text-slate-500">const [nums, target] = input</code>.
      </p>
    </div>
  );
}

// ── Tab: Notes ─────────────────────────────────────────────────
function NotesTab({ p }) {
  const { saveNote } = useApp();
  const [note, setNote] = useState(p.note || '');

  const handleChange = (val) => {
    setNote(val);
    saveNote(p.topic, p.id, val);
  };

  return (
    <div className="space-y-2 h-full">
      <p className="text-xs text-slate-500">Personal notes for this problem</p>
      <textarea
        value={note}
        onChange={e => handleChange(e.target.value)}
        placeholder={"Approach:\n\nTime complexity:\n\nSpace complexity:\n\nGotchas:"}
        className="w-full flex-1 font-mono text-xs bg-game-surface border border-game-border rounded-xl
          p-3 text-slate-300 outline-none resize-none
          focus:border-purple-500/50 transition-colors placeholder-slate-700 leading-relaxed"
        style={{ minHeight: '260px' }}
      />
      <p className="text-xs text-slate-700">Notes are saved automatically as you type.</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
const TABS = [
  { id: 'problem',   label: 'Problem',  icon: BookOpen },
  { id: 'tests',     label: 'Tests',    icon: ClipboardList },
  { id: 'notes',     label: 'Notes',    icon: FileText },
  { id: 'solutions', label: 'Solution', icon: Lightbulb },
];

export default function ProblemPanel() {
  const { activeProblem, openProblem } = useApp();
  const { prev, next } = useNeighbors(activeProblem);
  const [activeTab, setActiveTab] = useState('problem');
  const [hasAttempted, setHasAttempted] = useState(false);

  if (!activeProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-3 p-6">
        <div className="w-12 h-12 rounded-2xl bg-game-surface flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-xs text-center leading-relaxed">
          Select a problem from the<br />City or World Map to start
        </p>
      </div>
    );
  }

  const p = activeProblem;
  const diffClass = DIFF_COLOR[p.difficulty] || DIFF_COLOR.Easy;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-game-border shrink-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-white font-semibold text-sm leading-snug flex-1">{p.title}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {p.solved && <CheckCircle className="w-4 h-4 text-green-400" />}
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer"
                className="text-slate-600 hover:text-blue-400 transition-colors"
                title="Open on LeetCode">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${diffClass}`}>
            {p.difficulty}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-game-surface border border-game-border text-slate-400">
            {p.topic}
          </span>
          {p.note && (
            <span className="text-xs text-yellow-600" title="Has notes">📝</span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-game-border shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); if (id === 'solutions') setHasAttempted(true); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors
              ${activeTab === id
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3"
        style={activeTab === 'solutions' ? {padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'} : {}}>
        {activeTab === 'problem'   && <ProblemTab p={p} />}
        {activeTab === 'tests'     && <TestsTab   p={p} />}
        {activeTab === 'notes'     && <NotesTab   p={p} />}
        {activeTab === 'solutions' && (
          <SolutionsPanel
            problem={p}
            hasAttempted={p.solved || hasAttempted}
          />
        )}
      </div>

      {/* ── Prev / Next ── */}
      <div className="px-4 py-2 border-t border-game-border flex items-center justify-between shrink-0">
        <button onClick={() => prev && openProblem(prev)} disabled={!prev}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-xs text-slate-700 truncate max-w-[120px]">{p.topic}</span>
        <button onClick={() => next && openProblem(next)} disabled={!next}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-300
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}