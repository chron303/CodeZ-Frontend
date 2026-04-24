// frontend/src/components/Stats/LeetCodeSync.jsx
//
// Lets the user enter their LeetCode username to:
//   1. See their overall LC stats (easy/medium/hard counts)
//   2. Auto-mark matching problems in their local list as solved

import { useState, useCallback } from 'react';
import { Search, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { fetchLeetCode } from '../../utils/api.js';
import { useApp } from '../../context/AppContext.jsx';

const DIFF_COLOR = {
  Easy:   'text-green-400',
  Medium: 'text-yellow-400',
  Hard:   'text-red-400',
};

export default function LeetCodeSync() {
  const { topics, markSolved, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [status,   setStatus]   = useState('idle'); // idle | loading | done | error
  const [lcData,   setLcData]   = useState(null);
  const [matched,  setMatched]  = useState(0);
  const [error,    setError]    = useState('');

  const handleSync = useCallback(async () => {
    const user = username.trim();
    if (!user) return;

    setStatus('loading');
    setError('');
    setLcData(null);
    setMatched(0);

    try {
      const data = await fetchLeetCode(user);
      setLcData(data);

      // Auto-mark local problems as solved if their title matches an LC recent solve
      const recentTitles = new Set(
        data.recentSolved.map(s => s.title.toLowerCase().trim())
      );

      let matchCount = 0;
      for (const topic of topics) {
        for (const problem of topic.problems) {
          const normalised = problem.title.toLowerCase().trim();
          if (!problem.solved && recentTitles.has(normalised)) {
            markSolved(topic.topic, problem.id);
            matchCount++;
          }
        }
      }

      setMatched(matchCount);
      setStatus('done');

      if (matchCount > 0) {
        showToast(`✓ Synced! Marked ${matchCount} problems as solved.`);
      } else {
        showToast('Synced — no new matches found in your problem list.', 'info');
      }

    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [username, topics, markSolved, showToast]);

  return (
    <div className="game-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {/* LeetCode logo SVG (simple orange square) */}
        <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold" style={{ fontSize: '10px' }}>LC</span>
        </div>
        <p className="pixel text-xs text-orange-400">LeetCode Sync</p>
      </div>

      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        Enter your LeetCode username to fetch your stats and auto-mark recently solved problems.
      </p>

      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSync()}
          placeholder="LeetCode username"
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-game-surface border border-game-border
            text-white placeholder-slate-600 outline-none
            focus:border-orange-500/60 transition-colors"
        />
        <button
          onClick={handleSync}
          disabled={status === 'loading' || !username.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            bg-orange-600 hover:bg-orange-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading'
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <Search className="w-3.5 h-3.5" />
          }
          {status === 'loading' ? 'Fetching…' : 'Sync'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && lcData && (
        <div className="space-y-3 animate-slide-up">
          {/* Profile header */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-game-surface border border-game-border">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <span className="text-orange-400 font-bold text-sm">
                {lcData.username[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{lcData.username}</p>
              <a
                href={`https://leetcode.com/${lcData.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-orange-400 transition-colors"
              >
                leetcode.com/{lcData.username}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {matched > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                <Check className="w-3 h-3" />
                {matched} matched
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',  value: lcData.totalSolved,  color: 'text-white' },
              { label: 'Easy',   value: lcData.easySolved,   color: DIFF_COLOR.Easy },
              { label: 'Medium', value: lcData.mediumSolved, color: DIFF_COLOR.Medium },
              { label: 'Hard',   value: lcData.hardSolved,   color: DIFF_COLOR.Hard },
            ].map(s => (
              <div key={s.label} className="bg-game-surface rounded-lg p-2 text-center border border-game-border">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-600 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent solves preview */}
          {lcData.recentSolved.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-1.5">Recent solves on LeetCode</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lcData.recentSolved.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-game-surface transition-colors">
                    <span className="text-slate-400 flex-1 truncate">{s.title}</span>
                    <span className="text-slate-700 shrink-0">
                      {new Date(s.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}