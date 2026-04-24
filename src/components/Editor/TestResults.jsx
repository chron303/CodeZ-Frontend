// frontend/src/components/Editor/TestResults.jsx
import { useState } from 'react';
import CodeReview from '../AI/CodeReview.jsx';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
         AlertTriangle, Terminal } from 'lucide-react';

const VERDICT_STYLE = {
  'Accepted':            { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  'Wrong Answer':        { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  'Runtime Error':       { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  'Compile Error':       { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  'Time Limit Exceeded': { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  'No Code':             { color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/30' },
};

function vs(v) { return VERDICT_STYLE[v] || VERDICT_STYLE['No Code']; }

function DetailRow({ label, value, color = 'text-slate-300' }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-600 w-16 shrink-0">{label}:</span>
      <span className={`${color} break-all whitespace-pre-wrap`}>{String(value ?? '')}</span>
    </div>
  );
}

function TestRow({ result, index }) {
  const [open, setOpen] = useState(!result.passed);
  const style = vs(result.status);

  return (
    <div className={`rounded-lg border ${result.passed ? 'border-game-border' : style.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors
          ${result.passed ? 'hover:bg-white/5' : `${style.bg} hover:opacity-90`}`}
      >
        {result.passed
          ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle     className="w-4 h-4 text-red-400 shrink-0" />
        }
        <span className="text-slate-300 text-xs">
          Test {index + 1}{result.label ? ` · ${result.label}` : ''}
        </span>
        <span className={`ml-auto text-xs font-medium ${style.color}`}>{result.status}</span>
        {result.timeMs != null && (
          <span className="flex items-center gap-1 text-slate-600 text-xs ml-2">
            <Clock className="w-3 h-3" />{result.timeMs}ms
          </span>
        )}
        {open
          ? <ChevronUp   className="w-3 h-3 text-slate-600 ml-1 shrink-0" />
          : <ChevronDown className="w-3 h-3 text-slate-600 ml-1 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-game-border bg-game-surface px-3 py-3 space-y-2 text-xs font-mono">
          <DetailRow label="Input"    value={result.input} />
          <DetailRow label="Expected" value={result.expected} color="text-green-400" />
          {!result.passed && result.actual !== null && (
            <DetailRow label="Got" value={result.actual} color="text-red-400" />
          )}
          {result.error && (
            <div className="mt-1 p-2 rounded bg-red-500/10 border border-red-500/20">
              <p className="text-red-300 text-xs leading-relaxed whitespace-pre-wrap">{result.error}</p>
            </div>
          )}
          {result.stdout && (
            <div className="mt-1 p-2 rounded bg-game-card border border-game-border">
              <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                <Terminal className="w-3 h-3" />
                <span style={{ fontFamily: 'inherit', fontSize: '10px' }}>stdout</span>
              </div>
              <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{result.stdout}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestResults({ judgeResult, isRunning, problem, code, language }) {
  if (isRunning) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 rounded-lg bg-game-surface animate-pulse" />
        ))}
        <p className="text-xs text-slate-600 text-center pt-1">Running tests…</p>
      </div>
    );
  }

  if (!judgeResult) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-700 gap-2">
        <AlertTriangle className="w-5 h-5" />
        <p className="text-xs">Run your code to see results</p>
      </div>
    );
  }

  const { results, passed, total, verdict, allPassed } = judgeResult;
  const style = vs(verdict);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${style.bg} ${style.border}`}>
        <span className={`font-medium pixel text-xs ${style.color}`}>{verdict}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">{passed}/{total} passed</span>
          <div className="flex gap-1">
            {results.map(r => (
              <div key={r.id}
                className={`w-2.5 h-2.5 rounded-sm ${r.passed ? 'bg-green-500' : 'bg-red-500'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Per-test rows */}
      <div className="space-y-1.5">
        {results.map((result, i) => (
          <TestRow key={result.id} result={result} index={i} />
        ))}
      </div>

      {/* AI Code Review — shown when all tests pass */}
      {judgeResult?.allPassed && problem && (
        <CodeReview
          problem={problem}
          code={code}
          language={language}
          passed={judgeResult.passed}
          total={judgeResult.total}
        />
      )}
    </div>
  );
}