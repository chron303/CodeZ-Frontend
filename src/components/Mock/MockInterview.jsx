// frontend/src/components/Mock/MockInterview.jsx
//
// Session persistence strategy:
//   - On session start: save sessionId to localStorage under key 'mock_session_id'
//   - On mount: if localStorage has a sessionId, fetch it from the server to resume
//   - On finish/expire: clear localStorage
//   - Timer is always sourced from server endsAt — immune to tab switching

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, RotateCcw, Clock, ChevronDown, CheckCircle,
  XCircle, Loader, AlertTriangle, Zap, TrendingUp,
} from 'lucide-react';
import { useAuth }    from '../../context/AuthContext.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';
import { API_URL }    from '../../utils/config.js';
import { LANGUAGES, getLanguage, getStarterCode } from '../../utils/languages.js';

var BASE            = API_URL || '';
var SESSION_STORAGE_KEY = 'mock_session_id';

// ── API helper ─────────────────────────────────────────────────
async function api(method, path, body) {
  var res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function saveSession(sessionId) {
  try { localStorage.setItem(SESSION_STORAGE_KEY, sessionId); } catch(e) {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch(e) {}
}
function getSavedSession() {
  try { return localStorage.getItem(SESSION_STORAGE_KEY); } catch(e) { return null; }
}

// ── Server-side countdown ──────────────────────────────────────
function useCountdown(endsAt) {
  var [remaining, setRemaining] = useState(function() {
    if (!endsAt) return 9999999;
    return Math.max(0, new Date(endsAt).getTime() - Date.now());
  });

  useEffect(function() {
    if (!endsAt) return;
    var end = new Date(endsAt).getTime();
    setRemaining(Math.max(0, end - Date.now()));
    var id = setInterval(function() {
      setRemaining(Math.max(0, end - Date.now()));
    }, 1000);
    return function() { clearInterval(id); };
  }, [endsAt]);

  var totalSecs = Math.floor(remaining / 1000);
  var hours = Math.floor(totalSecs / 3600);
  var mins  = Math.floor((totalSecs % 3600) / 60);
  var secs  = totalSecs % 60;
  var display = hours > 0
    ? hours + ':' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0')
    : String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  return { remaining, display, isExpired: remaining <= 0 };
}

// ── Grade styles ───────────────────────────────────────────────
var GRADE_STYLE = {
  S: { text:'text-yellow-300', bg:'bg-yellow-500/20', border:'border-yellow-500/40', glow:'#eab308' },
  A: { text:'text-green-300',  bg:'bg-green-500/20',  border:'border-green-500/40',  glow:'#22c55e' },
  B: { text:'text-blue-300',   bg:'bg-blue-500/20',   border:'border-blue-500/40',   glow:'#3b82f6' },
  C: { text:'text-orange-300', bg:'bg-orange-500/20', border:'border-orange-500/40', glow:'#f97316' },
  D: { text:'text-red-300',    bg:'bg-red-500/20',    border:'border-red-500/40',    glow:'#ef4444' },
};

// ── Styled language picker ─────────────────────────────────────
function LangPicker({ langId, onChange }) {
  var [open, setOpen] = useState(false);
  var lang = getLanguage(langId);
  return (
    <div className="relative">
      <button
        onClick={function() { setOpen(function(o) { return !o; }); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
          border transition-colors ${lang.badge}`}>
        {lang.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={function() { setOpen(false); }}/>
          <div className="absolute left-0 top-full mt-1 z-50 game-card overflow-hidden shadow-xl"
            style={{ minWidth: 140 }}>
            {LANGUAGES.map(function(l) {
              return (
                <button key={l.id}
                  onClick={function() { onChange(l.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors
                    hover:bg-game-surface flex items-center justify-between
                    ${l.id === langId ? 'text-white' : 'text-slate-400'}`}>
                  {l.label}
                  {l.id === langId && <span className="text-purple-400">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. SETUP
// ─────────────────────────────────────────────────────────────
function MockSetup({ onStart }) {
  const { user } = useAuth();
  var [level,    setLevel]    = useState('intermediate');
  var [duration, setDuration] = useState('1.5hr');
  var [loading,  setLoading]  = useState(false);
  var [error,    setError]    = useState('');

  var LEVELS = [
    { id:'beginner',     label:'Beginner',    sub:'3 problems · Easy/Medium',         emoji:'🌱' },
    { id:'intermediate', label:'Intermediate', sub:'4 problems · Easy/Medium/Hard',   emoji:'⚡' },
    { id:'pro',          label:'Pro',          sub:'5-6 problems · Medium/Hard focus', emoji:'🔥' },
  ];
  var DURATIONS = [
    { id:'1hr',   label:'1 Hour',    sub:'Quick assessment'   },
    { id:'1.5hr', label:'1.5 Hours', sub:'Standard interview' },
    { id:'2hr',   label:'2 Hours',   sub:'Full assessment'    },
  ];

  async function handleStart() {
    setLoading(true); setError('');
    try {
      var data = await api('POST', '/api/mock/start', { uid: user.uid, level, duration });
      saveSession(data.sessionId);
      onStart(data);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30
          flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="pixel text-base text-purple-400 mb-2">Mock Interview</h1>
        <p className="text-slate-500 text-sm">
          Online assessment mode · Problems picked by AI based on your profile
        </p>
      </div>

      {/* Level */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Experience Level</p>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map(function(l) {
            var active = level === l.id;
            return (
              <button key={l.id} onClick={function() { setLevel(l.id); }}
                className={`p-4 rounded-xl border text-left transition-all
                  ${active ? 'bg-purple-500/15 border-purple-500/50' : 'bg-game-surface border-game-border hover:border-slate-600'}`}
                style={active ? { boxShadow:'0 0 16px rgba(124,58,237,0.2)' } : {}}>
                <div className="text-2xl mb-2">{l.emoji}</div>
                <p className={`text-sm font-semibold ${active ? 'text-purple-300' : 'text-slate-300'}`}>{l.label}</p>
                <p className="text-xs text-slate-600 mt-1 leading-tight">{l.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Duration</p>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map(function(d) {
            var active = duration === d.id;
            return (
              <button key={d.id} onClick={function() { setDuration(d.id); }}
                className={`p-3.5 rounded-xl border text-left transition-all
                  ${active ? 'bg-blue-500/10 border-blue-500/40' : 'bg-game-surface border-game-border hover:border-slate-600'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className={`w-3.5 h-3.5 ${active ? 'text-blue-400' : 'text-slate-600'}`}/>
                  <p className={`text-sm font-semibold ${active ? 'text-blue-300' : 'text-slate-400'}`}>{d.label}</p>
                </div>
                <p className="text-xs text-slate-600">{d.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-game-surface border border-game-border rounded-xl p-4 space-y-1.5 text-xs text-slate-600">
        <p className="text-xs font-semibold text-slate-400 mb-2">How it works</p>
        <p>• AI picks problems based on your solve history and level</p>
        <p>• Timer runs server-side — switching tabs or closing the browser won't stop it</p>
        <p>• If you close and reopen DSA Quest, you'll be taken back to your session</p>
        <p>• No hints, no AI assistance during the assessment</p>
        <p>• One mock interview per day</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0"/>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button onClick={handleStart} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
          text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white
          disabled:opacity-50 disabled:cursor-not-allowed transition-all
          shadow-lg hover:shadow-purple-500/25">
        {loading
          ? <><Loader className="w-4 h-4 animate-spin"/> Setting up your interview…</>
          : <><Play   className="w-4 h-4"/> Start Mock Interview</>}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. MOCK EDITOR
// ─────────────────────────────────────────────────────────────
function MockEditor({ session, onFinish }) {
  const { user } = useAuth();
  var { remaining, display, isExpired } = useCountdown(session.endsAt);

  var [activePIdx, setActivePIdx] = useState(0);
  var [codes, setCodes] = useState(function() {
    var m = {};
    session.problems.forEach(function(p) { m[p.id] = p.code || ''; });
    return m;
  });
  var [globalLang, setGlobalLang] = useState('python');
  var [results,  setResults]  = useState(function() {
    var m = {}; session.problems.forEach(function(p) { m[p.id] = null; }); return m;
  });
  var [statuses, setStatuses] = useState(function() {
    var m = {}; session.problems.forEach(function(p) { m[p.id] = p.status || 'pending'; }); return m;
  });
  var [running,    setRunning]    = useState(false);
  var [finishing,  setFinishing]  = useState(false);
  var [error,      setError]      = useState('');
  var [showFinish, setShowFinish] = useState(false);

  var problem = session.problems[activePIdx];
  var code    = codes[problem?.id] || '';

  // Load starter code when switching to a blank problem
  useEffect(function() {
    if (problem && !codes[problem.id]) {
      setCodes(function(prev) {
        return { ...prev, [problem.id]: getStarterCode(globalLang, problem) };
      });
    }
  }, [activePIdx]);

  function handleLangChange(newLang) {
    setGlobalLang(newLang);
    setCodes(function(prev) {
      var next = { ...prev };
      session.problems.forEach(function(p) {
        if (!prev[p.id] || prev[p.id] === getStarterCode(globalLang, p)) {
          next[p.id] = getStarterCode(newLang, p);
        }
      });
      return next;
    });
  }

  // Auto-finish on timer expiry — ref guard fires exactly once
  var autoFinishedRef = useRef(false);
  useEffect(function() {
    if (isExpired && !autoFinishedRef.current) {
      autoFinishedRef.current = true;
      handleFinish(true);
    }
  }, [isExpired]);

  async function handleRun() {
    if (!problem || running) return;
    setRunning(true); setError('');
    try {
      var data = await api('POST', '/api/mock/submit', {
        uid: user.uid, sessionId: session.sessionId,
        problemId: problem.id, code, language: globalLang,
      });
      setResults(function(prev)  { return { ...prev, [problem.id]: data }; });
      setStatuses(function(prev) { return { ...prev, [problem.id]: data.allPassed ? 'passed' : 'attempted' }; });
    } catch(e) {
      setError(e.message);
      if (e.message.includes('Time is up')) handleFinish(true);
    } finally { setRunning(false); }
  }

  async function handleFinish(auto) {
    if (finishing) return;
    setFinishing(true);
    try {
      var data = await api('POST', '/api/mock/finish', { uid: user.uid, sessionId: session.sessionId });
      clearSession(); // clear localStorage on proper finish
      onFinish(data.report);
    } catch(e) {
      setError('Could not generate report: ' + e.message);
      setFinishing(false);
    }
  }

  var timerColor = remaining > 5 * 60 * 1000 ? 'text-green-400'
    : remaining > 2 * 60 * 1000              ? 'text-yellow-400'
    :                                           'text-red-400';

  var passedCount = Object.values(statuses).filter(function(s) { return s === 'passed'; }).length;

  return (
    <div className="flex flex-col h-full" style={{ background: '#0f0e17' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-game-border bg-game-card shrink-0 flex-wrap">
        {/* Problem tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {session.problems.map(function(p, i) {
            var status = statuses[p.id];
            var active = i === activePIdx;
            return (
              <button key={p.id} onClick={function() { setActivePIdx(i); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  whitespace-nowrap transition-all shrink-0
                  ${active
                    ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-game-surface'}`}>
                {status === 'passed'    && <CheckCircle   className="w-3 h-3 text-green-400"/>}
                {status === 'attempted' && <AlertTriangle className="w-3 h-3 text-yellow-400"/>}
                {status === 'pending'   && <span className="w-3 h-3 rounded-full border border-slate-600 inline-block"/>}
                Q{i+1}
                <span className={`text-xs ${
                  p.difficulty==='Easy'  ?'text-green-500':
                  p.difficulty==='Medium'?'text-yellow-500':'text-red-500'
                }`}>{p.difficulty[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Language picker */}
        <LangPicker langId={globalLang} onChange={handleLangChange}/>

        {/* Progress */}
        <span className="text-xs text-slate-600 shrink-0">
          {passedCount}/{session.problems.length} solved
        </span>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          bg-game-surface border border-game-border shrink-0 font-mono text-sm font-bold ${timerColor}`}>
          <Clock className="w-3.5 h-3.5"/>
          {display}
        </div>

        {/* Finish */}
        {!showFinish
          ? <button onClick={function() { setShowFinish(true); }} disabled={finishing}
              className="px-3 py-1.5 rounded-lg text-xs border border-game-border text-slate-500
                hover:border-red-500/50 hover:text-red-400 transition-colors shrink-0">
              Finish
            </button>
          : <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-slate-500">Sure?</span>
              <button onClick={function() { handleFinish(false); }}
                className="px-2 py-1 rounded text-xs bg-red-600/30 border border-red-500/40
                  text-red-300 hover:bg-red-600/50 transition-colors">
                Yes, end
              </button>
              <button onClick={function() { setShowFinish(false); }}
                className="px-2 py-1 rounded text-xs text-slate-600 hover:text-slate-300">
                Cancel
              </button>
            </div>
        }
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 min-h-0">
        {/* Problem panel */}
        <div className="w-[38%] min-w-52 border-r border-game-border flex flex-col overflow-hidden bg-game-card">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${
                  problem?.difficulty==='Easy'  ?'text-green-400':
                  problem?.difficulty==='Medium'?'text-yellow-400':'text-red-400'
                }`}>{problem?.difficulty}</span>
                <span className="text-xs text-slate-600">{problem?.topic}</span>
              </div>
              <h2 className="text-sm font-bold text-white">{problem?.title}</h2>
            </div>
            {problem?.description
              ? <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{problem.description}</div>
              : <p className="text-xs text-slate-600 italic">No description available.</p>
            }
            {problem?.testCases?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Examples</p>
                {problem.testCases.slice(0, 2).map(function(tc, i) {
                  return (
                    <div key={i} className="bg-game-surface rounded-lg p-2.5 text-xs font-mono">
                      <p className="text-slate-600 mb-1">Input:</p>
                      <p className="text-slate-300 mb-2 whitespace-pre-wrap">{tc.input}</p>
                      <p className="text-slate-600 mb-1">Output:</p>
                      <p className="text-green-400 whitespace-pre-wrap">{tc.expected}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-game-border bg-game-card shrink-0">
            <button
              onClick={function() {
                setCodes(function(prev) {
                  return { ...prev, [problem.id]: getStarterCode(globalLang, problem) };
                });
              }}
              title="Reset code"
              className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-game-surface transition-colors">
              <RotateCcw className="w-3.5 h-3.5"/>
            </button>
            <div className="flex-1"/>
            <span className="text-xs text-slate-700">⌘↵ to run</span>
            <button onClick={handleRun} disabled={running || isExpired}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium
                bg-purple-600 hover:bg-purple-500 text-white
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Play className="w-3 h-3"/>
              {running ? 'Running…' : 'Run Tests'}
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              key={problem?.id + globalLang}
              height="100%"
              language={getLanguage(globalLang).monaco}
              theme="vs-dark"
              value={code}
              onChange={function(v) {
                setCodes(function(prev) { return { ...prev, [problem.id]: v || '' }; });
              }}
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                contextmenu: false,
              }}
            />
          </div>

          <div className="border-t border-game-border bg-game-card shrink-0"
            style={{ maxHeight: 180, overflowY: 'auto' }}>
            <div className="p-3">
              {finishing && (
                <div className="flex items-center gap-2 p-3 text-purple-400">
                  <Loader className="w-4 h-4 animate-spin"/>
                  <span className="text-sm">Generating your report card…</span>
                </div>
              )}
              {error && !finishing && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0"/>
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
              {results[problem?.id] && !finishing && (function() {
                var r = results[problem.id];
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      {r.allPassed
                        ? <CheckCircle className="w-4 h-4 text-green-400"/>
                        : <XCircle     className="w-4 h-4 text-red-400"/>}
                      <span className={`text-sm font-medium ${r.allPassed?'text-green-400':'text-red-400'}`}>
                        {r.verdict} — {r.passed}/{r.total} passed
                      </span>
                    </div>
                    {r.results?.slice(0, 4).map(function(tc, i) {
                      return (
                        <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                          ${tc.passed?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>
                          {tc.passed?<CheckCircle className="w-3 h-3"/>:<XCircle className="w-3 h-3"/>}
                          <span>{tc.label||('Test '+(i+1))}</span>
                          {!tc.passed&&tc.error&&(
                            <span className="text-slate-600 truncate">{tc.error.slice(0,60)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {!results[problem?.id] && !finishing && !error && (
                <p className="text-xs text-slate-700 text-center py-3">
                  Run your code to see test results
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. REPORT CARD
// ─────────────────────────────────────────────────────────────
function MockReport({ report, onClose }) {
  var [visible, setVisible] = useState(false);
  var g = GRADE_STYLE[report.grade] || GRADE_STYLE.C;

  useEffect(function() {
    var t = setTimeout(function() { setVisible(true); }, 50);
    return function() { clearTimeout(t); };
  }, []);

  var duration = report.startedAt && report.finishedAt
    ? Math.floor((new Date(report.finishedAt) - new Date(report.startedAt)) / 60000)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-game-card
        transition-all duration-500"
        style={{
          borderColor: g.glow+'50',
          boxShadow:   '0 0 60px '+g.glow+'30',
          opacity:     visible?1:0,
          transform:   visible?'translateY(0) scale(1)':'translateY(40px) scale(0.95)',
        }}>

        <div className="p-6 text-center"
          style={{ background:'linear-gradient(135deg, '+g.glow+'15, transparent)' }}>
          <div className="text-6xl mb-3">
            {report.grade==='S'?'🏆':report.grade==='A'?'⭐':report.grade==='B'?'👍':report.grade==='C'?'📈':'💪'}
          </div>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-2
            text-4xl font-black mb-3 ${g.bg} ${g.border} ${g.text}`}
            style={{ boxShadow:'0 0 30px '+g.glow+'40' }}>
            {report.grade}
          </div>
          <h2 className={`text-xl font-bold ${g.text} mb-1`}>{report.verdict}</h2>
          <p className="text-slate-500 text-sm">
            {report.passedCount}/{report.problemCount} solved · {report.level} · {duration} min used
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Overall score bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Overall Score</span>
              <span className={g.text+' font-mono font-bold'}>{report.overallScore}/100</span>
            </div>
            <div className="h-3 bg-game-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width:(visible?report.overallScore:0)+'%', background:g.glow }}/>
            </div>
          </div>

          {/* Marks summary */}
          {report.totalMaxMarks > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-game-surface border border-game-border">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Total Marks</p>
                <p className="text-lg font-bold text-white font-mono">
                  {report.totalEarned}
                  <span className="text-slate-500 text-sm font-normal">/{report.totalMaxMarks}</span>
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <p>Easy = 5 marks</p>
                <p>Medium = 10 marks</p>
                <p>Hard = 15 marks</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 rounded-xl bg-game-surface border border-game-border">
            <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
          </div>

          {/* Strengths + improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5"/> Strengths
                </p>
                {report.strengths.map(function(s,i) {
                  return <p key={i} className="text-xs text-slate-400 leading-relaxed mb-1">{s}</p>;
                })}
              </div>
            )}
            {report.improvements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5"/> Improve
                </p>
                {report.improvements.map(function(s,i) {
                  return <p key={i} className="text-xs text-slate-400 leading-relaxed mb-1">{s}</p>;
                })}
              </div>
            )}
          </div>

          {/* Problem breakdown */}
          {report.problemReports?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Problem Breakdown</p>
              <div className="space-y-2">
                {report.problemReports.map(function(p,i) {
                  return (
                    <div key={i} className="p-3 rounded-xl bg-game-surface border border-game-border space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-4 shrink-0">{i+1}</span>
                        <p className="text-xs font-medium text-slate-300 flex-1 truncate">{p.title}</p>
                        {p.difficulty && (
                          <span className={`text-xs shrink-0 ${
                            p.difficulty==='Easy'  ?'text-green-500':
                            p.difficulty==='Medium'?'text-yellow-500':'text-red-500'
                          }`}>{p.difficulty}</span>
                        )}
                        <span className={`text-sm font-bold font-mono shrink-0 ${
                          p.score>=80?'text-green-400':p.score>=50?'text-yellow-400':'text-red-400'
                        }`}>{p.marks || p.score}</span>
                      </div>
                      <div className="h-1.5 bg-game-card rounded-full overflow-hidden ml-6">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width:p.score+'%',
                            background:p.score>=80?'#22c55e':p.score>=50?'#eab308':'#ef4444'
                          }}/>
                      </div>
                      <p className="text-xs text-slate-600 ml-6">{p.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next steps */}
          {report.nextSteps && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-1">Next Steps</p>
                <p className="text-xs text-slate-400 leading-relaxed">{report.nextSteps}</p>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium
              bg-purple-600 hover:bg-purple-500 text-white transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN — handles setup, resume, active, report phases
// ─────────────────────────────────────────────────────────────
export default function MockInterview({ onClose }) {
  const { user }    = useAuth();
  const { premium } = usePremium();

  var [phase,       setPhase]       = useState('loading'); // loading | setup | active | report
  var [session,     setSession]     = useState(null);
  var [report,      setReport]      = useState(null);
  var [resumeError, setResumeError] = useState('');

  // On mount: check localStorage for an in-progress session and resume it
  useEffect(function() {
    if (!user) return;
    var savedId = getSavedSession();

    if (!savedId) {
      setPhase('setup');
      return;
    }

    // Try to resume
    fetch(BASE + '/api/mock/session/' + savedId + '?uid=' + encodeURIComponent(user.uid))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) {
          // Session not found or expired — clear and go to setup
          clearSession();
          setPhase('setup');
          return;
        }

        if (data.status === 'finished') {
          // Session finished (timer ran out while away) — show report if available
          if (data.report) {
            setReport(data.report);
            setPhase('report');
          } else {
            // Timer expired, need to generate report now
            api('POST', '/api/mock/finish', { uid: user.uid, sessionId: savedId })
              .then(function(r) {
                clearSession();
                setReport(r.report);
                setPhase('report');
              })
              .catch(function() {
                clearSession();
                setPhase('setup');
              });
          }
          return;
        }

        // Active session — resume it
        setSession({
          sessionId:    savedId,
          endsAt:       data.endsAt,
          durationMins: data.durationMins,
          problems:     data.problems,
          level:        data.level,
        });
        setPhase('active');
      })
      .catch(function() {
        clearSession();
        setPhase('setup');
      });
  }, [user]);

  // Premium gate
  if (!premium && phase !== 'loading') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30
          flex items-center justify-center mx-auto">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="pixel text-sm text-purple-400">Premium Required</h2>
        <p className="text-slate-500 text-sm">Mock interviews are a Premium feature.</p>
        <button onClick={function() { window.dispatchEvent(new CustomEvent('open-premium')); }}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white
            text-sm font-medium transition-colors">
          Upgrade to Premium
        </button>
      </div>
    );
  }

  // Loading phase — checking for saved session
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto"/>
          <p className="text-slate-500 text-sm">Checking for active session…</p>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <MockSetup onStart={function(s) {
        setSession(s);
        setPhase('active');
      }}/>
    );
  }

  if (phase === 'active' && session) {
    return (
      <div className="h-full">
        <MockEditor
          session={session}
          onFinish={function(r) {
            clearSession();
            setReport(r);
            setPhase('report');
          }}
        />
      </div>
    );
  }

  if (phase === 'report' && report) {
    return <MockReport report={report} onClose={onClose}/>;
  }

  return null;
}