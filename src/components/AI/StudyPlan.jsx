// frontend/src/components/AI/StudyPlan.jsx
import { API_URL } from '../../utils/config.js';
import { useState, useEffect } from 'react';
import { BookOpen, Loader, RefreshCw, Target, Calendar, Star } from 'lucide-react';
import AIGate from './AIGate.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';
import { useApp }     from '../../context/AppContext.jsx';
import { useAuth }    from '../../context/AuthContext.jsx';

const DAY_COLORS = [
  'border-purple-500/30 bg-purple-500/5',
  'border-blue-500/30 bg-blue-500/5',
  'border-teal-500/30 bg-teal-500/5',
];

export default function StudyPlan() {
  const { summary, progression } = useApp();
  const { premium }  = usePremium();
  const { user }     = useAuth();
  const [plan,    setPlan]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (summary?.totalProblems > 0 && premium && user) fetchPlan();
  }, [premium, user]);

  async function fetchPlan() {
    if (loading || !user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch((API_URL || '') + '/api/ai/studyplan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid:         user.uid,
          topics:      summary?.topics      || [],
          totalSolved: summary?.totalSolved || 0,
          streak:      progression?.streak  || 0,
          weakTopics:  summary?.weakTopics  || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPlan(data);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="game-card p-6 flex items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-purple-400 shrink-0"/>
        <div>
          <p className="text-sm font-medium text-white">AI is building your study plan…</p>
          <p className="text-xs text-slate-600 mt-0.5">Analyzing your progress with Gemini</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-card p-4 flex items-center justify-between">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchPlan}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <AIGate>
      <div className="game-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-game-border"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.05))' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30
              flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-400"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your Study Plan</p>
              <p className="text-xs text-slate-600">Personalized by Gemini AI</p>
            </div>
          </div>
          <button onClick={fetchPlan} disabled={loading} title="Refresh plan"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300
              hover:bg-game-surface transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {plan.greeting && (
            <p className="text-sm text-slate-300 leading-relaxed">{plan.greeting}</p>
          )}

          {plan.focus && (
            <div className="flex items-center gap-2 p-3 rounded-xl
              bg-yellow-500/10 border border-yellow-500/20">
              <Target className="w-4 h-4 text-yellow-400 shrink-0"/>
              <div>
                <p className="text-xs text-yellow-600 mb-0.5">This week's focus</p>
                <p className="text-sm font-semibold text-yellow-300">{plan.focus}</p>
              </div>
            </div>
          )}

          {plan.plan?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5"/>
                3-Day Plan
              </p>
              {plan.plan.map((day, i) => (
                <div key={i} className={`rounded-xl border p-3.5 ${DAY_COLORS[i % DAY_COLORS.length]}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-16 shrink-0">{day.day}</span>
                      <span className="text-sm font-semibold text-white">{day.topic}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 ml-[4.5rem] leading-relaxed">{day.goal}</p>
                  {day.why && (
                    <p className="text-xs text-slate-600 ml-[4.5rem] mt-0.5 italic">{day.why}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {plan.encouragement && (
            <div className="flex items-start gap-2 pt-1">
              <Star className="w-4 h-4 text-purple-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-slate-400 leading-relaxed italic">{plan.encouragement}</p>
            </div>
          )}
        </div>
      </div>
    </AIGate>
  );
}