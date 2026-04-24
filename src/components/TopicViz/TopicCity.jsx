// frontend/src/components/TopicViz/TopicCity.jsx
// Tower skyline + LeetCode-style problem list below

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CheckCircle, ExternalLink, Star, Filter,
         ChevronDown, ArrowUpDown, Code2 } from 'lucide-react';
import { useApp }   from '../../context/AppContext.jsx';
import { useTheme } from '../../themes/ThemeContext.jsx';

// ── Color palettes ─────────────────────────────────────────────
const PALETTES = [
  { wall:'#1a1a2e', face:'#16213e', window:'#e94560', glow:'#ff6b9d', roof:'#0f3460', crane:'#ffd700' },
  { wall:'#1e1b4b', face:'#312e81', window:'#818cf8', glow:'#a5b4fc', roof:'#1e1b4b', crane:'#ffd700' },
  { wall:'#064e3b', face:'#065f46', window:'#34d399', glow:'#6ee7b7', roof:'#022c22', crane:'#ffd700' },
  { wall:'#7c2d12', face:'#9a3412', window:'#fb923c', glow:'#fed7aa', roof:'#431407', crane:'#ffd700' },
  { wall:'#4a044e', face:'#701a75', window:'#e879f9', glow:'#f0abfc', roof:'#2e1065', crane:'#ffd700' },
  { wall:'#0c4a6e', face:'#075985', window:'#38bdf8', glow:'#7dd3fc', roof:'#082f49', crane:'#ffd700' },
  { wall:'#14532d', face:'#166534', window:'#4ade80', glow:'#86efac', roof:'#052e16', crane:'#ffd700' },
  { wall:'#450a0a', face:'#7f1d1d', window:'#f87171', glow:'#fca5a5', roof:'#300101', crane:'#ffd700' },
  { wall:'#1c1917', face:'#292524', window:'#d6d3d1', glow:'#fafaf9', roof:'#0c0a09', crane:'#ffd700' },
  { wall:'#042f2e', face:'#134e4a', window:'#2dd4bf', glow:'#99f6e4', roof:'#021d1c', crane:'#ffd700' },
];
function getPal(i) { return PALETTES[i % PALETTES.length]; }

// ── Canvas tower ───────────────────────────────────────────────
function TowerCanvas({ topic, paletteIdx, selected, animFrame, small }) {
  const canvasRef = useRef(null);
  const pal       = getPal(paletteIdx);
  const pct       = topic.percentage || 0;
  const W = small ? 52 : 72;
  const H = small ? 180 : 260;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const f    = animFrame;
    const tw   = small ? 36 : 50;
    const tx   = (W - tw) / 2;
    const sideW = small ? 10 : 14;
    const maxH  = small ? 130 : 190;
    const floorH = 14;
    const towerH  = Math.max(14, Math.round((pct/100)*maxH));
    const floorCnt = Math.max(1, Math.floor(towerH / floorH));
    const actualH  = floorCnt * floorH;
    const towerTop = H - 10 - actualH;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(W/2, H-8, tw/2+3, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // Side face
    const sg = ctx.createLinearGradient(tx+tw, towerTop, tx+tw+sideW, towerTop);
    sg.addColorStop(0, pal.face); sg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(tx+tw, towerTop);
    ctx.lineTo(tx+tw+sideW, towerTop-sideW*0.4);
    ctx.lineTo(tx+tw+sideW, H-10-sideW*0.4);
    ctx.lineTo(tx+tw, H-10);
    ctx.closePath(); ctx.fill();

    // Floors
    for (let fl = 0; fl < floorCnt; fl++) {
      const fy   = towerTop + fl * floorH;
      const isLit = fl < Math.round((pct/100)*floorCnt);
      ctx.fillStyle = isLit ? pal.face : pal.wall;
      ctx.fillRect(tx, fy, tw, floorH-1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(tx, fy+floorH-2, tw, 2);

      const winW=small?6:9, winH=6, winY=fy+3;
      const winXs = small ? [tx+5,tx+17] : [tx+5,tx+20,tx+35];
      winXs.forEach((wx,wi) => {
        const lit = isLit && !(fl===floorCnt-1 && Math.sin(f*0.05+wi)>0.5);
        if (lit) {
          ctx.shadowColor=pal.glow; ctx.shadowBlur=5;
          ctx.fillStyle=pal.window; ctx.fillRect(wx,winY,winW,winH);
          ctx.shadowBlur=0;
          ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fillRect(wx,winY,winW/2,1);
        } else {
          ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(wx,winY,winW,winH);
        }
      });
    }

    // Roof
    ctx.fillStyle=pal.roof; ctx.fillRect(tx, towerTop-5, tw, 5);
    ctx.fillStyle=pal.face;
    ctx.beginPath();
    ctx.moveTo(tx,towerTop-5); ctx.lineTo(tx+sideW,towerTop-5-sideW*0.4);
    ctx.lineTo(tx+tw+sideW,towerTop-5-sideW*0.4); ctx.lineTo(tx+tw,towerTop-5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.stroke();

    // 100% antenna
    if (pct===100) {
      ctx.strokeStyle=pal.window; ctx.lineWidth=2;
      ctx.shadowColor=pal.glow; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.moveTo(W/2,towerTop-5); ctx.lineTo(W/2,towerTop-22); ctx.stroke();
      if (Math.sin(f*0.08)>0) {
        ctx.fillStyle='#ff4444'; ctx.shadowColor='#ff4444'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(W/2,towerTop-22,2.5,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0;
    }

    // Crane
    if (pct<100) {
      const cx=tx+tw+sideW-2, cby=towerTop-5-sideW*0.4;
      ctx.strokeStyle=pal.crane; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(cx,cby); ctx.lineTo(cx,cby-32); ctx.stroke();
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx-14,cby-30); ctx.lineTo(cx+16,cby-30); ctx.stroke();
      ctx.fillStyle=pal.crane; ctx.fillRect(cx-16,cby-34,7,5);
      const swing=Math.sin(f*0.04)*4;
      const clen=10+Math.abs(Math.sin(f*0.03))*5;
      ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx+12+swing,cby-30); ctx.lineTo(cx+12+swing,cby-30+clen); ctx.stroke();
      ctx.fillStyle=pal.face; ctx.strokeStyle=pal.crane; ctx.lineWidth=1;
      ctx.fillRect(cx+8+swing,cby-30+clen,8,6); ctx.strokeRect(cx+8+swing,cby-30+clen,8,6);
    }

    // Selected outline
    if (selected) {
      ctx.shadowColor=pal.glow; ctx.shadowBlur=16;
      ctx.strokeStyle=pal.window; ctx.lineWidth=2;
      ctx.strokeRect(tx-2,towerTop-7,tw+4,actualH+7);
      ctx.shadowBlur=0;
    }

    // % label
    ctx.font=`bold ${small?7:9}px "Press Start 2P",monospace`;
    ctx.textAlign='center';
    ctx.fillStyle=pct===100?pal.glow:'#64748b';
    ctx.fillText(pct+'%', W/2, H-1);
  }, [pct, selected, animFrame, paletteIdx, small]);

  return <canvas ref={canvasRef} width={W} height={H}
    style={{ imageRendering:'pixelated', display:'block' }}/>;
}

// ── Difficulty pill ────────────────────────────────────────────
function DiffPill({ diff }) {
  const cls = diff==='Easy'  ? 'text-green-400'
            : diff==='Medium'? 'text-yellow-400'
            :                  'text-red-400';
  return <span className={`text-xs font-medium ${cls}`}>{diff}</span>;
}

// ── Main ───────────────────────────────────────────────────────
export default function TopicCity({ onPractice }) {
  const { topics }  = useApp();
  const { isMario } = useTheme();

  const [selectedTopic, setSelectedTopic] = useState(null); // topic name string
  const [search,        setSearch]        = useState('');
  const [diffFilter,    setDiffFilter]    = useState('All');
  const [statusFilter,  setStatusFilter]  = useState('All'); // All | Solved | Unsolved
  const [sortBy,        setSortBy]        = useState('default'); // default | difficulty | acceptance
  const [showFilter,    setShowFilter]    = useState(false);
  const [animFrame,     setAnimFrame]     = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAnimFrame(f => f+1), 60);
    return () => clearInterval(id);
  }, []);

  // Topic index lookup
  const topicIndexMap = useMemo(() => {
    const m = {};
    topics.forEach((t,i) => { m[t.topic] = i; });
    return m;
  }, [topics]);

  // All problems flat, with topic reference
  const allProblems = useMemo(() => {
    const base = selectedTopic
      ? (topics.find(t=>t.topic===selectedTopic)?.problems || [])
      : topics.flatMap(t => t.problems.map(p => ({ ...p, _topic: t.topic })));

    let result = base.map(p => ({ ...p, _topic: p._topic || selectedTopic }));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p._topic||'').toLowerCase().includes(q)
      );
    }

    // Difficulty filter
    if (diffFilter !== 'All') result = result.filter(p => p.difficulty === diffFilter);

    // Status filter
    if (statusFilter === 'Solved')   result = result.filter(p =>  p.solved);
    if (statusFilter === 'Unsolved') result = result.filter(p => !p.solved);

    // Sort
    const DIFF_ORDER = { Easy:0, Medium:1, Hard:2 };
    if (sortBy === 'difficulty') {
      result = [...result].sort((a,b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
    }

    return result;
  }, [topics, selectedTopic, search, diffFilter, statusFilter, sortBy]);

  const totalSolved = topics.reduce((a,t)=>a+t.solved,0);
  const totalAll    = topics.reduce((a,t)=>a+t.total,0);

  const skyBg = isMario
    ? 'linear-gradient(180deg,#2060e0 0%,#5C94FC 70%,#92c849 100%)'
    : 'linear-gradient(180deg,#050510 0%,#0f0e2a 60%,#1a1830 100%)';

  return (
    <div className="space-y-4">

      {/* ── Skyline strip ── */}
      <div className="relative rounded-2xl overflow-hidden border border-game-border"
        style={{ background: skyBg, height: 200 }}>

        {/* Stars / clouds */}
        {!isMario && [...Array(25)].map((_,i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width:i%5===0?2:1, height:i%5===0?2:1,
              left:`${(i*137)%100}%`, top:`${(i*61)%55}%`, opacity:0.25+(i%3)*0.15 }}/>
        ))}
        {isMario && [50,180,340,520,700,880].map((cx,i) => (
          <div key={i} className="absolute bg-white rounded-sm opacity-90"
            style={{ left:cx, top:15+(i%3)*12, width:36, height:8 }}/>
        ))}

        {/* Sun / Moon */}
        {isMario
          ? <div className="absolute top-2 right-6 w-10 h-10 rounded-full"
              style={{ background:'#ffd700', boxShadow:'0 0 20px #ffd70080' }}/>
          : <div className="absolute top-3 right-5 w-9 h-9 rounded-full"
              style={{ background:'#fef3c7', boxShadow:'0 0 18px #fef3c780' }}/>
        }

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-6"
          style={{ background: isMario?'#92c849':'#13112a' }}/>

        {/* Towers — horizontal scroll if many topics */}
        <div className="absolute bottom-6 left-0 right-0 flex items-end justify-around px-3 gap-1
          overflow-x-auto" style={{ height:185 }}>
          {topics.map((topic,i) => (
            <div key={topic.topic}
              className="flex flex-col items-center cursor-pointer shrink-0 group"
              onClick={() => setSelectedTopic(t => t===topic.topic ? null : topic.topic)}
              title={topic.topic + ' — ' + topic.percentage + '%'}>
              {/* Topic label — only show if selected or hovered */}
              <div className="text-center mb-0.5 transition-opacity duration-200
                opacity-0 group-hover:opacity-100"
                style={{ fontSize:6, fontFamily:'"Press Start 2P",monospace',
                  color:getPal(i).glow, maxWidth:52, lineHeight:1.3,
                  opacity: selectedTopic===topic.topic ? 1 : undefined }}>
                {topic.topic}
              </div>
              <div className={`transition-transform duration-200 hover:scale-110`}
                style={{ filter: selectedTopic===topic.topic
                  ? `drop-shadow(0 0 6px ${getPal(i).glow})` : 'none' }}>
                <TowerCanvas topic={topic} paletteIdx={i}
                  selected={selectedTopic===topic.topic}
                  animFrame={animFrame} small/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Topic pills (like LeetCode top nav) ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedTopic(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            whitespace-nowrap transition-all shrink-0 border
            ${!selectedTopic
              ? 'bg-white/10 border-white/20 text-white'
              : 'border-game-border text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
          All Topics
          <span className="text-slate-500 font-normal">{totalAll}</span>
        </button>
        {topics.map((t,i) => (
          <button key={t.topic}
            onClick={() => setSelectedTopic(x => x===t.topic ? null : t.topic)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              whitespace-nowrap transition-all shrink-0 border
              ${selectedTopic===t.topic
                ? 'border-opacity-60 text-white'
                : 'border-game-border text-slate-500 hover:text-slate-300'}`}
            style={selectedTopic===t.topic ? {
              background:   getPal(i).window + '22',
              borderColor:  getPal(i).window + '80',
              color:        getPal(i).glow,
            } : {}}>
            {t.topic}
            <span className="font-normal opacity-60">{t.total}</span>
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-game-surface border
          border-game-border rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search questions"
            className="flex-1 bg-transparent text-sm text-slate-300 outline-none placeholder-slate-700"/>
          {search && <button onClick={()=>setSearch('')} className="text-slate-600 hover:text-slate-400">
            <X className="w-3.5 h-3.5"/>
          </button>}
        </div>

        {/* Sort */}
        <button onClick={() => setSortBy(s => s==='default'?'difficulty':'default')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border
            bg-game-surface border-game-border text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowUpDown className="w-3.5 h-3.5"/>
          {sortBy==='difficulty' ? 'By Difficulty' : 'Default'}
        </button>

        {/* Filter */}
        <div className="relative">
          <button onClick={()=>setShowFilter(s=>!s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors
              ${showFilter||diffFilter!=='All'||statusFilter!=='All'
                ?'bg-purple-500/15 border-purple-500/40 text-purple-400'
                :'bg-game-surface border-game-border text-slate-500 hover:text-slate-300'}`}>
            <Filter className="w-3.5 h-3.5"/>
            Filter
            {(diffFilter!=='All'||statusFilter!=='All') && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"/>
            )}
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full mt-1 z-30 game-card p-3 space-y-3 w-48">
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Difficulty</p>
                <div className="flex flex-wrap gap-1">
                  {['All','Easy','Medium','Hard'].map(d => (
                    <button key={d} onClick={()=>setDiffFilter(d)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors
                        ${diffFilter===d
                          ? d==='Easy'  ?'bg-green-500/20 text-green-400 border border-green-500/30'
                          : d==='Medium'?'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : d==='Hard'  ?'bg-red-500/20 text-red-400 border border-red-500/30'
                          :              'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-game-surface border border-game-border text-slate-500 hover:text-slate-300'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Status</p>
                <div className="flex gap-1">
                  {['All','Solved','Unsolved'].map(s => (
                    <button key={s} onClick={()=>setStatusFilter(s)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors
                        ${statusFilter===s
                          ?'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          :'bg-game-surface border border-game-border text-slate-500 hover:text-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={()=>{setDiffFilter('All');setStatusFilter('All');setShowFilter(false);}}
                className="w-full text-xs text-slate-700 hover:text-slate-400 text-center pt-1">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Solved count */}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex items-center
            justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500 origin-bottom transition-all"
              style={{ height: (totalSolved/totalAll*100)+'%' }}/>
          </div>
          <span className="text-white font-medium">{totalSolved}</span>
          <span>/</span>
          <span>{totalAll}</span>
          <span>Solved</span>
        </div>
      </div>

      {/* ── Problem list table ── */}
      <div className="game-card overflow-hidden">
        {/* Table header */}
        <div className="grid gap-2 px-4 py-2.5 border-b border-game-border text-xs
          font-medium text-slate-600 uppercase tracking-wider"
          style={{ gridTemplateColumns: '2rem 1fr 7rem 5.5rem 4rem' }}>
          <span/>
          <span>Title</span>
          <span className="text-center">Topic</span>
          <span className="text-center">Difficulty</span>
          <span className="text-right">Status</span>
        </div>

        {/* Rows */}
        {allProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-500 text-sm mb-1">No problems found</p>
            <p className="text-slate-700 text-xs">Try a different search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-game-border">
            {allProblems.map((p, idx) => {
              const topicIdx = topicIndexMap[p._topic] ?? 0;
              const pal      = getPal(topicIdx);
              return (
                <div key={p.id || idx}
                  className={`grid gap-2 px-4 py-3 items-center transition-colors cursor-pointer
                    hover:bg-white/5 group
                    ${p.solved ? 'opacity-75' : ''}`}
                  style={{ gridTemplateColumns: '2rem 1fr 7rem 5.5rem 4rem' }}
                  onClick={() => onPractice(p)}>

                  {/* Status icon */}
                  <div className="flex items-center justify-center">
                    {p.solved
                      ? <CheckCircle className="w-4 h-4 text-green-400"/>
                      : <span className="w-4 h-4 rounded border border-game-border block"/>
                    }
                  </div>

                  {/* Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-sm truncate font-medium
                      ${p.solved ? 'text-slate-500 line-through' : 'text-white group-hover:text-purple-300'}
                      transition-colors`}>
                      {p.number ? `${p.number}. ` : ''}{p.title}
                    </span>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer"
                        onClick={e=>e.stopPropagation()}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-600
                          hover:text-blue-400 transition-all">
                        <ExternalLink className="w-3 h-3"/>
                      </a>
                    )}
                    <Code2 className="w-3 h-3 text-slate-700 shrink-0 opacity-0
                      group-hover:opacity-100 transition-opacity ml-auto"/>
                  </div>

                  {/* Topic badge */}
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium truncate max-w-full"
                      style={{
                        background:  pal.window + '18',
                        color:       pal.glow,
                        border:      `1px solid ${pal.window}35`,
                      }}>
                      {p._topic || p.topic}
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex justify-center">
                    <DiffPill diff={p.difficulty}/>
                  </div>

                  {/* Solved status text */}
                  <div className="text-right">
                    {p.solved
                      ? <span className="text-xs text-green-400">Solved</span>
                      : <span className="text-xs text-slate-700">—</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-game-border flex items-center
          justify-between text-xs text-slate-700">
          <span>Showing {allProblems.length} problem{allProblems.length!==1?'s':''}</span>
          {(search||diffFilter!=='All'||statusFilter!=='All'||selectedTopic) && (
            <button onClick={() => {
              setSearch(''); setDiffFilter('All'); setStatusFilter('All'); setSelectedTopic(null);
            }} className="text-purple-500 hover:text-purple-400 transition-colors">
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// function DiffPill({ diff }) {
//   const cls = diff==='Easy'  ?'text-green-400'
//             : diff==='Medium'?'text-yellow-400'
//             :                  'text-red-400';
//   return <span className={`text-sm font-medium ${cls}`}>{diff}</span>;
// }