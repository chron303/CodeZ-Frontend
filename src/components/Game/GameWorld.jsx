// frontend/src/components/Game/GameWorld.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ChevronDown, CheckCircle, Circle, Code2, X, ChevronUp } from 'lucide-react';
import { useTheme } from '../../themes/ThemeContext.jsx';
import { useApp }   from '../../context/AppContext.jsx';

// ── Canvas constants ───────────────────────────────────────────
const CANVAS_H     = 300;
const NODE_R       = 18;
const NODE_SPACING = 110;
const PATH_Y_BASE  = 170;
const CHAR_H       = 24;

// ── Colours ────────────────────────────────────────────────────
const DIFF_FILL = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const DIFF_GLOW = {
  Easy:   'rgba(16,185,129,0.45)',
  Medium: 'rgba(245,158,11,0.45)',
  Hard:   'rgba(239,68,68,0.45)',
};
const ZONE_BKGS_DARK  = ['#08061a','#06101a','#080d06','#180608','#060b10','#100806','#060810','#0c0608'];
const ZONE_BKGS_MARIO = ['#5C94FC','#4a84ec','#6aa4ff','#5090f0','#4880e8','#5898fc','#4488f0','#5C94FC'];

// ── Space character sprite ─────────────────────────────────────
const SPRITE = [
  [0,0,2,2,2,0,0,0],
  [0,2,1,1,1,2,0,0],
  [0,2,1,1,1,2,0,0],
  [0,0,2,2,2,0,0,0],
  [3,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,0,0],
  [0,4,4,0,4,4,0,0],
  [0,5,5,0,5,5,0,0],
];
const PAL  = { 0:null, 1:'#f4c89e', 2:'#3d2b1a', 3:'#7c3aed', 4:'#1d4ed8', 5:'#111827' };
const CELL = 3;

// ── Mario sprite ───────────────────────────────────────────────
const MARIO_SPRITE = [
  [0,0,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [0,2,2,3,3,2,3,0,0,0],
  [2,3,2,3,3,2,3,3,3,0],
  [2,3,2,2,3,3,3,2,3,0],
  [2,2,3,3,3,2,2,2,0,0],
  [0,0,3,3,3,3,3,0,0,0],
  [0,1,1,4,1,1,1,0,0,0],
  [1,1,1,4,1,4,1,1,1,0],
  [1,1,1,4,4,4,1,1,1,0],
  [0,0,3,4,4,3,0,0,0,0],
  [0,3,3,0,0,3,3,3,0,0],
  [3,3,3,0,0,3,3,3,3,0],
];
const MARIO_PAL = { 0:null, 1:'#e74c3c', 2:'#f4c89e', 3:'#8b5e3c', 4:'#0070e8' };

function drawChar(ctx, cx, cy, frame, walking, mario = false) {
  const bobY = walking ? 0 : Math.sin(frame * 0.05) * 3;
  if (mario) {
    const S = 2;
    const sprite = MARIO_SPRITE;
    const pal    = MARIO_PAL;
    const sx = cx - (sprite[0].length * S) / 2;
    const sy = cy - sprite.length * S + bobY;
    const legOff = walking ? (Math.floor(frame / 4) % 2 === 0 ? 2 : -2) : 0;
    sprite.forEach((row, ry) => {
      row.forEach((c, rx) => {
        const col = pal[c];
        if (!col) return;
        const dy = (ry >= 10 && walking) ? legOff : 0;
        ctx.fillStyle = col;
        ctx.fillRect(sx + rx*S, sy + ry*S + dy, S, S);
      });
    });
    return;
  }
  const sx = cx - (SPRITE[0].length * CELL) / 2;
  const sy = cy - SPRITE.length * CELL + bobY;
  SPRITE.forEach((row, ry) => {
    row.forEach((c, rx) => {
      const col = PAL[c];
      if (!col) return;
      const dy = (ry >= 6 && walking)
        ? (rx < 4 ? Math.sin(frame * 0.25) * 2.5 : -Math.sin(frame * 0.25) * 2.5)
        : 0;
      ctx.fillStyle = col;
      ctx.fillRect(sx + rx*CELL, sy + ry*CELL + dy, CELL-0.5, CELL-0.5);
    });
  });
}

function drawNode(ctx, x, y, problem, isCurrent, frame, mario = false) {
  const solved = problem.solved;
  const diff   = problem.difficulty;

  if (mario) {
    const S  = NODE_R * 1.1;
    const bx = x - S, by = y - S;
    const bw = S * 2, bh = S * 2;
    const bounceY = isCurrent ? Math.abs(Math.sin(frame * 0.1)) * -6 : 0;
    if (solved) {
      ctx.fillStyle = '#5c3310'; ctx.fillRect(bx, by + bounceY, bw, bh);
      ctx.fillStyle = '#7a4a20'; ctx.fillRect(bx+2, by+2+bounceY, bw-4, bh-4);
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✓', x, y + bounceY);
    } else if (isCurrent) {
      const flash = Math.sin(frame * 0.15) > 0;
      ctx.fillStyle = flash ? '#fbbf24' : '#f59e0b'; ctx.fillRect(bx, by+bounceY, bw, bh);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx, by+bounceY, bw, 3); ctx.fillRect(bx, by+bounceY, 3, bh);
      ctx.fillRect(bx+bw-3, by+bounceY, 3, bh); ctx.fillRect(bx, by+bh-3+bounceY, bw, 3);
      ctx.fillStyle = '#1a0a00'; ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y + bounceY);
    } else {
      const brickColor = diff==='Hard' ? '#dc2626' : diff==='Medium' ? '#d97706' : '#c8a96e';
      ctx.fillStyle = brickColor; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(bx, by+bh/2, bw, 2); ctx.fillRect(bx+bw/2, by, 2, bh/2);
      ctx.fillStyle = '#fff8'; ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(diff[0], x, y);
    }
    const label = problem.title.length > 12 ? problem.title.slice(0,11)+'…' : problem.title;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#1a0a00'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + S + 12);
    return;
  }

  const fill = solved ? (DIFF_FILL[diff]||'#10b981') : isCurrent ? '#7c3aed' : '#2d2a45';
  const glow = solved ? (DIFF_GLOW[diff]||DIFF_GLOW.Easy) : isCurrent ? 'rgba(124,58,237,0.5)' : null;
  if (glow) {
    const pulse = isCurrent ? 1 + Math.sin(frame * 0.08) * 0.25 : 1;
    ctx.beginPath(); ctx.arc(x, y, NODE_R * 1.6 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = solved ? '#ffffff88' : isCurrent ? '#a78bfa' : '#3d3a55';
  ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (solved) {
    ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif'; ctx.fillText('✓', x, y);
  } else if (isCurrent) {
    ctx.fillStyle='#e9d5ff'; ctx.font='bold 12px sans-serif'; ctx.fillText('▶', x, y+1);
  } else {
    ctx.fillStyle='#64748b'; ctx.font='bold 10px sans-serif'; ctx.fillText(diff[0], x, y);
  }
  const label = problem.title.length > 13 ? problem.title.slice(0,12)+'…' : problem.title;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = solved ? '#6b7280' : isCurrent ? '#c4b5fd' : '#374151';
  ctx.fillText(label, x, y + NODE_R + 13);
}

// ── Topic Dropdown ─────────────────────────────────────────────
function TopicDropdown({ topics, activeTopic, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
          bg-game-card border border-game-border text-slate-300
          hover:border-purple-500/60 transition-colors min-w-36">
        <span className="flex-1 text-left truncate">{activeTopic || 'All Topics'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${open?'rotate-180':''}`}/>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 game-card overflow-y-auto shadow-xl"
          style={{ minWidth:'180px', maxHeight:'240px' }}>
          <button onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-game-surface
              ${!activeTopic ? 'text-purple-400' : 'text-slate-400'}`}>
            All Topics
          </button>
          {topics.map(t => (
            <button key={t.topic} onClick={() => { onSelect(t.topic); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-game-surface
                flex items-center justify-between gap-2
                ${activeTopic===t.topic ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400'}`}>
              <span className="truncate flex-1">{t.topic}</span>
              <span className={`shrink-0 text-xs font-mono ${
                t.percentage===100?'text-green-400':t.percentage>50?'text-yellow-500':'text-slate-600'
              }`}>{t.percentage}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Problem Sidebar (desktop) ──────────────────────────────────
function ProblemSidebar({ topic, currentProblemId, onNavigate, onPractice, onClose }) {
  if (!topic) return null;
  const byDiff = {
    Easy:   topic.problems.filter(p => p.difficulty==='Easy'),
    Medium: topic.problems.filter(p => p.difficulty==='Medium'),
    Hard:   topic.problems.filter(p => p.difficulty==='Hard'),
  };
  const DIFF_DOT  = { Easy:'bg-green-400', Medium:'bg-yellow-400', Hard:'bg-red-400' };
  const DIFF_TEXT = { Easy:'text-green-400', Medium:'text-yellow-400', Hard:'text-red-400' };

  return (
    <div className="game-card flex flex-col overflow-hidden" style={{ width:'260px', maxHeight:'300px' }}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-game-border shrink-0">
        <div>
          <p className="text-white text-xs font-semibold">{topic.topic}</p>
          <p className="text-slate-600 text-xs">{topic.solved}/{topic.total} solved · {topic.percentage}%</p>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
          <X className="w-3.5 h-3.5"/>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-3">
        {['Easy','Medium','Hard'].map(diff => {
          const probs = byDiff[diff];
          if (!probs.length) return null;
          const solved = probs.filter(p => p.solved).length;
          return (
            <div key={diff}>
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${DIFF_DOT[diff]}`}/>
                <span className={`text-xs font-medium ${DIFF_TEXT[diff]}`}>{diff}</span>
                <span className="text-slate-700 text-xs ml-auto">{solved}/{probs.length}</span>
              </div>
              {probs.map(p => (
                <div key={p.id} onClick={() => onNavigate(p)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors
                    ${p.id===currentProblemId
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'hover:bg-game-surface'}
                    ${p.solved ? 'opacity-60' : ''}`}>
                  {p.solved
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0"/>
                    : <Circle      className="w-3.5 h-3.5 text-slate-600 shrink-0"/>}
                  <span className={`flex-1 truncate ${p.solved ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {p.title}
                  </span>
                  {!p.solved && (
                    <button onClick={e => { e.stopPropagation(); onPractice(p); }}
                      className="shrink-0 text-slate-700 hover:text-purple-400 transition-colors">
                      <Code2 className="w-3 h-3"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mobile Problem Sheet (bottom drawer) ───────────────────────
function MobileProblemSheet({ topic, currentProblemId, onNavigate, onPractice, onClose }) {
  if (!topic) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="game-card rounded-t-2xl border-t border-game-border overflow-hidden"
        style={{ maxHeight: '60vh' }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600"/>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-game-border">
          <div>
            <p className="text-white text-sm font-semibold">{topic.topic}</p>
            <p className="text-slate-500 text-xs">{topic.solved}/{topic.total} solved · {topic.percentage}%</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-1" style={{ maxHeight: 'calc(60vh - 80px)' }}>
          {topic.problems.map(p => (
            <div key={p.id}
              onClick={() => { onNavigate(p); onClose(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors
                ${p.id===currentProblemId ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-game-surface'}
                ${p.solved ? 'opacity-60' : ''}`}>
              {p.solved
                ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0"/>
                : <Circle      className="w-4 h-4 text-slate-600 shrink-0"/>}
              <span className={`flex-1 truncate ${p.solved ? 'line-through text-slate-500' : 'text-white'}`}>
                {p.title}
              </span>
              <span className={`text-xs shrink-0 ${
                p.difficulty==='Easy'  ? 'text-green-400' :
                p.difficulty==='Medium'? 'text-yellow-400' : 'text-red-400'
              }`}>{p.difficulty[0]}</span>
              {!p.solved && (
                <button onClick={e => { e.stopPropagation(); onPractice(p); onClose(); }}
                  className="shrink-0 px-2 py-1 rounded-lg bg-purple-600/30 border border-purple-500/40
                    text-purple-300 text-xs">
                  Go
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function GameWorld({ onOpenProblem }) {
  const { topics }  = useApp();
  const { isMario } = useTheme();

  const canvasRef       = useRef(null);
  const containerRef    = useRef(null);
  const frameRef        = useRef(0);
  const rafRef          = useRef(null);
  const scrollRef       = useRef(0);
  const targetScrollRef = useRef(0);
  const charXRef        = useRef(0);
  const charTargetRef   = useRef(0);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [isWalking,   setIsWalking]   = useState(false);
  const [filterTopic, setFilterTopic] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  // internal canvas draw width — scaled down on mobile
  const [canvasW,     setCanvasW]     = useState(900);

  // ── Detect mobile + set canvas width via ResizeObserver ──────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setIsMobile(w < 640);
      // Use container width as internal canvas draw width (min 400)
      setCanvasW(Math.max(400, Math.round(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allProblems = useMemo(() => {
    if (!filterTopic) return topics.flatMap(t => t.problems);
    const t = topics.find(t => t.topic === filterTopic);
    return t ? t.problems : [];
  }, [topics, filterTopic]);

  const nodes = useMemo(() => allProblems.map((p, i) => ({
    x: 80 + i * NODE_SPACING,
    y: PATH_Y_BASE + Math.sin(i * 0.7) * 40,
    problem: p,
    index: i,
  })), [allProblems]);

  const activeTopic = useMemo(() => {
    if (!filterTopic) {
      const prob = allProblems[currentIdx];
      if (!prob) return null;
      return topics.find(t => t.topic === prob.topic) || null;
    }
    return topics.find(t => t.topic === filterTopic) || null;
  }, [filterTopic, topics, allProblems, currentIdx]);

  const currentProblem = allProblems[currentIdx];

  const walkTo = useCallback((idx) => {
    if (idx < 0 || idx >= nodes.length) return;
    charTargetRef.current   = nodes[idx].x;
    targetScrollRef.current = Math.max(0, nodes[idx].x - 300);
    setIsWalking(true);
    setCurrentIdx(idx);
    setTimeout(() => setIsWalking(false), 700);
  }, [nodes]);

  const walkToProblem = useCallback((problem) => {
    const idx = allProblems.findIndex(p => p.id === problem.id);
    if (idx !== -1) walkTo(idx);
  }, [allProblems, walkTo]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const first = allProblems.findIndex(p => !p.solved);
    const idx   = first === -1 ? 0 : first;
    charXRef.current        = nodes[idx]?.x ?? 80;
    charTargetRef.current   = charXRef.current;
    scrollRef.current       = Math.max(0, charXRef.current - 300);
    targetScrollRef.current = scrollRef.current;
    setCurrentIdx(idx);
  }, [filterTopic, topics.length]);

  // ── Click / tap handler ───────────────────────────────────────
  // Works for both mouse and touch
  const handleCanvasInteraction = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (clientX - rect.left) * scaleX + scrollRef.current;
    const my = (clientY - rect.top)  * scaleX;
    // Larger hit area on mobile (NODE_R + 16 instead of +8)
    const hitR = isMobile ? NODE_R + 16 : NODE_R + 8;
    for (const node of nodes) {
      const dx = mx - node.x, dy = my - node.y;
      if (Math.sqrt(dx*dx + dy*dy) < hitR) { walkTo(node.index); return; }
    }
  }, [nodes, walkTo, isMobile]);

  const handleClick = useCallback((e) => {
    handleCanvasInteraction(e.clientX, e.clientY);
  }, [handleCanvasInteraction]);

  const handleTouch = useCallback((e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    handleCanvasInteraction(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleCanvasInteraction]);

  // ── Draw loop ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const draw = () => {
      frameRef.current++;
      const f = frameRef.current;
      scrollRef.current += (targetScrollRef.current - scrollRef.current) * 0.08;
      charXRef.current  += (charTargetRef.current  - charXRef.current)  * 0.10;

      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const camX = Math.round(scrollRef.current);

      if (isMario) {
        ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'white';
        [60,200,380,560,720,900,1100].forEach((cx, i) => {
          const ox = ((cx - camX * 0.3 + W * 2) % (W + 300)) - 100;
          const cy = 30 + (i % 3) * 20;
          ctx.fillRect(ox, cy+8, 32, 8); ctx.fillRect(ox+8, cy, 24, 8);
          ctx.fillRect(ox+8, cy+16, 24, 8); ctx.fillRect(ox+4, cy+4, 8, 16);
          ctx.fillRect(ox+28, cy+4, 8, 16);
        });
        const groundY = H - 32;
        for (let bx = (-camX % 32); bx < W + 32; bx += 32) {
          ctx.fillStyle = '#c8a96e'; ctx.fillRect(bx, groundY, 31, 31);
          ctx.fillStyle = '#8b5e3c';
          ctx.fillRect(bx, groundY, 31, 2); ctx.fillRect(bx, groundY, 2, 31);
          ctx.fillRect(bx+29, groundY, 2, 31); ctx.fillRect(bx+16, groundY+2, 1, 27);
          ctx.fillRect(bx, groundY+16, 31, 1);
        }
        ctx.fillStyle = '#92c849'; ctx.fillRect(0, groundY - 8, W, 8);
        ctx.fillStyle = '#5a9e2a'; ctx.fillRect(0, groundY - 4, W, 2);
      } else {
        const topicList = filterTopic
          ? topics.filter(t => t.topic === filterTopic) : topics;
        const probsPerTopic = filterTopic
          ? allProblems.length : Math.ceil(allProblems.length / Math.max(topics.length, 1));
        topicList.forEach((t, ti) => {
          const zx = ti * probsPerTopic * NODE_SPACING - camX;
          const zw = probsPerTopic * NODE_SPACING + NODE_SPACING;
          ctx.fillStyle = ZONE_BKGS_DARK[topics.indexOf(t) % ZONE_BKGS_DARK.length];
          ctx.fillRect(zx, 0, zw, H);
          ctx.font = '9px "Press Start 2P", monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.textAlign = 'left';
          ctx.fillText(t.topic.toUpperCase(), zx + 12, 18);
        });
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 50; i++) {
          const sx = ((i * 137 + camX * 0.08) % (W + 20)) - 10;
          const sy = (i * 61) % (H * 0.45);
          ctx.fillRect(sx, sy, i%4===0?2:1, i%4===0?2:1);
        }
        ctx.fillStyle = '#13112a'; ctx.fillRect(0, H - 28, W, 28);
        ctx.fillStyle = '#1a1830'; ctx.fillRect(0, H - 30, W, 4);
      }

      // Path
      if (nodes.length > 1) {
        ctx.beginPath();
        ctx.moveTo(nodes[0].x - camX, nodes[0].y);
        for (let i = 1; i < nodes.length; i++) {
          const cpx = (nodes[i-1].x + nodes[i].x) / 2 - camX;
          ctx.quadraticCurveTo(nodes[i-1].x - camX, nodes[i-1].y, cpx, (nodes[i-1].y + nodes[i].y) / 2);
        }
        ctx.lineTo(nodes[nodes.length-1].x - camX, nodes[nodes.length-1].y);
        ctx.strokeStyle = isMario ? '#8b5e3c' : '#2d2a45';
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();

        const solvedEnd = allProblems.findIndex(p => !p.solved);
        const endIdx    = solvedEnd === -1 ? nodes.length - 1 : solvedEnd - 1;
        if (endIdx >= 1) {
          ctx.beginPath();
          ctx.moveTo(nodes[0].x - camX, nodes[0].y);
          for (let i = 1; i <= endIdx; i++) {
            const cpx = (nodes[i-1].x + nodes[i].x) / 2 - camX;
            ctx.quadraticCurveTo(nodes[i-1].x-camX, nodes[i-1].y, cpx, (nodes[i-1].y+nodes[i].y)/2);
          }
          ctx.lineTo(nodes[endIdx].x - camX, nodes[endIdx].y);
          ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.stroke();
        }
      }

      nodes.forEach(({ x, y, problem, index }) => {
        drawNode(ctx, x - camX, y, problem, index === currentIdx, f, isMario);
      });

      const charNode = nodes[currentIdx];
      const charY    = charNode
        ? charNode.y - NODE_R - CHAR_H / 2 - 2
        : PATH_Y_BASE - NODE_R - CHAR_H / 2;
      drawChar(ctx, charXRef.current - camX, charY, f, isWalking, isMario);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, currentIdx, isWalking, topics, filterTopic, allProblems, isMario, canvasW]);

  if (topics.flatMap(t => t.problems).length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-700">
        <p className="pixel text-xs">Upload a CSV to populate the world</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* ── Controls row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <TopicDropdown topics={topics} activeTopic={filterTopic}
          onSelect={topic => { setFilterTopic(topic); setShowSidebar(topic !== null); }}/>

        <button onClick={() => setShowSidebar(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors
            ${showSidebar
              ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
              : 'bg-game-surface border border-game-border text-slate-500 hover:text-slate-300'}`}>
          {isMobile ? (showSidebar ? <X className="w-3.5 h-3.5"/> : <ChevronUp className="w-3.5 h-3.5"/>) : null}
          Problems
          {activeTopic && (
            <span className="bg-purple-500/30 text-purple-300 px-1.5 rounded-full text-xs">
              {activeTopic.total}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <span>{currentIdx + 1} / {nodes.length}</span>
          {currentProblem && (
            <span className={
              currentProblem.difficulty==='Easy'  ?'text-green-500':
              currentProblem.difficulty==='Medium'?'text-yellow-500':'text-red-500'
            }>{currentProblem.difficulty}</span>
          )}
        </div>

        <button onClick={() => walkTo(Math.max(0, currentIdx-1))} disabled={currentIdx===0}
          className="w-7 h-7 rounded-lg bg-game-surface border border-game-border text-slate-400
            hover:border-purple-500 hover:text-purple-400 disabled:opacity-20 disabled:cursor-not-allowed
            flex items-center justify-center transition-all text-sm">‹</button>
        <button onClick={() => walkTo(Math.min(nodes.length-1, currentIdx+1))} disabled={currentIdx>=nodes.length-1}
          className="w-7 h-7 rounded-lg bg-game-surface border border-game-border text-slate-400
            hover:border-purple-500 hover:text-purple-400 disabled:opacity-20 disabled:cursor-not-allowed
            flex items-center justify-center transition-all text-sm">›</button>
      </div>

      {/* ── Canvas + desktop sidebar ── */}
      <div className="flex gap-3 items-start">
        <div className="flex-1 relative min-w-0">
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={CANVAS_H}
            className="w-full rounded-xl border border-game-border cursor-pointer block"
            style={{ background: isMario ? '#5c94fc' : '#08061a', imageRendering:'pixelated',
              touchAction: 'none' }}
            onClick={handleClick}
            onTouchStart={handleTouch}
          />

          {currentProblem && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2
              flex items-center gap-2 px-3 py-1.5 text-xs
              bg-game-card/90 border border-game-border rounded-full backdrop-blur-sm whitespace-nowrap">
              <span className="text-slate-500 font-mono">{currentIdx+1}/{nodes.length}</span>
              <span className="text-white font-medium max-w-28 md:max-w-40 truncate">{currentProblem.title}</span>
              <span className={
                currentProblem.difficulty==='Easy'  ?'text-green-400':
                currentProblem.difficulty==='Medium'?'text-yellow-400':'text-red-400'
              }>{isMobile ? currentProblem.difficulty[0] : currentProblem.difficulty}</span>
              {currentProblem.solved
                ? <span className="text-green-400">✓</span>
                : <button onClick={() => onOpenProblem(currentProblem)}
                    className="px-2 py-0.5 rounded-md bg-purple-600/30 border border-purple-500/40
                      text-purple-300 hover:bg-purple-600/50 transition-colors">
                    {isMobile ? '▶' : 'Practice'}
                  </button>
              }
            </div>
          )}
        </div>

        {/* Desktop sidebar — hidden on mobile */}
        {showSidebar && activeTopic && !isMobile && (
          <ProblemSidebar
            topic={activeTopic}
            currentProblemId={currentProblem?.id}
            onNavigate={walkToProblem}
            onPractice={p => onOpenProblem(p)}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>

      {/* Mobile bottom sheet sidebar */}
      {showSidebar && activeTopic && isMobile && (
        <MobileProblemSheet
          topic={activeTopic}
          currentProblemId={currentProblem?.id}
          onNavigate={walkToProblem}
          onPractice={p => onOpenProblem(p)}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}