// frontend/src/components/Review/ReviewScheduler.jsx
// Button shown in the editor after solving — lets user schedule review
// Also shows current review status if already scheduled

import { useState, useEffect } from 'react';
import { Brain, Check, Clock, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  scheduleReview, completeReview, removeReview,
  getAllReviews, INTERVALS,
} from '../../utils/spacedRepetition.js';

const QUICK_OPTIONS = [
  { label: 'Tomorrow',   days: 1  },
  { label: 'In 3 days',  days: 3  },
  { label: 'In a week',  days: 7  },
  { label: 'In 2 weeks', days: 14 },
];

const STAGE_LABELS = ['Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30', 'Mastered!'];

export default function ReviewScheduler({ problem }) {
  const { user } = useAuth();
  const [review,   setReview]   = useState(null); // existing schedule
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (!user || !problem) return;
    getAllReviews(user.uid).then(all => {
      const existing = all.find(r => r.problemId === problem.id);
      setReview(existing || null);
    });
  }, [user, problem?.id]);

  async function schedule(days) {
    if (!user || !problem) return;
    setLoading(true);
    await scheduleReview(user.uid, problem, days);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    setReview({ problemId: problem.id, stage: 0, nextReviewAt: nextDate, solvedCount: 0 });
    setSaved(true);
    setOpen(false);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
  }

  async function markDone(remembered) {
    if (!user || !review) return;
    setLoading(true);
    const result = await completeReview(user.uid, problem.id, remembered);
    setReview(r => ({ ...r, stage: result.stage, nextReviewAt: result.nextDate }));
    setOpen(false);
    setLoading(false);
  }

  async function remove() {
    if (!user || !review) return;
    setLoading(true);
    await removeReview(user.uid, problem.id);
    setReview(null);
    setOpen(false);
    setLoading(false);
  }

  function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function isDueToday() {
    if (!review?.nextReviewAt) return false;
    const d = review.nextReviewAt.toDate ? review.nextReviewAt.toDate() : new Date(review.nextReviewAt);
    return d <= new Date();
  }

  if (!problem) return null;

  // Not scheduled yet
  if (!review) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
            font-medium transition-colors border
            ${saved
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-game-surface border-game-border text-slate-500 hover:text-purple-400 hover:border-purple-500/40'
            }`}>
          {saved ? <Check className="w-3.5 h-3.5"/> : <Brain className="w-3.5 h-3.5"/>}
          {saved ? 'Scheduled!' : 'Review later'}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-30 game-card p-2 w-44 space-y-1">
            <p className="text-xs text-slate-600 px-2 py-1">Schedule review:</p>
            {QUICK_OPTIONS.map(({ label, days }) => (
              <button key={days} onClick={() => schedule(days)} disabled={loading}
                className="w-full text-left px-3 py-2 text-xs text-slate-400
                  hover:text-white hover:bg-game-surface rounded-lg transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Already scheduled
  const stage    = review.stage || 0;
  const due      = isDueToday();
  const nextDate = formatDate(review.nextReviewAt);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
          font-medium transition-colors border
          ${due
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
            : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
          }`}>
        <Brain className="w-3.5 h-3.5"/>
        {due ? 'Review due!' : 'Review: ' + nextDate}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 game-card p-3 w-52 space-y-3">
          {/* Stage progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-500">Progress</p>
              <p className="text-xs text-purple-400 font-medium">
                {STAGE_LABELS[Math.min(stage, STAGE_LABELS.length-1)]}
              </p>
            </div>
            <div className="flex gap-1">
              {INTERVALS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < stage ? 'bg-purple-500'
                  : i === stage ? 'bg-purple-400 animate-pulse'
                  : 'bg-game-border'}`}/>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {due ? 'Due for review today!' : 'Next review: ' + nextDate}
            </p>
          </div>

          {/* Actions */}
          {due && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium">Did you remember it?</p>
              <button onClick={() => markDone(true)} disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                  bg-green-500/15 border border-green-500/30 text-green-400
                  hover:bg-green-500/25 transition-colors">
                <Check className="w-3.5 h-3.5"/> Yes, I got it!
              </button>
              <button onClick={() => markDone(false)} disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                  bg-red-500/10 border border-red-500/20 text-red-400
                  hover:bg-red-500/20 transition-colors">
                <X className="w-3.5 h-3.5"/> Needed help — restart
              </button>
            </div>
          )}

          <button onClick={remove} disabled={loading}
            className="w-full text-xs text-slate-700 hover:text-slate-500 transition-colors
              pt-1 border-t border-game-border text-center">
            Remove from review list
          </button>
        </div>
      )}
    </div>
  );
}