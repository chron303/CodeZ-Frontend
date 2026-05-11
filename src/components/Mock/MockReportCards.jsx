// frontend/src/components/Mock/MockReportCards.jsx
// Sliding memory-card style report cards shown in the Stats page

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Clock, Target,
         CheckCircle, TrendingUp, Loader, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_URL } from '../../utils/config.js';

var BASE = API_URL || '';

var GRADE_STYLE = {
  S: { text:'text-yellow-300', bg:'bg-yellow-500/20', border:'border-yellow-500/40', glow:'#eab308', label:'Legendary' },
  A: { text:'text-green-300',  bg:'bg-green-500/20',  border:'border-green-500/40',  glow:'#22c55e', label:'Excellent' },
  B: { text:'text-blue-300',   bg:'bg-blue-500/20',   border:'border-blue-500/40',   glow:'#3b82f6', label:'Good'      },
  C: { text:'text-orange-300', bg:'bg-orange-500/20', border:'border-orange-500/40', glow:'#f97316', label:'Average'   },
  D: { text:'text-red-300',    bg:'bg-red-500/20',    border:'border-red-500/40',    glow:'#ef4444', label:'Keep going'},
};

// ── Single card ────────────────────────────────────────────────
function ReportCard({ report, index, activeIndex, total, onClick }) {
  var g        = GRADE_STYLE[report.grade] || GRADE_STYLE.C;
  var isActive = index === activeIndex;
  var offset   = index - activeIndex;
  var absOff   = Math.abs(offset);

  // Stack positioning
  var translateX = offset * 260;
  var translateZ = isActive ? 0 : -absOff * 40;
  var scale      = isActive ? 1 : Math.max(0.82, 1 - absOff * 0.08);
  var opacity    = absOff > 2 ? 0 : isActive ? 1 : Math.max(0.3, 1 - absOff * 0.3);
  var zIndex     = total - absOff;

  var date = report.finishedAt
    ? new Date(report.finishedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : '—';

  var duration = report.startedAt && report.finishedAt
    ? Math.floor((new Date(report.finishedAt) - new Date(report.startedAt)) / 60000)
    : report.durationMins || 0;

  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer select-none"
      style={{
        width: 240,
        left: '50%',
        marginLeft: -120,
        transform: `translateX(${translateX}px) scale(${scale}) translateZ(${translateZ}px)`,
        opacity,
        zIndex,
        transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
      <div
        className={`rounded-2xl border-2 overflow-hidden ${g.border}`}
        style={{
          background: 'linear-gradient(145deg, #1a1830, #0f0e17)',
          boxShadow: isActive ? `0 20px 60px ${g.glow}35, 0 0 0 1px ${g.glow}20` : '0 8px 24px rgba(0,0,0,0.4)',
        }}>

        {/* Card header */}
        <div className="p-4 text-center"
          style={{ background: `linear-gradient(135deg, ${g.glow}18, transparent)` }}>
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl
            border-2 text-3xl font-black mb-2 ${g.bg} ${g.border} ${g.text}`}
            style={{ boxShadow: isActive ? `0 0 20px ${g.glow}50` : 'none' }}>
            {report.grade}
          </div>
          <p className={`text-xs font-semibold ${g.text}`}>{g.label}</p>
          <p className="text-xs text-slate-600 mt-0.5">{date}</p>
        </div>

        {/* Card body */}
        <div className="px-4 pb-4 space-y-3">
          {/* Score bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Score</span>
              <span className={`font-mono font-bold ${g.text}`}>{report.overallScore}/100</span>
            </div>
            <div className="h-2 bg-game-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: report.overallScore + '%', background: g.glow }}/>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{report.passedCount}/{report.problemCount}</p>
              <p className="text-xs text-slate-600">Solved</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white capitalize">{report.level}</p>
              <p className="text-xs text-slate-600">Level</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{duration}m</p>
              <p className="text-xs text-slate-600">Used</p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`text-center py-1.5 rounded-lg text-xs font-medium ${g.bg} ${g.text}`}>
            {report.verdict}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expanded detail overlay ────────────────────────────────────
function ReportDetail({ report, onClose }) {
  var g = GRADE_STYLE[report.grade] || GRADE_STYLE.C;
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    var t = setTimeout(function() { setVisible(true); }, 30);
    return function() { clearTimeout(t); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border bg-game-card"
        style={{
          borderColor: g.glow + '40',
          boxShadow: '0 0 60px ' + g.glow + '25',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={function(e) { e.stopPropagation(); }}>

        {/* Header */}
        <div className="p-5 text-center border-b border-game-border"
          style={{ background: `linear-gradient(135deg, ${g.glow}12, transparent)` }}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl
            border-2 text-4xl font-black mb-2 ${g.bg} ${g.border} ${g.text}`}
            style={{ boxShadow: `0 0 25px ${g.glow}45` }}>
            {report.grade}
          </div>
          <p className={`text-lg font-bold ${g.text}`}>{report.verdict}</p>
          <p className="text-slate-500 text-xs mt-1">
            {report.level} · {report.passedCount}/{report.problemCount} solved · Score: {report.overallScore}/100
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          {report.summary && (
            <p className="text-sm text-slate-400 leading-relaxed">{report.summary}</p>
          )}

          {/* Score bar */}
          <div>
            <div className="h-2.5 bg-game-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: report.overallScore + '%', background: g.glow }}/>
            </div>
          </div>

          {/* Strengths + improvements */}
          <div className="grid grid-cols-2 gap-3">
            {report.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3"/> Strengths
                </p>
                {report.strengths.map(function(s, i) {
                  return <p key={i} className="text-xs text-slate-500 mb-1 leading-relaxed">{s}</p>;
                })}
              </div>
            )}
            {report.improvements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3"/> Improve
                </p>
                {report.improvements.map(function(s, i) {
                  return <p key={i} className="text-xs text-slate-500 mb-1 leading-relaxed">{s}</p>;
                })}
              </div>
            )}
          </div>

          {/* Problem breakdown */}
          {report.problemReports?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Problems</p>
              <div className="space-y-2">
                {report.problemReports.map(function(p, i) {
                  return (
                    <div key={i} className="p-3 rounded-xl bg-game-surface border border-game-border space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 w-4">{i+1}</span>
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
                        <div className="h-full rounded-full"
                          style={{
                            width: p.score + '%',
                            background: p.score>=80?'#22c55e':p.score>=50?'#eab308':'#ef4444'
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
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-slate-400 leading-relaxed">{report.nextSteps}</p>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium border border-game-border
              text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function MockReportCards() {
  const { user } = useAuth();
  var [reports,     setReports]     = useState([]);
  var [loading,     setLoading]     = useState(true);
  var [activeIndex, setActiveIndex] = useState(0);
  var [detail,      setDetail]      = useState(null);

  useEffect(function() {
    if (!user) return;
    fetch(BASE + '/api/mock/reports/' + user.uid + '?requester=' + user.uid)
      .then(function(r) { return r.json(); })
      .then(function(d) { setReports(d.reports || []); })
      .catch(function(e) { console.error('[MockReportCards]', e.message); })
      .finally(function() { setLoading(false); });
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader className="w-5 h-5 animate-spin text-purple-400"/>
    </div>
  );

  if (reports.length === 0) return (
    <div className="text-center py-10 space-y-2">
      <p className="text-3xl">🎯</p>
      <p className="text-slate-500 text-sm font-medium">No mock interviews yet</p>
      <p className="text-slate-700 text-xs">Complete a mock interview to see your report cards here</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="pixel text-xs text-purple-400">Interview History</p>
          <p className="text-slate-600 text-xs mt-0.5">{reports.length} report card{reports.length !== 1 ? 's' : ''}</p>
        </div>
        {reports.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>← → to browse</span>
          </div>
        )}
      </div>

      {/* Card carousel */}
      <div
        className="relative overflow-hidden"
        style={{ height: 360, perspective: 1000 }}>

        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {reports.map(function(report, i) {
            return (
              <ReportCard
                key={report.id || i}
                report={report}
                index={i}
                activeIndex={activeIndex}
                total={reports.length}
                onClick={function() {
                  if (i === activeIndex) setDetail(report);
                  else setActiveIndex(i);
                }}
              />
            );
          })}
        </div>

        {/* Nav arrows */}
        {activeIndex > 0 && (
          <button
            onClick={function() { setActiveIndex(function(i) { return i - 1; }); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50
              w-8 h-8 rounded-full bg-game-card border border-game-border
              flex items-center justify-center text-slate-400
              hover:text-slate-200 hover:border-slate-600 transition-colors">
            <ChevronLeft className="w-4 h-4"/>
          </button>
        )}
        {activeIndex < reports.length - 1 && (
          <button
            onClick={function() { setActiveIndex(function(i) { return i + 1; }); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50
              w-8 h-8 rounded-full bg-game-card border border-game-border
              flex items-center justify-center text-slate-400
              hover:text-slate-200 hover:border-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4"/>
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {reports.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {reports.map(function(_, i) {
            var g = GRADE_STYLE[reports[i].grade] || GRADE_STYLE.C;
            return (
              <button key={i}
                onClick={function() { setActiveIndex(i); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === activeIndex ? g.glow : '#2d2a45',
                  transform: i === activeIndex ? 'scale(1.4)' : 'scale(1)',
                }}/>
            );
          })}
        </div>
      )}

      {/* Tap hint */}
      <p className="text-center text-xs text-slate-700">
        Tap the front card to view full report
      </p>

      {/* Detail modal */}
      {detail && (
        <ReportDetail report={detail} onClose={function() { setDetail(null); }}/>
      )}
    </div>
  );
}