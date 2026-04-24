// frontend/src/components/Auth/LoginPage.jsx
// Login with Google OR Email OTP

import { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, ArrowRight, RefreshCw, CheckCircle, Loader, ChevronLeft } from 'lucide-react';

import { API_URL } from '../../utils/config.js';
const API = API_URL;

// ── Google button ──────────────────────────────────────────────
function GoogleButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl
        bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm
        border border-gray-200 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:shadow-lg active:scale-[0.98]">
      {loading
        ? <Loader className="w-4 h-4 animate-spin text-gray-500"/>
        : <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
      }
      Continue with Google
    </button>
  );
}

// ── OTP flow ───────────────────────────────────────────────────
function OTPLogin({ onBack }) {
  const [step,    setStep]    = useState('email'); // email | code
  const [email,   setEmail]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCd,setResendCd]= useState(0);

  async function sendOTP() {
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(API + '/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setStep('code');
      setResendCd(60);
      const timer = setInterval(() => setResendCd(c => { if (c<=1) { clearInterval(timer); return 0; } return c-1; }), 1000);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function verifyOTP() {
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(API + '/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      // Sign into Firebase with custom token
      await signInWithCustomToken(auth, data.token);
      setSuccess(true);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div className="flex flex-col items-center gap-3 py-4">
      <CheckCircle className="w-10 h-10 text-green-400"/>
      <p className="text-white font-medium">Signed in!</p>
      <p className="text-slate-500 text-sm">Redirecting…</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-600
        hover:text-slate-300 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5"/> Back
      </button>

      {step === 'email' ? (
        <>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Email address</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && sendOTP()}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-4 py-3 text-sm bg-game-surface border border-game-border
                rounded-xl text-white placeholder-slate-700 outline-none
                focus:border-purple-500/60 transition-colors"/>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={sendOTP} disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
              text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white
              disabled:opacity-40 transition-colors">
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>}
            {loading ? 'Sending…' : 'Send Login Code'}
          </button>
        </>
      ) : (
        <>
          <div className="text-center py-2">
            <p className="text-slate-400 text-sm">Code sent to</p>
            <p className="text-white font-medium">{email}</p>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">6-digit code</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e => e.key==='Enter' && verifyOTP()}
              placeholder="000000"
              autoFocus
              className="w-full px-4 py-3 text-2xl font-mono text-center tracking-[12px]
                bg-game-surface border border-game-border rounded-xl text-white
                placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors"/>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button onClick={verifyOTP} disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
              text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white
              disabled:opacity-40 transition-all">
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div className="flex items-center justify-center gap-2">
            <button onClick={sendOTP} disabled={loading || resendCd > 0}
              className="flex items-center gap-1.5 text-xs text-slate-600
                hover:text-purple-400 disabled:opacity-40 transition-colors">
              <RefreshCw className="w-3 h-3"/>
              {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main LoginPage ─────────────────────────────────────────────
export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOTP,       setShowOTP]       = useState(false);
  const [googleError,   setGoogleError]   = useState('');

  async function handleGoogle() {
    setGoogleLoading(true); setGoogleError('');
    try { await loginWithGoogle(); }
    catch(e) { setGoogleError(e.message || 'Google sign-in failed.'); }
    finally { setGoogleLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, #0f0e17 60%)' }}>

      {/* Background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_,i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width:i%7===0?2:1, height:i%7===0?2:1,
              left:`${(i*137)%100}%`, top:`${(i*71)%100}%`,
              opacity:0.1+(i%4)*0.1 }}/>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40
              flex items-center justify-center">
              <span className="text-xl">🎮</span>
            </div>
          </div>
          <h1 className="pixel text-lg text-white mb-1">DSA Quest</h1>
          <p className="text-slate-500 text-sm">Level up your coding skills</p>
        </div>

        {/* Card */}
        <div className="game-card p-6">
          {showOTP ? (
            <OTPLogin onBack={() => setShowOTP(false)}/>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-white font-semibold text-base mb-1">Welcome back</h2>
                <p className="text-slate-600 text-xs">Choose how you'd like to sign in</p>
              </div>

              {/* Google */}
              <GoogleButton onClick={handleGoogle} loading={googleLoading}/>
              {googleError && <p className="text-red-400 text-xs text-center">{googleError}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-game-border"/>
                <span className="text-slate-700 text-xs">or</span>
                <div className="flex-1 h-px bg-game-border"/>
              </div>

              {/* Email OTP */}
              <button onClick={() => setShowOTP(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                  text-sm font-medium bg-game-surface border border-game-border
                  text-slate-300 hover:text-white hover:border-purple-500/50 transition-all">
                <Mail className="w-4 h-4 text-purple-400"/>
                Continue with Email
              </button>

              <p className="text-slate-700 text-xs text-center leading-relaxed">
                By signing in you agree to our terms of service.
                No spam, ever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}