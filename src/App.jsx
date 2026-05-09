// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { Map, BarChart3, Code2, Gamepad, Settings,
         LogOut, Loader, Folder, Upload, Users, User, Crown } from 'lucide-react';
import { AuthProvider, useAuth }   from './context/AuthContext.jsx';
import { AppProvider, useApp }     from './context/AppContext.jsx';
import { ThemeProvider, useTheme } from './themes/ThemeContext.jsx';
import { PremiumProvider, usePremium } from './context/PremiumContext.jsx';
import LoginPage      from './components/Auth/LoginPage.jsx';
import AdminPanel     from './components/Admin/AdminPanel.jsx';
import TopicCity      from './components/TopicViz/TopicCity.jsx';
import Dashboard      from './components/Dashboard/Dashboard.jsx';
import EditorView     from './components/Editor/EditorView.jsx';
import GameWorld      from './components/Game/GameWorld.jsx';
import XpBar          from './components/Game/XpBar.jsx';
import LevelComplete  from './components/Game/LevelComplete.jsx';
import SettingsPanel  from './components/Settings/SettingsPanel.jsx';
import CommunityFeed  from './components/Community/CommunityFeed.jsx';
import ProfilePage    from './components/Profile/ProfilePage.jsx';
import PremiumPage    from './components/Premium/PremiumPage.jsx';
import AIToggle       from './components/AI/AIToggle.jsx';
import ThemeToggle    from './components/Mario/ThemeToggle.jsx';
import MarioBackground from './components/Mario/MarioBackground.jsx';
import ReviewPopup     from './components/Review/ReviewPopup.jsx';
import NotFoundPage    from './components/NotFound/NotFoundPage.jsx';
import { uploadFile } from './utils/api.js';
import './index.css';

// ── URL ↔ Tab mapping ──────────────────────────────────────────
const TAB_ROUTES = {
  '/':          'world',
  '/world':     'world',
  '/city':      'city',
  '/practice':  'practice',
  '/community': 'community',
  '/stats':     'dashboard',
  '/profile':   'profile',
  '/premium':   'premium',
};
const TAB_URLS = {
  world:     '/world',
  city:      '/city',
  practice:  '/practice',
  community: '/community',
  dashboard: '/stats',
  profile:   '/profile',
  premium:   '/premium',
};

const KNOWN_PATHS = new Set(Object.keys(TAB_ROUTES));

function getTabFromPath(path) {
  return TAB_ROUTES[path] || null; // null = 404
}
function getUrlFromTab(tab) {
  return TAB_URLS[tab] || '/world';
}

// ── Toast ──────────────────────────────────────────────────────
function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-40 px-4 py-3 rounded-xl text-sm font-medium
      ${toast.type === 'error'
        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
        : 'bg-green-500/20 border border-green-500/40 text-green-300'}`}>
      {toast.message}
    </div>
  );
}

// ── CSV import button ──────────────────────────────────────────
function CsvImportButton() {
  const { saveList, showToast } = useApp();
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (!name.trim()) { showToast('Give your list a name first.', 'error'); return; }
    setLoading(true);
    try {
      const data     = await uploadFile(file);
      const problems = data.topics.flatMap(t => t.problems);
      await saveList(name.trim(), problems);
      showToast(`"${name.trim()}" saved — ${problems.length} problems.`);
      setOpen(false); setName('');
    } catch(e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} title="Import a custom CSV problem list"
      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-game-surface transition-colors">
      <Folder className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex items-center gap-2 bg-game-card border border-game-border rounded-xl px-3 py-1.5">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="List name…"
        className="text-xs bg-transparent text-slate-300 placeholder-slate-700 outline-none w-24" />
      <button onClick={() => fileRef.current?.click()} disabled={loading}
        className="text-purple-400 hover:text-purple-300 transition-colors">
        {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      </button>
      <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

// ── User dropdown ──────────────────────────────────────────────
function UserMenu() {
  const { user, userProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = (userProfile?.displayName || user?.email || '?')[0].toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1 rounded-lg hover:bg-game-surface transition-colors">
        {userProfile?.photoURL
          ? <img src={userProfile.photoURL} alt="" className="w-6 h-6 rounded-full" />
          : <div className="w-6 h-6 rounded-full bg-purple-600/40 border border-purple-500/40
              flex items-center justify-center">
              <span className="text-purple-300 font-bold" style={{ fontSize: '10px' }}>{initials}</span>
            </div>
        }
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 game-card w-48 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-game-border">
              <p className="text-xs font-medium text-white truncate">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
            </div>
            <button onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs
                text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────
function Nav({ tab, onTabChange, onSettings, onProfile }) {
  const { summary, progression, topics } = useApp();
  const { isMario } = useTheme();
  const { premium: isPremium, daysRemaining } = usePremium();
  const hasData = topics.length > 0;

  const items = [
    { id: 'world',     label: 'World',     icon: Gamepad,  always: false },
    { id: 'city',      label: 'City',      icon: Map,      always: false },
    { id: 'practice',  label: 'Practice',  icon: Code2,    always: false },
    { id: 'community', label: 'Community', icon: Users,    always: true  },
    { id: 'dashboard', label: 'Stats',     icon: BarChart3,always: false },
    { id: 'premium',   label: 'Premium',   icon: Crown,    always: true  },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-game-border px-3 py-2 flex items-center gap-2"
      style={{ background: isMario ? '#c84b0c' : '#0f0e17',
               borderBottom: isMario ? '4px solid #8b2e00' : undefined,
               boxShadow: isMario ? '0 4px 0 #5a1a00' : undefined }}>
      <div className="flex items-center gap-1.5 shrink-0 mr-1">
        <span className="pixel text-xs" style={{ color: isMario ? '#fbd000' : '#a78bfa' }}>DSA</span>
        <span className="pixel text-xs text-white">Quest</span>
      </div>

      <nav className="flex items-center gap-1">
        {items.map(({ id, label, icon: Icon, always }) => {
          const disabled = !always && !hasData;
          const active   = tab === id;
          return (
            <button key={id} onClick={() => !disabled && onTabChange(id)} disabled={disabled}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all
                ${active
                  ? isMario
                    ? 'bg-yellow-400/30 text-yellow-200 border border-yellow-400/50'
                    : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : disabled
                  ? 'text-slate-700 cursor-not-allowed'
                  : isMario
                  ? 'text-orange-100 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-game-surface'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {hasData && progression && <XpBar progression={progression} />}

      {summary?.totalProblems > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1
          bg-green-500/10 border border-green-500/20 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs">{summary.overallPct}%</span>
        </div>
      )}

      {isPremium && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1
          bg-purple-500/15 border border-purple-500/30 rounded-full shrink-0">
          <Crown className="w-3 h-3 text-purple-400"/>
          <span className="text-purple-400 text-xs font-medium">
            {daysRemaining() !== null ? daysRemaining() + 'd' : '∞'}
          </span>
        </div>
      )}
      <CsvImportButton />
      <ThemeToggle />
      <AIToggle />

      <button onClick={onSettings} title="Settings (⌘K)"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-game-surface transition-colors">
        <Settings className="w-4 h-4" />
      </button>
      <button onClick={onProfile} title="My Profile"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-game-surface transition-colors">
        <User className="w-4 h-4" />
      </button>
      <UserMenu />
    </header>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30
        flex items-center justify-center mb-4">
        <span className="text-2xl">🏗️</span>
      </div>
      <p className="text-slate-400 font-medium mb-1">No problems loaded yet</p>
      <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
        Ask an admin to seed the problem bank, or go to{' '}
        <code className="text-purple-400">/admin</code> if you are the admin.
      </p>
    </div>
  );
}

// ── App shell ──────────────────────────────────────────────────
function AppInner() {
  const { topics, openProblem, levelCompleteEvent, dismissLevelComplete, dataLoading } = useApp();
  const { isAdmin } = useAuth();
  const { isMario } = useTheme();
  const hasData = topics.length > 0;

  const initialTab = getTabFromPath(window.location.pathname);
  const [tab,          setTab]          = useState(initialTab);
  const [showSettings, setShowSettings] = useState(false);

  // null tab = unknown path = show 404
  const is404 = tab === null;

  function onTabChange(newTab) {
    const url = getUrlFromTab(newTab);
    window.history.pushState({ tab: newTab }, '', url);
    setTab(newTab);
  }

  useEffect(() => {
    function onPop(e) {
      const newTab = e.state?.tab ?? getTabFromPath(window.location.pathname);
      setTab(newTab);
    }
    window.addEventListener('popstate', onPop);
    window.history.replaceState(
      { tab: initialTab },
      '',
      window.location.pathname
    );
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handlePractice = (problem) => {
    openProblem(problem);
    onTabChange('practice');
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSettings(s => !s); }
      if (e.key === 'Escape') setShowSettings(false);
    };
    const openPremium = () => onTabChange('premium');
    window.addEventListener('keydown', handler);
    window.addEventListener('open-premium', openPremium);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('open-premium', openPremium);
    };
  }, []);

  if (dataLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0e17' }}>
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading your problems…</p>
      </div>
    </div>
  );

  // ── 404 ──────────────────────────────────────────────────────
  if (is404) return (
    <NotFoundPage onGoHome={() => onTabChange('world')} />
  );

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: isMario ? 'transparent' : '#0f0e17', position: 'relative', zIndex: 1 }}>
      <Nav tab={tab} onTabChange={onTabChange}
        onSettings={() => setShowSettings(true)}
        onProfile={() => onTabChange('profile')} />

      <main className={`flex-1 ${tab === 'practice' ? '' : 'p-4 sm:p-5 max-w-5xl mx-auto w-full'}`}>
        {tab === 'world' && (
          <div className="animate-slide-up space-y-4">
            <div>
              <h2 className="pixel text-sm text-purple-400">World Map</h2>
              <p className="text-slate-500 text-xs mt-1">Click a node · use topic dropdown · Practice to open editor</p>
            </div>
            {hasData ? <GameWorld onOpenProblem={handlePractice} /> : <EmptyState />}
          </div>
        )}
        {tab === 'city' && (
          <div className="animate-slide-up">
            <div className="mb-4">
              <h2 className="pixel text-sm text-purple-400">Topic City</h2>
              <p className="text-slate-500 text-xs mt-1">Tower height = completion · Click to expand problems</p>
            </div>
            {hasData ? <TopicCity onPractice={handlePractice} /> : <EmptyState />}
          </div>
        )}
        {tab === 'practice' && (
          <div className="h-[calc(100vh-48px)] p-3">
            <EditorView />
          </div>
        )}
        {tab === 'community' && (
          <div className="animate-slide-up">
            <CommunityFeed isAdmin={isAdmin} />
          </div>
        )}
        {tab === 'profile' && (
          <div className="animate-slide-up">
            <ProfilePage />
          </div>
        )}
        {tab === 'premium' && (
          <div className="animate-slide-up">
            <PremiumPage onClose={() => onTabChange('dashboard')} />
          </div>
        )}
        {tab === 'dashboard' && (
          <div className="animate-slide-up">
            <div className="mb-5">
              <h2 className="pixel text-sm text-blue-400">Stats</h2>
              <p className="text-slate-500 text-xs mt-1">Your progress across all topics</p>
            </div>
            <Dashboard onPractice={handlePractice} />
          </div>
        )}
      </main>

      {levelCompleteEvent && (
        <LevelComplete
          problem={levelCompleteEvent.problem}
          xpGained={levelCompleteEvent.xpGained}
          leveledUp={levelCompleteEvent.leveledUp}
          newLevel={levelCompleteEvent.newLevel}
          streakBonus={levelCompleteEvent.streakBonus}
          onDismiss={dismissLevelComplete}
        />
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <ReviewPopup
        onPractice={handlePractice}
        onDismissAll={() => {}}
      />
      <Toast />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
function Root() {
  const { user, isAdmin, authLoading } = useAuth();

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0e17' }}>
      <Loader className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  if (!user) return <LoginPage />;
  if (isAdmin && window.location.pathname === '/admin') return <AdminPanel />;

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

// ── App entry ──────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <MarioBackground />
      <AuthProvider>
        <PremiumProvider>
          <Root />
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}