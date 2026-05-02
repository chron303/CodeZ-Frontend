// frontend/src/components/Review/ReviewDashboard.jsx
// Shows all scheduled reviews with status on the Stats page

import { useState, useEffect } from 'react';
import { Brain, CheckCircle, Clock, Trash2, Loader, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAllReviews, removeReview, INTERVALS } from '../../utils/spacedRepetition.js';

const STAGE_LABELS = ['Day 1','Day 3','Day 7','Day 14','Day 30','Mastered'];

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function isDue(ts) {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d <= new Date();
}

export default function ReviewDashboard({ onPractice }) {
  const { user }                   = useAuth();
  const [reviews,   setReviews]    = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [removing,  setRemoving]   = useState('');
  const [filter,    setFilter]     = useState('all'); // all | due | upcoming | mastered

  async function load() {
    if (!user) return;
    setLoading(true);
    const all = await getAllReviews(user.uid);
    all.sort((a,b) => {
      const da = a.nextReviewAt?.toDate?.() || new Date(a.nextReviewAt || 0);
      const db = b.nextReviewAt?.toDate?.() || new Date(b.nextReviewAt || 0);
      return da - db;
    });
    setReviews(all);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function handleRemove(problemId) {
    setRemoving(problemId);
    await removeReview(user.uid, problemId);
    setReviews(r => r.filter(x => x.problemId !== problemId));
    setRemoving('');
  }

  const dueCount      = reviews.filter(r => !r.completed && isDue(r.nextReviewAt)).length;
  const masteredCount = reviews.filter(r => r.completed).length;

  const filtered = reviews.filter(r => {
    if (filter === 'due')      return !r.completed && isDue(r.nextReviewAt);
    if (filter === 'upcoming') return !r.completed && !isDue(r.nextReviewAt);
    if (filter === 'mastered') return r.completed;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader className="w-5 h-5 animate-spin text-purple-400"/>
    </div>
  );

  if (reviews.length === 0) return (
    <div className="game-card p-6 text-center space-y-3">
      <Brain className="w-10 h-10 text-slate-700 mx-auto"/>
      <p className="text-slate-500 text-sm font-medium">No reviews scheduled yet</p>
      <p className="text-slate-700 text-xs leading-relaxed max-w-xs mx-auto">
        After solving a problem, click <strong className="text-slate-500">"Review later"</strong> in
        the editor toolbar to add it to your spaced repetition schedule.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Due Today',  value: dueCount,           color:'text-orange-400 bg-orange-500/10 border-orange-500/20', filter:'due'      },
          { label:'Upcoming',   value: reviews.length - dueCount - masteredCount, color:'text-purple-400 bg-purple-500/10 border-purple-500/20', filter:'upcoming' },
          { label:'Mastered',   value: masteredCount,      color:'text-green-400 bg-green-500/10 border-green-500/20',   filter:'mastered'  },
        ].map(({ label, value, color, filter: f }) => (
          <button key={f} onClick={() => setFilter(filter===f?'all':f)}
            className={`game-card p-3 text-center transition-all hover:scale-[1.02]
              ${filter===f ? color.split(' ').slice(1).join(' ') + ' border' : ''}`}>
            <p className={`text-xl font-extrabold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[['all','All'],['due','Due'],['upcoming','Upcoming'],['mastered','Mastered']].map(([f,l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter===f
                ?'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                :'text-slate-500 hover:text-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <p className="text-slate-600 text-sm text-center py-6">No problems in this category.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(review => {
            const due       = !review.completed && isDue(review.nextReviewAt);
            const stage     = review.stage || 0;
            const stageLbl  = STAGE_LABELS[Math.min(stage, STAGE_LABELS.length-1)];

            return (
              <div key={review.problemId}
                className={`game-card p-3.5 flex items-center gap-3 transition-all
                  ${due ? 'border-orange-500/30' : review.completed ? 'border-green-500/20 opacity-70' : ''}`}>

                {/* Status icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  review.completed ? 'bg-green-500/20' : due ? 'bg-orange-500/20' : 'bg-purple-500/10'}`}>
                  {review.completed
                    ? <CheckCircle className="w-4 h-4 text-green-400"/>
                    : due
                    ? <Clock className="w-4 h-4 text-orange-400"/>
                    : <Brain className="w-4 h-4 text-purple-400"/>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{review.problemTitle}</p>
                    <span className={`text-xs shrink-0 ${
                      review.difficulty==='Easy'  ? 'text-green-400'
                      : review.difficulty==='Medium'? 'text-yellow-400' : 'text-red-400'
                    }`}>{review.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="flex gap-0.5">
                      {INTERVALS.map((_, i) => (
                        <div key={i} className={`h-1 w-3 rounded-full ${
                          i < stage ? 'bg-purple-500'
                          : i === stage && !review.completed ? 'bg-purple-400'
                          : review.completed ? 'bg-green-500'
                          : 'bg-game-border'}`}/>
                      ))}
                    </div>
                    <span className="text-xs text-slate-600">{stageLbl}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
                      <Calendar className="w-3 h-3"/>
                      {review.completed ? 'Mastered' : due ? 'Due today!' : formatDate(review.nextReviewAt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!review.completed && (
                    <button onClick={() => onPractice?.({
                        id: review.problemId, title: review.problemTitle,
                        topic: review.topic, difficulty: review.difficulty,
                        _fromReview: true })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        due
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                          : 'bg-game-surface text-slate-500 border border-game-border hover:text-slate-300'
                      }`}>
                      {due ? 'Review now' : 'Practice'}
                    </button>
                  )}
                  <button onClick={() => handleRemove(review.problemId)}
                    disabled={removing === review.problemId}
                    className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
                    {removing === review.problemId
                      ? <Loader className="w-3.5 h-3.5 animate-spin"/>
                      : <Trash2 className="w-3.5 h-3.5"/>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}