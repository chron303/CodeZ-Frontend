// frontend/src/components/NotFound/NotFoundPage.jsx

import { Gamepad } from 'lucide-react';

export default function NotFoundPage({ onGoHome }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: '#0f0e17' }}>

      {/* Pixel art sad character */}
      <div className="mb-6 relative">
        <div className="pixel text-6xl select-none" style={{ color: '#7c3aed', lineHeight: 1 }}>
          404
        </div>
        <div className="absolute -top-2 -right-6 text-2xl animate-bounce">😵</div>
      </div>

      <h1 className="pixel text-sm text-purple-400 mb-2">Level Not Found</h1>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-8">
        This route doesn't exist in the game world.
        The path <code className="text-purple-400 bg-purple-500/10 px-1 rounded">
          {window.location.pathname}
        </code> has no map.
      </p>

      <button
        onClick={onGoHome}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
          bg-purple-600 hover:bg-purple-500 text-white transition-colors">
        <Gamepad className="w-4 h-4" />
        Back to World Map
      </button>
    </div>
  );
}