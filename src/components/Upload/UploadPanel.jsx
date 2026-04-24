// frontend/src/components/Upload/UploadPanel.jsx
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadFile } from '../../utils/api.js';
import { useApp } from '../../context/AppContext.jsx';
import WelcomeScreen from './WelcomeScreen.jsx';

const SAMPLE_CSV = `title,topic,difficulty,solved
Two Sum,Arrays,Easy,true
Best Time to Buy and Sell Stock,Arrays,Easy,false
Longest Substring Without Repeating Characters,Sliding Window,Medium,false
Valid Parentheses,Stacks,Easy,true
Merge Intervals,Arrays,Medium,false
Binary Tree Inorder Traversal,Trees,Easy,false
Climbing Stairs,Dynamic Programming,Easy,false
Coin Change,Dynamic Programming,Medium,false
Number of Islands,Graphs,Medium,false
Linked List Cycle,Linked Lists,Easy,true
Valid Anagram,Strings,Easy,false
Binary Search,Binary Search,Easy,false
House Robber,Dynamic Programming,Medium,false
Word Ladder,Graphs,Hard,false
Merge K Sorted Lists,Heaps,Hard,false
Kth Largest Element in an Array,Heaps,Medium,false
Group Anagrams,Hashing,Medium,false
Jump Game,Greedy,Medium,false
`;

export default function UploadPanel({ onComplete }) {
  const { loadData, showToast, topics } = useApp();
  const [dragActive, setDragActive]  = useState(false);
  const [phase,      setPhase]        = useState('idle');
  const [progress,   setProgress]     = useState(0);
  const [stats,      setStats]        = useState(null);
  const [fileName,   setFileName]     = useState('');
  const [error,      setError]        = useState('');
  const [showWelcome,setShowWelcome]  = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setPhase('uploading');
    setProgress(0);
    setError('');
    setFileName(file.name);

    try {
      const data = await uploadFile(file, setProgress);
      loadData(data.topics, file.name);
      setStats(data.stats);
      setPhase('success');
      showToast(`Loaded ${data.stats.totalProblems} problems across ${data.stats.totalTopics} topics!`);
      // Show welcome screen after a beat
      setTimeout(() => setShowWelcome(true), 600);
    } catch (err) {
      setPhase('error');
      setError(err.message);
    }
  }, [loadData, showToast]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'sample_dsa_problems.csv';
    a.click();
  };

  // Show welcome screen after successful upload
  if (showWelcome && stats) {
    return (
      <WelcomeScreen
        stats={stats}
        fileName={fileName}
        onStart={() => { setShowWelcome(false); onComplete?.(); }}
      />
    );
  }

  // Already has data — show a simpler re-upload UI
  const hasExisting = topics.length > 0;

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="pixel text-lg text-purple-400 mb-2">DSA Quest</h1>
        <p className="text-slate-400 text-sm">
          {hasExisting ? 'Re-upload to replace your current problem list' : 'Upload your problem list to begin'}
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => phase === 'idle' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200
          ${phase === 'idle' ? 'cursor-pointer' : ''}
          ${dragActive          ? 'border-purple-500 bg-purple-500/10'
          : phase === 'success' ? 'border-green-500 bg-green-500/10'
          : phase === 'error'   ? 'border-red-500 bg-red-500/10'
          : 'border-game-border bg-game-surface hover:border-purple-500/50'}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />

        {phase === 'idle' && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Upload className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-white font-medium mb-1">Drop your file here</p>
            <p className="text-slate-500 text-sm">CSV or Excel · max 10 MB</p>
          </>
        )}

        {phase === 'uploading' && (
          <>
            <Loader className="w-10 h-10 mx-auto mb-4 text-purple-400 animate-spin" />
            <p className="text-white font-medium mb-3">Parsing problems…</p>
            <div className="w-40 mx-auto bg-game-border rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}

        {phase === 'success' && stats && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p className="pixel text-xs text-green-400 mb-4">Done!</p>
            <div className="flex justify-center gap-8">
              {[
                { label: 'Problems', value: stats.totalProblems, color: 'text-white' },
                { label: 'Topics',   value: stats.totalTopics,   color: 'text-purple-400' },
                { label: 'Solved',   value: stats.alreadySolved, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-red-400 font-medium mb-1">Upload failed</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button
              onClick={e => { e.stopPropagation(); setPhase('idle'); }}
              className="px-4 py-2 text-sm bg-game-card border border-game-border rounded-lg text-slate-300 hover:border-purple-500 transition-colors"
            >
              Try again
            </button>
          </>
        )}
      </div>

      {/* Column reference */}
      <div className="mt-5 game-card p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Accepted column names</p>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {[
            { field: 'Title *',    names: 'title, problem, question, name' },
            { field: 'Topic',      names: 'topic, category, tag, section' },
            { field: 'Difficulty', names: 'difficulty, level' },
            { field: 'Solved',     names: 'solved, status, done' },
          ].map(row => (
            <div key={row.field} className="bg-game-surface rounded-lg p-2">
              <p className="text-purple-400 mb-0.5">{row.field}</p>
              <p className="text-slate-600">{row.names}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2">* Required. All other columns are optional.</p>
      </div>

      <div className="mt-4 text-center">
        <button onClick={downloadSample}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-purple-400 transition-colors">
          <FileText className="w-4 h-4" />
          Download sample CSV (18 problems)
        </button>
      </div>
    </div>
  );
}