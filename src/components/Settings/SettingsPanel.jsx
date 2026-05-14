// frontend/src/components/Settings/SettingsPanel.jsx

import { useState } from 'react';
import { X, Download, Trash2, AlertTriangle, Lock, Eye, EyeOff,
         CheckCircle, Loader, Info } from 'lucide-react';
import { useApp }  from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../../firebase.js';

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
  { keys: '⌘ ↵', action: 'Run code' },
  { keys: '⌘ R', action: 'Reset editor' },
  { keys: '⌘ K', action: 'Open settings' },
];

const LANG_REQ = [
  { lang: 'Python 3', req: 'python3 in PATH',  note: 'Usually pre-installed' },
  { lang: 'C++ 17',   req: 'g++ in PATH',      note: 'Windows: install MinGW-w64' },
  { lang: 'Java',     req: 'javac + java',      note: 'Install JDK from adoptium.net' },
];

// ── Password input ─────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        className="w-full bg-game-surface border border-game-border rounded-lg px-3 py-2
          text-sm text-slate-300 placeholder-slate-700 outline-none pr-9
          focus:border-purple-500/60 transition-colors disabled:opacity-50"
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── Change password ────────────────────────────────────────────
function ChangePasswordSection() {
  const { user } = useAuth();
  const [open,      setOpen]      = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password');

  function reset() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setError(''); setSuccess(false);
  }

  function handleCancel() { setOpen(false); reset(); }

  async function handleSubmit() {
    setError('');

    // ── Client-side validation first ───────────────────────────
    if (!currentPw)          { setError('Enter your current password.'); return; }
    if (newPw.length < 8)    { setError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return; }
    if (newPw === currentPw) { setError('New password must be different from your current password.'); return; }

    setLoading(true);

    try {
      // ── Step 1: Re-authenticate with current password ──────────
      // Must use auth.currentUser (live reference) not the user from context
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);

      try {
        await reauthenticateWithCredential(currentUser, credential);
      } catch(reauthError) {
        // Reauth failed — current password is wrong. Stop here, do NOT update password.
        console.error('[ChangePassword] Reauth failed:', reauthError.code);
        if (reauthError.code === 'auth/wrong-password' ||
            reauthError.code === 'auth/invalid-credential' ||
            reauthError.code === 'auth/invalid-login-credentials') {
          setError('Current password is incorrect. Please try again.');
        } else if (reauthError.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please wait a few minutes before trying again.');
        } else {
          setError('Could not verify your current password: ' + reauthError.message);
        }
        setLoading(false);
        return; // ← critical: exit here, never reach updatePassword
      }

      // ── Step 2: Reauth succeeded — now update password ─────────
      try {
        await updatePassword(currentUser, newPw);
        setSuccess(true);
        reset();
        setTimeout(() => { setOpen(false); setSuccess(false); }, 2500);
      } catch(updateError) {
        console.error('[ChangePassword] Update failed:', updateError.code);
        if (updateError.code === 'auth/weak-password') {
          setError('Password is too weak. Use at least 8 characters with a mix of letters and numbers.');
        } else if (updateError.code === 'auth/requires-recent-login') {
          // Shouldn't happen since we just re-authed, but handle it gracefully
          setError('Session expired during update. Please sign out and sign in again.');
        } else {
          setError('Failed to update password: ' + updateError.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Non-email users
  if (!isEmailUser) {
    const provider = user?.providerData?.[0]?.providerId;
    const name = provider === 'google.com' ? 'Google'
               : provider === 'phone'      ? 'Phone'
               : 'your login provider';
    return (
      <div className="game-card px-3 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          You signed in with <span className="text-slate-400">{name}</span>. Password management
          is handled by {name} — there's no password to change here.
        </p>
      </div>
    );
  }

  if (success) return (
    <div className="game-card px-3 py-3 flex items-center gap-2.5">
      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
      <p className="text-sm text-green-400">Password changed successfully!</p>
    </div>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full
        bg-game-surface border border-game-border text-slate-400
        hover:border-purple-500/50 hover:text-purple-300 transition-colors">
      <Lock className="w-3.5 h-3.5" />
      Change password
    </button>
  );

  return (
    <div className="game-card p-3 space-y-2.5">
      <p className="text-xs text-slate-500 font-medium">Change Password</p>

      <PasswordInput
        value={currentPw}
        onChange={e => setCurrentPw(e.target.value)}
        placeholder="Current password"
        disabled={loading}
      />
      <PasswordInput
        value={newPw}
        onChange={e => setNewPw(e.target.value)}
        placeholder="New password (min 8 chars)"
        disabled={loading}
      />
      <PasswordInput
        value={confirmPw}
        onChange={e => setConfirmPw(e.target.value)}
        placeholder="Confirm new password"
        disabled={loading}
      />

      {/* Password strength hint */}
      {newPw.length > 0 && newPw.length < 8 && (
        <p className="text-xs text-yellow-600">
          {8 - newPw.length} more character{8 - newPw.length !== 1 ? 's' : ''} needed
        </p>
      )}

      {/* Match indicator */}
      {newPw.length >= 8 && confirmPw.length > 0 && (
        <p className={`text-xs ${newPw === confirmPw ? 'text-green-500' : 'text-red-400'}`}>
          {newPw === confirmPw ? '✓ Passwords match' : '✗ Passwords do not match'}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={loading || newPw.length < 8 || newPw !== confirmPw || !currentPw}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading
            ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Verifying…</>
            : <><Lock className="w-3.5 h-3.5" /> Update password</>
          }
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs text-slate-500
            hover:text-slate-300 border border-game-border hover:border-slate-600 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
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
    if (topics.length === 0) { showToast('No data to export yet.', 'error'); return; }
    exportProgress();
    showToast('Exported dsa-quest-progress.csv');
  }

  function openLegal(tab) {
    onClose();
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-' + tab)), 150);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="relative h-full w-80 bg-game-card border-l border-game-border overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-game-border sticky top-0 bg-game-card z-10">
          <p className="pixel text-xs text-purple-400">Settings</p>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">

          {/* Account */}
          <Section title="Account">
            <ChangePasswordSection />
          </Section>

          {/* Progress */}
          <Section title="Progress">
            <div className="game-card p-3 mb-3 flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{summary.totalSolved}</p>
                <p className="text-xs text-slate-600">Solved</p>
              </div>
              <div className="flex-1 h-2 bg-game-surface rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${summary.overallPct}%` }} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-400">{summary.totalProblems}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>

            <Row label="Export progress" sub="Downloads a CSV of all problems + solved status + notes">
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  bg-game-surface border border-game-border text-slate-300
                  hover:border-purple-500 hover:text-purple-300 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </Row>

            <Row label="Reset all progress"
              sub={confirmReset ? 'Click again to confirm — this cannot be undone' : 'Clears solved status, notes, and XP'}>
              <button onClick={handleReset}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors
                  ${confirmReset
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500'
                    : 'bg-game-surface border border-game-border text-slate-400 hover:border-red-500 hover:text-red-400'}`}>
                {confirmReset
                  ? <><AlertTriangle className="w-3.5 h-3.5" /> Confirm</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Reset</>}
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
              <p className="text-slate-700">Progress is saved automatically in Firestore.</p>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-game-border">
              <button onClick={() => openLegal('terms')}
                className="text-xs text-slate-600 hover:text-purple-400 transition-colors underline underline-offset-2">
                Terms of Service
              </button>
              <span className="text-slate-700">·</span>
              <button onClick={() => openLegal('privacy')}
                className="text-xs text-slate-600 hover:text-purple-400 transition-colors underline underline-offset-2">
                Privacy Policy
              </button>
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