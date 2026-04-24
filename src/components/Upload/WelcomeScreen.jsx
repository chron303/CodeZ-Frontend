// frontend/src/components/Upload/WelcomeScreen.jsx
//
// Shown once after the first successful upload.
// Highlights the 4 main features with icons + descriptions,
// then gives a "Let's go!" CTA that navigates to the World tab.

import { Gamepad2, Map, Code2, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Gamepad2,
    color: 'text-purple-400',
    bg:   'bg-purple-500/20',
    title: 'World Map',
    desc:  'Your problems as a side-scrolling adventure. Walk from node to node as you solve.',
  },
  {
    icon: Map,
    color: 'text-blue-400',
    bg:   'bg-blue-500/20',
    title: 'Topic City',
    desc:  '3D brick buildings — taller as you complete more problems in each topic.',
  },
  {
    icon: Code2,
    color: 'text-teal-400',
    bg:   'bg-teal-500/20',
    title: 'Practice',
    desc:  'Code in Python, C++, or Java. Real test cases. Instant feedback.',
  },
  {
    icon: BarChart3,
    color: 'text-yellow-400',
    bg:   'bg-yellow-500/20',
    title: 'Stats',
    desc:  'XP, streaks, achievements, heatmap, and LeetCode sync — all in one dashboard.',
  },
];

export default function WelcomeScreen({ stats, fileName, onStart }) {
  return (
    <div className="max-w-lg mx-auto py-4 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="pixel text-sm text-purple-400 mb-2">You're all set!</h1>
        <p className="text-slate-400 text-sm">
          Loaded <span className="text-white font-medium">{stats.totalProblems} problems</span>{' '}
          across <span className="text-purple-400 font-medium">{stats.totalTopics} topics</span>
          {stats.alreadySolved > 0 && (
            <> · <span className="text-green-400 font-medium">{stats.alreadySolved} already solved</span></>
          )}
        </p>
        {fileName && (
          <p className="text-slate-700 text-xs mt-1">{fileName}</p>
        )}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="game-card p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-sm font-semibold mb-1 ${color}`}>{title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="game-card p-4 mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2.5">Quick tips</p>
        <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
          {[
            '⌘↵ to run code in the editor · ⌘R to reset',
            'Click any building in Topic City to see its problems',
            'Use the topic dropdown in World Map to focus on one area',
            '⌘K opens Settings — export progress or reset anytime',
            'Progress saves automatically in your browser',
          ].map((tip, i) => (
            <p key={i} className="flex items-start gap-2">
              <span className="text-purple-600 shrink-0 mt-0.5">›</span>
              {tip}
            </p>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
          bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors
          pixel text-xs"
      >
        Start Adventure
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}