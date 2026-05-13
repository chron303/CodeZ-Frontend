// frontend/src/components/AI/HintButton.jsx
import { useState } from 'react';
import AIGate from './AIGate.jsx';
import { authFetch } from '../../utils/api.js';
import { Lightbulb, X, Loader } from 'lucide-react';

function HintButtonInner({ problem, code, language }) {
  const [open,    setOpen]    = useState(false);
  const [hint,    setHint]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [used,    setUsed]    = useState(0);

  async function fetchHint() {
    if (!problem) return;
    setLoading(true); setError('');
    try {
      // uid removed — backend extracts it from the Authorization token
      var data = await authFetch('/ai/hint', {
        method: 'POST',
        body: JSON.stringify({ problem, code, language }),
      });
      setHint(data.hint);
      setUsed(function(u) { return u + 1; });
      setOpen(true);
    } catch(e) {
      setError(e.message);
      setOpen(true);
    } finally { setLoading(false); }
  }

  if (!problem) return null;

  return (
    <div className="relative">
      <button
        onClick={function() { open ? setOpen(false) : fetchHint(); }}
        disabled={loading}
        title="Get an AI hint"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
          font-medium transition-colors disabled:opacity-50
          ${open
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : 'bg-game-surface border border-game-border text-slate-500 hover:text-yellow-400 hover:border-yellow-500/40'
          }`}>
        {loading ? <Loader className="w-3.5 h-3.5 animate-spin"/> : <Lightbulb className="w-3.5 h-3.5"/>}
        {loading ? 'Thinking…' : 'Hint'}
        {used > 0 && !loading && (
          <span className="bg-yellow-500/20 text-yellow-400 rounded-full px-1.5 text-xs">{used}</span>
        )}
      </button>

      {open && (hint || error) && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72
          bg-game-card border border-yellow-500/30 rounded-xl shadow-xl overflow-hidden"
          style={{ boxShadow: '0 0 20px rgba(234,179,8,0.1)' }}>
          <div className="flex items-center justify-between px-3 py-2
            bg-yellow-500/10 border-b border-yellow-500/20">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400"/>
              <span className="text-xs font-medium text-yellow-300">AI Hint</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchHint} disabled={loading}
                className="text-xs text-yellow-600 hover:text-yellow-400 transition-colors">
                Another hint
              </button>
              <button onClick={function() { setOpen(false); }}
                className="text-slate-600 hover:text-slate-300 transition-colors">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
          <div className="p-3">
            {error
              ? <p className="text-red-400 text-xs">{error}</p>
              : <p className="text-sm text-slate-300 leading-relaxed">{hint}</p>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function HintButton(props) {
  return (
    <AIGate compact onUpgrade={function() { window.dispatchEvent(new CustomEvent('open-premium')); }}>
      <HintButtonInner {...props} />
    </AIGate>
  );
}