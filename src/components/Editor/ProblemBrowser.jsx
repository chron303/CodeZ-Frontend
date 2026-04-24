// frontend/src/components/Editor/ProblemBrowser.jsx
//
// Slide-out problem browser in the Practice tab.
// Shows all topics + problems, grouped and searchable,
// without leaving the editor view.

import { useState, useMemo } from 'react';
import { Search, X, CheckCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const DIFF_DOT = {
  Easy:   'bg-green-400',
  Medium: 'bg-yellow-400',
  Hard:   'bg-red-400',
};

const DIFF_TEXT = {
  Easy:   'text-green-400',
  Medium: 'text-yellow-400',
  Hard:   'text-red-400',
};

function TopicGroup({ topic, query, activeProblemId, onSelect }) {
  const [open, setOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!query) return topic.problems;
    return topic.problems.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [topic.problems, query]);

  if (filtered.length === 0) return null;

  const solvedCount = topic.problems.filter(p => p.solved).length;
  const pct = Math.round((solvedCount / topic.total) * 100);

  return (
    <div className="mb-1">
      {/* Topic header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-game-surface transition-colors text-left"
      >
        {open
          ? <ChevronDown  className="w-3 h-3 text-slate-600 shrink-0" />
          : <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        }
        <span className="flex-1 text-xs font-medium text-slate-400 truncate">{topic.topic}</span>
        <span className={`text-xs font-mono shrink-0 ${pct === 100 ? 'text-green-400' : 'text-slate-700'}`}>
          {pct}%
        </span>
      </button>

      {/* Problem list */}
      {open && (
        <div className="ml-2 space-y-0.5">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                ${p.id === activeProblemId
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : 'hover:bg-game-surface'
                } ${p.solved ? 'opacity-60' : ''}`}
            >
              {p.solved
                ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                : <Circle      className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              }
              <span className={`flex-1 text-xs truncate ${p.solved ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                {p.title}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIFF_DOT[p.difficulty] || 'bg-slate-600'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProblemBrowser({ onClose }) {
  const { topics, activeProblem, openProblem } = useApp();
  const [query,      setQuery]      = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [showOnly,   setShowOnly]   = useState('all'); // 'all' | 'unsolved' | 'solved'

  const filtered = useMemo(() => {
    return topics.map(t => ({
      ...t,
      problems: t.problems.filter(p => {
        if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
        if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false;
        if (showOnly === 'unsolved' && p.solved) return false;
        if (showOnly === 'solved'   && !p.solved) return false;
        return true;
      }),
    })).filter(t => t.problems.length > 0);
  }, [topics, query, diffFilter, showOnly]);

  const totalShown   = filtered.reduce((s, t) => s + t.problems.length, 0);
  const totalProbs   = topics.reduce((s, t) => s + t.total, 0);
  const totalSolved  = topics.reduce((s, t) => s + t.solved, 0);

  function handleSelect(problem) {
    openProblem(problem);
    onClose();
  }

  return (
    <div className="flex flex-col h-full border-r border-game-border bg-game-card" style={{ width: '220px' }}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-game-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-300">Problems</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono">
              {totalSolved}/{totalProbs}
            </span>
            <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-6 pr-2 py-1 text-xs bg-game-surface border border-game-border rounded-lg
              text-slate-300 placeholder-slate-700 outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {['All','Easy','Medium','Hard'].map(d => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-1.5 py-0.5 rounded text-xs transition-colors
                ${diffFilter === d
                  ? d === 'Easy'   ? 'bg-green-500/20 text-green-400'
                  : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
                  : d === 'Hard'   ? 'bg-red-500/20 text-red-400'
                  :                  'bg-purple-500/20 text-purple-400'
                  : 'text-slate-600 hover:text-slate-400'}`}
            >{d}</button>
          ))}
        </div>

        <div className="flex gap-1 mt-1">
          {[['all','All'],['unsolved','Todo'],['solved','Done']].map(([val, label]) => (
            <button key={val} onClick={() => setShowOnly(val)}
              className={`px-1.5 py-0.5 rounded text-xs transition-colors
                ${showOnly === val ? 'text-purple-400 bg-purple-500/20' : 'text-slate-700 hover:text-slate-500'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      <div className="flex-1 overflow-y-auto p-2">
        {totalShown === 0 ? (
          <p className="text-xs text-slate-700 text-center py-6">No problems match</p>
        ) : (
          filtered.map(topic => (
            <TopicGroup
              key={topic.topic}
              topic={topic}
              query={query}
              activeProblemId={activeProblem?.id}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-game-border shrink-0">
        <p className="text-xs text-slate-700 text-center">
          {totalShown} problem{totalShown !== 1 ? 's' : ''}
          {(query || diffFilter !== 'All' || showOnly !== 'all') ? ' shown' : ' total'}
        </p>
      </div>
    </div>
  );
}