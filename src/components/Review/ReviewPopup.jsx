// frontend/src/components/Review/ReviewPopup.jsx
import { useState, useEffect } from 'react';
import { X, Brain, Zap, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDueReviews, snoozeReview, INTERVALS } from '../../utils/spacedRepetition.js';

const MESSAGES = [
  { emoji: '🧠', title: 'Your brain is ready!',     sub: 'Spaced repetition works best when you review on schedule.' },
  { emoji: '⚡', title: 'Time to level up!',         sub: 'Quick reviews today = problems you never forget.' },
  { emoji: '🔥', title: 'Keep the streak alive!',    sub: 'Just a few minutes of review makes the difference.' },
  { emoji: '🎯', title: 'Review day!',               sub: 'Your future self will thank you for doing this now.' },
  { emoji: '💡', title: 'Memory checkpoint!',        sub: 'These problems are fading — review them before they do.' },
];

function DiffBadge({ diff }) {
  const cls = diff==='Easy'  ? 'text-green-400 bg-green-500/15 border-green-500/30'
            : diff==='Medium'? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
            :                  'text-red-400 bg-red-500/15 border-red-500/30';
  return <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>{diff}</span>;
}

function StageBar({ stage }) {
  return (
    <div className="flex items-center gap-0.5">
      {INTERVALS.map((_, i) => (
        <div key={i} className={`h-1 w-4 rounded-full transition-all ${
          i < stage ? 'bg-purple-500' : i === stage ? 'bg-purple-400' : 'bg-game-border'}`}/>
      ))}
    </div>
  );
}

export default function ReviewPopup({ onPractice, onDismissAll }) {
  const { user } = useAuth();
  const [reviews,  setReviews]  = useState([]);
  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [msgIdx]                = useState(() => Math.floor(Math.random() * MESSAGES.length));

  useEffect(() => {
    if (!user) return;
    const key = 'dsa-review-dismissed-' + new Date().toDateString();
    if (localStorage.getItem(key) === 'true') return;

    getDueReviews(user.uid).then(due => {
      if (due.length > 0) {
        setReviews(due);
        setTimeout(() => setVisible(true), 1500);
      }
    });
  }, [user]);

  async function handleSnooze() {
    await Promise.all(reviews.map(r => snoozeReview(user.uid, r.problemId)));
    localStorage.setItem('dsa-review-dismissed-' + new Date().toDateString(), 'true');
    setVisible(false);
    onDismissAll?.();
  }

  function handlePractice(review) {
    onPractice?.({ id: review.problemId, title: review.problemTitle,
      topic: review.topic, difficulty: review.difficulty, _fromReview: true });
    setVisible(false);
  }

  if (!visible || reviews.length === 0) return null;

  const msg      = MESSAGES[msgIdx];
  const shown    = expanded ? reviews : reviews.slice(0, 3);
  const extra    = reviews.length - 3;

  return (
    <>
      <div className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.25)' }}/>

      <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                 filter: 'drop-shadow(0 20px 60px rgba(124,58,237,0.4))' }}>
        <div className="game-card overflow-hidden"
          style={{ border: '1px solid rgba(124,58,237,0.45)' }}>

          {/* Animated gradient top bar */}
          <div className="h-1" style={{
            background: 'linear-gradient(90deg,#7c3aed,#06b6d4,#7c3aed)',
            backgroundSize: '200%',
            animation: 'gradientShift 3s ease infinite',
          }}/>

          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl" style={{ animation: 'bounce 2s ease infinite' }}>
                {msg.emoji}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{msg.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{msg.sub}</p>
              </div>
            </div>
            <button onClick={handleSnooze}
              className="text-slate-700 hover:text-slate-400 transition-colors shrink-0 mt-0.5">
              <X className="w-4 h-4"/>
            </button>
          </div>

          {/* Stats strip */}
          <div className="mx-4 mb-3 flex items-center gap-3 px-3 py-2 rounded-xl
            bg-purple-500/10 border border-purple-500/20">
            <Brain className="w-4 h-4 text-purple-400 shrink-0"/>
            <p className="text-sm text-purple-300 font-medium flex-1">
              {reviews.length} problem{reviews.length !== 1 ? 's' : ''} due for review
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3"/>
              <span>~{reviews.length * 3} min</span>
            </div>
          </div>

          {/* Problem list */}
          <div className="px-4 space-y-1.5 pb-2">
            {shown.map(review => (
              <div key={review.problemId}
                onClick={() => handlePractice(review)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  bg-game-surface border border-game-border hover:border-purple-500/40
                  transition-all group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate
                    group-hover:text-purple-300 transition-colors">
                    {review.problemTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <DiffBadge diff={review.difficulty}/>
                    <span className="text-xs text-slate-600">{review.topic}</span>
                    <StageBar stage={review.stage || 0}/>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400
                  transition-colors shrink-0"/>
              </div>
            ))}
            {!expanded && extra > 0 && (
              <button onClick={() => setExpanded(true)}
                className="w-full text-xs text-slate-600 hover:text-purple-400 py-1.5
                  transition-colors text-center">
                +{extra} more problems
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 pt-2 flex gap-2 border-t border-game-border mt-1">
            <button onClick={handleSnooze}
              className="flex-1 py-2 rounded-xl text-xs text-slate-500
                hover:text-slate-300 bg-game-surface border border-game-border
                transition-colors flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5"/> Come back later
            </button>
            <button onClick={() => handlePractice(reviews[0])}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white
                flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
              <Zap className="w-3.5 h-3.5"/> Start reviewing
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </>
  );
}