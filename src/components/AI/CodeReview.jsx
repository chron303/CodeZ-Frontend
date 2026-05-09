// frontend/src/components/AI/CodeReview.jsx
import { API_URL } from '../../utils/config.js';
import { useState } from 'react';
import AIGate from './AIGate.jsx';
import { useAI }      from './AIToggle.jsx';
import { useAuth }    from '../../context/AuthContext.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';
import { Star, Loader, ChevronDown, ChevronUp, TrendingUp, AlertCircle, Check } from 'lucide-react';

export default function CodeReview({ problem, code, language, passed, total }) {
  const aiEnabled   = useAI();
  const { premium } = usePremium();
  const { user }    = useAuth();

  const [review,  setReview]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [error,   setError]   = useState('');

  if (!aiEnabled || !premium) return null;

  async function fetchReview() {
    if (loading || !code || !problem || !user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch((API_URL || '') + '/api/ai/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, problem, code, language, passed, total }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setReview(data);
      setOpen(true);
    } catch(e) {
      setError(e.message);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-game-border">
      <button
        onClick={() => open ? setOpen(false) : review ? setOpen(true) : fetchReview()}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-2.5
          hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {loading
            ? <Loader className="w-4 h-4 animate-spin text-purple-400"/>
            : <Star className="w-4 h-4 text-purple-400"/>
          }
          <span className="text-xs font-medium text-slate-300">
            {loading ? 'AI is reviewing your code…'
              : review ? 'AI Code Review'
              : 'Get AI Code Review'}
          </span>
          {review && !loading && (
            <span className="text-xs text-slate-600">Gemini</span>
          )}
        </div>
        {review && !loading && (
          open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600"/>
               : <ChevronDown className="w-3.5 h-3.5 text-slate-600"/>
        )}
      </button>

      {open && (review || error) && (
        <div className="px-4 pb-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0"/>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {review && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 bg-game-surface border border-game-border rounded-xl p-3">
                  <p className="text-xs text-slate-600 mb-1">Time</p>
                  <p className="text-sm font-mono font-bold text-green-400">{review.timeComplexity}</p>
                </div>
                <div className="flex-1 bg-game-surface border border-game-border rounded-xl p-3">
                  <p className="text-xs text-slate-600 mb-1">Space</p>
                  <p className="text-sm font-mono font-bold text-blue-400">{review.spaceComplexity}</p>
                </div>
              </div>

              {review.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-1.5 uppercase tracking-wide">Strengths</p>
                  <div className="space-y-1">
                    {review.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5"/>
                        <p className="text-xs text-slate-400 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-400 mb-1.5 uppercase tracking-wide">Can improve</p>
                  <div className="space-y-1">
                    {review.improvements.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5"/>
                        <p className="text-xs text-slate-400 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.tip && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300 leading-relaxed">💡 {review.tip}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}