// frontend/src/components/Settings/SettingsPanel.jsx
//
// Slide-in settings drawer. Covers:
//   - Reset all progress (with confirmation)
//   - Export progress as CSV
//   - Keyboard shortcuts reference
//   - Language / compiler requirements

import { useState } from 'react';
import { X, Download, Trash2, Keyboard, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="pixel text-xs text-slate-500 mb-3 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-game-border last:border-0">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

const SHORTCUTS = [
  { keys: '⌘ ↵',  action: 'Run code' },
  { keys: '⌘ R',  action: 'Reset editor' },
  { keys: '⌘ K',  action: 'Open settings' },
];

const LANG_REQ = [
  { lang: 'Python 3', req: 'python3 in PATH',  note: 'Usually pre-installed' },
  { lang: 'C++ 17',   req: 'g++ in PATH',      note: 'Windows: install MinGW-w64' },
  { lang: 'Java',     req: 'javac + java',      note: 'Install JDK from adoptium.net' },
];

export default function SettingsPanel({ onClose }) {
  const { topics, summary, resetProgress, exportProgress, showToast } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetProgress();
    setConfirmReset(false);
    showToast('Progress reset.', 'info');
    onClose();
  }

  function handleExport() {
    if (topics.length === 0) {
      showToast('No data to export yet.', 'error');
      return;
    }
    exportProgress();
    showToast('Exported dsa-quest-progress.csv');
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      {/* Drawer */}
      <div
        className="relative h-full w-80 bg-game-card border-l border-game-border overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-game-border sticky top-0 bg-game-card z-10">
          <p className="pixel text-xs text-purple-400">Settings</p>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">

          {/* Progress summary */}
          <Section title="Progress">
            <div className="game-card p-3 mb-3 flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{summary.totalSolved}</p>
                <p className="text-xs text-slate-600">Solved</p>
              </div>
              <div className="flex-1 h-2 bg-game-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${summary.overallPct}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-400">{summary.totalProblems}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>

            <Row label="Export progress" sub="Downloads a CSV of all problems + solved status + notes">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  bg-game-surface border border-game-border text-slate-300
                  hover:border-purple-500 hover:text-purple-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </Row>

            <Row
              label="Reset all progress"
              sub={confirmReset ? 'Click again to confirm — this cannot be undone' : 'Clears solved status, notes, and XP'}
            >
              <button
                onClick={handleReset}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors
                  ${confirmReset
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500'
                    : 'bg-game-surface border border-game-border text-slate-400 hover:border-red-500 hover:text-red-400'
                  }`}
              >
                {confirmReset
                  ? <><AlertTriangle className="w-3.5 h-3.5" /> Confirm</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Reset</>
                }
              </button>
            </Row>
          </Section>

          {/* Keyboard shortcuts */}
          <Section title="Keyboard Shortcuts">
            <div className="game-card overflow-hidden">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-game-border last:border-0">
                  <span className="text-sm text-slate-400">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-game-surface border border-game-border text-xs font-mono text-slate-300">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </Section>

          {/* Language requirements */}
          <Section title="Language Requirements">
            <div className="game-card overflow-hidden">
              {LANG_REQ.map((l, i) => (
                <div key={i} className="px-3 py-2.5 border-b border-game-border last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{l.lang}</span>
                    <code className="text-xs text-purple-400 font-mono">{l.req}</code>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{l.note}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* About */}
          <Section title="About">
            <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p>DSA Quest — a gamified practice tracker.</p>
              <p>Upload any CSV with a title column to get started.</p>
              <p className="text-slate-700">Progress is saved automatically in your browser.</p>
            </div>
          </Section>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}