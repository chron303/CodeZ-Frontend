// frontend/src/components/Editor/SolutionsPanel.jsx
// Fetches solutions and explanations from GitHub repo by slug.
// Shown after user submits at least once.

import { useState, useEffect } from 'react';
import { BookOpen, Code2, MessageSquare, ChevronDown, ChevronUp,
         Loader, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

// ── Replace with your GitHub username/repo ─────────────────────
var GITHUB_RAW = 'https://raw.githubusercontent.com/chron303/CodeZ/main';

var EXT = { python: 'py', cpp: 'cpp', java: 'java' };

async function fetchRaw(url) {
  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    return res.text();
  } catch(e) { return null; }
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group">
      <pre className="text-xs font-mono text-slate-300 bg-game-surface border border-game-border
        rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
      <button onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-game-card border border-game-border
          text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Hint({ hint, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-game-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5
          bg-game-surface hover:bg-white/5 transition-colors text-left">
        <span className="text-xs text-slate-400">Hint {index + 1}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
               : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && (
        <div className="px-3 py-2.5 border-t border-game-border">
          <p className="text-xs text-slate-300 leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  );
}

export default function SolutionsPanel({ problem, hasAttempted }) {
  const [activeTab, setActiveTab] = useState('explanation');
  const [codeLang,  setCodeLang]  = useState('cpp');
  const [comment,   setComment]   = useState(null);
  const [solutions, setSolutions] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!problem || !hasAttempted) return;
    setLoading(true);
    setError(null);
    setComment(null);
    setSolutions({});

    // Use slug from problem — falls back to title-based slug
    var slug = problem.slug ||
      problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    var commentUrl = GITHUB_RAW + '/comments/' + slug + '.json';

    var langFetches = Object.entries(EXT).map(function([lang, ext]) {
      return fetchRaw(GITHUB_RAW + '/solutions/' + lang + '/' + slug + '.' + ext)
        .then(function(code) { return { lang, code }; });
    });

    Promise.all([
      fetch(commentUrl).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
      ...langFetches,
    ]).then(function([commentData, ...langResults]) {
      setComment(commentData);
      var solMap = {};
      langResults.forEach(function(r) { if (r.code) solMap[r.lang] = r.code; });
      setSolutions(solMap);
      setLoading(false);
    }).catch(function() {
      setError('Could not load from GitHub.');
      setLoading(false);
    });
  }, [problem?.id, hasAttempted]);

  if (!hasAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20
          flex items-center justify-center mb-4">
          <BookOpen className="w-5 h-5 text-purple-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">Solutions locked</p>
        <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
          Submit your code at least once to unlock the solution and explanation.
        </p>
      </div>
    );
  }

  if (!problem) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  var hasSolution = Object.keys(solutions).length > 0;
  var hasComment  = !!comment;

  if (!hasSolution && !hasComment) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <p className="text-slate-500 text-sm mb-1">No solution yet</p>
        <a href={'https://github.com/chron303/CodeZ/blob/main/CONTRIBUTING.md'}
          target="_blank" rel="noreferrer"
          className="text-xs text-purple-400 hover:underline">
          Be the first to contribute →
        </a>
      </div>
    );
  }

  var TABS = [
    { id: 'explanation', label: 'Explanation', icon: BookOpen,      show: hasComment  },
    { id: 'solution',    label: 'Solution',    icon: Code2,         show: hasSolution },
    { id: 'discussion',  label: 'Discussion',  icon: MessageSquare, show: hasComment  },
  ].filter(function(t) { return t.show; });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex border-b border-game-border shrink-0">
        {TABS.map(function({ id, label, icon: Icon }) {
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs transition-colors
                ${activeTab === id
                  ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5'
                  : 'text-slate-600 hover:text-slate-400'}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Explanation */}
        {activeTab === 'explanation' && comment && (
          <>
            <div>
              <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Intuition</p>
              <p className="text-sm text-slate-300 leading-relaxed">{comment.intuition}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Approach</p>
              <p className="text-sm text-slate-300 leading-relaxed">{comment.approach}</p>
            </div>
            {comment.walkthrough && comment.walkthrough.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Walkthrough</p>
                <div className="bg-game-surface border border-game-border rounded-xl p-3 space-y-1">
                  {comment.walkthrough.map(function(step, i) {
                    return <p key={i} className="text-xs font-mono text-slate-400">{step}</p>;
                  })}
                </div>
              </div>
            )}
            {comment.complexity && (
              <div className="flex gap-3">
                {[['Time', comment.complexity.time], ['Space', comment.complexity.space]].map(function([k, v]) {
                  return v ? (
                    <div key={k} className="flex-1 bg-game-surface border border-game-border rounded-xl p-3">
                      <p className="text-xs text-slate-600 mb-1">{k} Complexity</p>
                      <p className="text-sm font-mono text-green-400">{v}</p>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {comment.hints && comment.hints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Hints</p>
                <div className="space-y-2">
                  {comment.hints.map(function(hint, i) {
                    return <Hint key={i} hint={hint} index={i} />;
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Solution code */}
        {activeTab === 'solution' && (
          <>
            <div className="flex gap-1">
              {Object.keys(solutions).map(function(lang) {
                return (
                  <button key={lang} onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${codeLang === lang
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'bg-game-surface text-slate-500 border border-game-border hover:text-slate-300'}`}>
                    {lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python' : 'Java'}
                  </button>
                );
              })}
            </div>
            {solutions[codeLang] && <CodeBlock code={solutions[codeLang]} />}
          </>
        )}

        {/* Discussion */}
        {activeTab === 'discussion' && comment && (
          <>
            {comment.commonMistakes && comment.commonMistakes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Common Mistakes</p>
                <div className="space-y-2">
                  {comment.commonMistakes.map(function(m, i) {
                    return (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                        <span className="text-red-500 shrink-0">✗</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{m}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {comment.relatedProblems && comment.relatedProblems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Related Problems</p>
                <div className="flex flex-wrap gap-2">
                  {comment.relatedProblems.map(function(slug) {
                    return (
                      <span key={slug} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20
                        rounded-full text-xs text-blue-400 font-mono">
                        {slug}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <a href="https://github.com/chron303/CodeZ"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl border border-game-border
                bg-game-surface hover:border-purple-500/40 transition-colors group">
              <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              <span className="text-xs text-slate-600 group-hover:text-slate-300 transition-colors">
                Improve this solution on GitHub
              </span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}