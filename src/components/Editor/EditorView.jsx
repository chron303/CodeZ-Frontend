// frontend/src/components/Editor/EditorView.jsx
//
// Practice screen — Monaco editor with:
//   - Language switcher (Python / C++ / Java)
//   - Problem browser sidebar (left toggle)
//   - Problem panel (tabs: Problem / Tests / Notes)
//   - Test results + pixel character bottom strip
//   - Responsive: desktop side-by-side, mobile tabbed
//
// Settings shortcuts: ⌘↵ = Run, ⌘R = Reset, ⌘B = toggle browser

import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle, BookOpen, Code2, ClipboardList,
         ChevronDown, List } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { runCode } from '../../utils/api.js';
import { LANGUAGES, getLanguage, getStarterCode } from '../../utils/languages.js';
import { loadLang, saveLang } from '../../utils/storage.js';
import ProblemPanel   from './ProblemPanel.jsx';
import TestResults    from './TestResults.jsx';
import PixelCharacter from './PixelCharacter.jsx';
import ProblemBrowser from './ProblemBrowser.jsx';
import HintButton    from '../AI/HintButton.jsx';
import PremiumGate   from '../Premium/PremiumGate.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';

// ── Language picker ────────────────────────────────────────────
function LangPicker({ langId, onChange }) {
  const [open, setOpen] = useState(false);
  const lang = getLanguage(langId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${lang.badge}`}
      >
        {lang.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 game-card overflow-hidden" style={{ minWidth: 130 }}>
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => { onChange(l.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-game-surface flex items-center justify-between
                ${l.id === langId ? 'text-white' : 'text-slate-400'}`}>
              {l.label}
              {l.id === langId && <span className="text-purple-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────────────
function Toolbar({ activeProblem, isRunning, langId, onLangChange, onRun, onReset, showBrowser, onToggleBrowser, code }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-game-border bg-game-card shrink-0">
      {/* Browser toggle */}
      <button
        onClick={onToggleBrowser}
        title="Toggle problem list (⌘B)"
        className={`p-1.5 rounded transition-colors ${showBrowser ? 'text-purple-400 bg-purple-500/20' : 'text-slate-600 hover:text-slate-300 hover:bg-game-surface'}`}
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-game-border" />

      <LangPicker langId={langId} onChange={onLangChange} />
      <HintButton problem={activeProblem} code={code} language={langId} />

      {activeProblem?.solved && (
        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
          <CheckCircle className="w-3 h-3" /> Solved
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-700 hidden lg:block">⌘↵ run · ⌘R reset · ⌘B browser</span>
        <button onClick={onReset} disabled={!activeProblem} title="Reset (⌘R)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-game-surface disabled:opacity-30 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRun} disabled={!activeProblem || isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Play className="w-3 h-3" />
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>
    </div>
  );
}


// ── Results strip ──────────────────────────────────────────────
function ResultsStrip({ charState, passingTests, judgeResult, isRunning, problem, code, language }) {
  return (
    <div className="border-t border-game-border bg-game-card flex shrink-0" style={{ height: 200 }}>
      <div className="w-32 border-r border-game-border flex items-center justify-center bg-game-surface shrink-0">
        <PixelCharacter state={charState} passingTests={passingTests} />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <TestResults judgeResult={judgeResult} isRunning={isRunning} problem={problem} code={code} language={language} />
      </div>
    </div>
  );
}

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  tabSize: 4,
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  contextmenu: false,
  overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

// ── Main ───────────────────────────────────────────────────────
export default function EditorView() {
  const { activeProblem, markSolved, showToast } = useApp();
  const { premium } = usePremium();

  const [langId,       setLangId]       = useState(() => loadLang());
  const [code,         setCode]         = useState(() => getStarterCode(loadLang(), null));
  const [judgeResult,  setJudgeResult]  = useState(null);
  const [isRunning,    setIsRunning]    = useState(false);
  const [charState,    setCharState]    = useState('idle');
  const [passingTests, setPassingTests] = useState(0);
  const [mobileTab,    setMobileTab]    = useState('editor');
  const [showBrowser,  setShowBrowser]  = useState(false);

  const prevIdRef = useRef(null);

  // Reset editor when new problem opens
  useEffect(() => {
    if (activeProblem && activeProblem.id !== prevIdRef.current) {
      prevIdRef.current = activeProblem.id;
      setCode(getStarterCode(langId, activeProblem));
      setJudgeResult(null);
      setCharState('idle');
      setPassingTests(0);
    }
  }, [activeProblem, langId]);

  const handleLangChange = useCallback((newLang) => {
    setLangId(newLang);
    saveLang(newLang);
    setCode(getStarterCode(newLang, activeProblem || null));
    setJudgeResult(null);
    setCharState('idle');
    setPassingTests(0);
  }, [activeProblem]);

  const handleRun = useCallback(async () => {
    if (!activeProblem || isRunning) return;
    setIsRunning(true);
    setJudgeResult(null);
    setCharState('running');
    setPassingTests(0);

    try {
      const result = await runCode(langId, code, activeProblem.testCases);
      setJudgeResult(result);
      setPassingTests(result.passed);

      if (result.allPassed) {
        setCharState('victory');
        markSolved(activeProblem.topic, activeProblem.id, true);
        showToast('✓ ' + activeProblem.title + ' solved!');
        setMobileTab('results');
      } else if (result.passed > 0) {
        setCharState('jumping');
        setTimeout(() => setCharState('idle'), result.passed * 500 + 400);
        setMobileTab('results');
      } else {
        setCharState('sad');
        setTimeout(() => setCharState('idle'), 2000);
        setMobileTab('results');
      }
    } catch (err) {
      showToast(err.message, 'error');
      setCharState('sad');
      setTimeout(() => setCharState('idle'), 2000);
    } finally {
      setIsRunning(false);
    }
  }, [activeProblem, code, langId, isRunning, markSolved, showToast]);

  const handleReset = useCallback(() => {
    setCode(getStarterCode(langId, activeProblem || null));
    setJudgeResult(null);
    setCharState('idle');
    setPassingTests(0);
  }, [activeProblem, langId]);

  // Settings shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'Enter') { e.preventDefault(); handleRun(); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); handleReset(); }
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setShowBrowser(s => !s); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleReset]);

  const monacoLang    = getLanguage(langId).monaco;
  const toolbarProps  = { activeProblem, isRunning, langId, onLangChange: handleLangChange,
                          onRun: handleRun, onReset: handleReset,
                          showBrowser, onToggleBrowser: () => setShowBrowser(s => !s), code };
  const resultsProps  = { charState, passingTests, judgeResult, isRunning, problem: activeProblem, code, language: langId };
  const editorEl      = (
    <Editor
      key={langId}
      height="100%"
      language={monacoLang}
      theme="vs-dark"
      value={code}
      onChange={v => setCode(v ?? '')}
      options={MONACO_OPTIONS}
    />
  );

  // ── Desktop layout ─────────────────────────────────────────
  const Desktop = (
    <div className="flex h-full overflow-hidden rounded-xl border border-game-border">
      {/* Problem browser */}
      {showBrowser && (
        <ProblemBrowser onClose={() => setShowBrowser(false)} />
      )}

      {/* Problem panel */}
      <div className="w-[32%] min-w-[240px] max-w-[310px] border-r border-game-border bg-game-card flex flex-col">
        <ProblemPanel />
      </div>

      {/* Editor + results */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#0f0e17' }}>
        <Toolbar {...toolbarProps} />
        <div className="flex-1 min-h-0">{editorEl}</div>
        <ResultsStrip {...resultsProps} />
      </div>
    </div>
  );

  // ── Mobile layout ───────────────────────────────────────────
  const MOBILE_TABS = [
    { id: 'browser', label: 'List',    icon: List },
    { id: 'problem', label: 'Problem', icon: BookOpen },
    { id: 'editor',  label: 'Code',    icon: Code2 },
    { id: 'results', label: 'Results', icon: ClipboardList },
  ];

  const Mobile = (
    <div className="flex flex-col h-full rounded-xl border border-game-border overflow-hidden">
      <div className="flex border-b border-game-border bg-game-card shrink-0">
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMobileTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs transition-colors
              ${mobileTab === id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-600 hover:text-slate-400'}`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col" style={{ background: '#0f0e17' }}>
        {mobileTab === 'browser' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-game-card">
            <ProblemBrowser onClose={() => setMobileTab('problem')} />
          </div>
        )}
        {mobileTab === 'problem' && (
          <div className="flex-1 overflow-y-auto bg-game-card"><ProblemPanel /></div>
        )}
        {mobileTab === 'editor' && (
          <div className="flex-1 flex flex-col min-h-0">
            <Toolbar {...toolbarProps} />
            <div className="flex-1 min-h-0">{editorEl}</div>
          </div>
        )}
        {mobileTab === 'results' && (
          <div className="flex-1 overflow-y-auto"><ResultsStrip {...resultsProps} /></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <div className="hidden md:block h-full">{Desktop}</div>
      <div className="block md:hidden h-full">{Mobile}</div>
    </div>
  );
}