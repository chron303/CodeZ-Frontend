// frontend/src/components/AI/AIOnboarding.jsx
// Beautiful slideshow shown when user first enables AI features.
// 4 slides explaining what they get. "Don't show again" persists to localStorage.

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb, Star, BookOpen, Zap } from 'lucide-react';

const SLIDES = [
  {
    icon: Zap,
    color: 'text-purple-400',
    glow:  'rgba(124,58,237,0.3)',
    bg:    'from-purple-900/40 to-purple-900/10',
    title: 'AI is now ON',
    subtitle: 'Powered by Google Gemini — free tier',
    body: 'Three intelligent features are now active in your workspace. Each one is designed to help you learn DSA faster without just giving you the answer.',
    badge: 'Gemini 2.5 Flash',
  },
  {
    icon: Lightbulb,
    color: 'text-yellow-400',
    glow:  'rgba(234,179,8,0.3)',
    bg:    'from-yellow-900/40 to-yellow-900/10',
    title: 'AI Hints',
    subtitle: 'Stuck? Get a nudge, not the answer.',
    body: 'The Hint button appears in your editor toolbar. Click it and Gemini analyzes your problem and current code — then gives you a 2-3 sentence push in the right direction. Click "Another hint" for a different angle.',
    badge: 'In Editor toolbar',
  },
  {
    icon: Star,
    color: 'text-green-400',
    glow:  'rgba(16,185,129,0.3)',
    bg:    'from-green-900/40 to-green-900/10',
    title: 'AI Code Review',
    subtitle: 'Pass all tests? Learn from them.',
    body: 'When all your test cases pass, a Code Review panel appears below the results. Gemini reviews your time complexity, space complexity, code strengths, and what you could improve next time.',
    badge: 'After all tests pass',
  },
  {
    icon: BookOpen,
    color: 'text-blue-400',
    glow:  'rgba(59,130,246,0.3)',
    bg:    'from-blue-900/40 to-blue-900/10',
    title: 'Study Plan',
    subtitle: 'Your personalized 3-day roadmap.',
    body: 'Head to the Stats tab — Gemini looks at your weakest topics, streak, and solved count, then builds a focused 3-day study plan just for you. Refresh anytime for a fresh recommendation.',
    badge: 'On Stats page',
  },
];

export default function AIOnboarding({ onClose }) {
  const [slide,      setSlide]      = useState(0);
  const [dontShow,   setDontShow]   = useState(false);
  const [animating,  setAnimating]  = useState(false);
  const [direction,  setDirection]  = useState(1); // 1=forward, -1=back

  const current = SLIDES[slide];
  const Icon    = current.icon;
  const isLast  = slide === SLIDES.length - 1;

  function goTo(next, dir) {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 220);
  }

  function next() {
    if (isLast) { handleClose(); return; }
    goTo(slide + 1, 1);
  }

  function prev() {
    if (slide === 0) return;
    goTo(slide - 1, -1);
  }

  function handleClose() {
    if (dontShow) localStorage.setItem('dsa-ai-onboarding-seen', 'true');
    onClose();
  }

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slide, animating, dontShow]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}>

      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 0 80px ${current.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
          background: '#0f0e17',
          transition: 'box-shadow 0.5s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient top band */}
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${current.bg.replace('from-','').replace('to-','').split(' ').join(' to-')}`}
          style={{ background: `linear-gradient(90deg, ${current.glow}, transparent)` }} />

        {/* Close button */}
        <button onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-600
            hover:text-slate-300 hover:bg-white/5 transition-colors">
          <X className="w-4 h-4"/>
        </button>

        {/* Slide content */}
        <div
          className="p-8 pt-10"
          style={{
            opacity:   animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction * 30}px)`
              : 'translateX(0)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* Icon with glow */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: current.glow, transform: 'scale(1.5)' }}/>
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${current.glow}40, ${current.glow}10)`,
                  border: `1px solid ${current.glow}60`,
                }}>
                <Icon className={`w-7 h-7 ${current.color}`}/>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${current.glow}20`,
                border: `1px solid ${current.glow}40`,
                color: current.glow.replace('rgba(', 'rgb(').replace(',0.3)', ')'),
              }}>
              {current.badge}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center mb-1">
            {current.title}
          </h2>
          <p className={`text-sm text-center mb-4 ${current.color}`}>
            {current.subtitle}
          </p>

          {/* Body */}
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-8">
            {current.body}
          </p>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > slide ? 1 : -1)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width:      i === slide ? 24 : 8,
                  height:     8,
                  background: i === slide ? current.glow.replace('0.3','0.8') : 'rgba(255,255,255,0.15)',
                }}/>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={slide === 0}
              className="flex items-center justify-center w-10 h-10 rounded-xl
                border border-game-border text-slate-500 hover:text-slate-300
                disabled:opacity-20 transition-colors">
              <ChevronLeft className="w-4 h-4"/>
            </button>

            <button onClick={next}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${current.glow.replace('0.3','0.8')}, ${current.glow.replace('0.3','0.5')})`,
                color: 'white',
                boxShadow: `0 4px 20px ${current.glow}`,
              }}>
              {isLast ? 'Get started →' : 'Next →'}
            </button>

            <button onClick={() => goTo(Math.min(slide + 1, SLIDES.length - 1), 1)}
              disabled={isLast}
              className="flex items-center justify-center w-10 h-10 rounded-xl
                border border-game-border text-slate-500 hover:text-slate-300
                disabled:opacity-20 transition-colors">
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>

          {/* Don't show again */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <input type="checkbox" id="dontshow" checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              className="accent-purple-500 cursor-pointer"/>
            <label htmlFor="dontshow" className="text-xs text-slate-600 cursor-pointer
              hover:text-slate-400 transition-colors">
              Don't show this again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}