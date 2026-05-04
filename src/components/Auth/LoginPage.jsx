// frontend/src/components/Auth/LoginPage.jsx
// Three login options:
//   1. Google (OAuth)
//   2. Email + Password (Firebase, free unlimited)
//   3. Phone + OTP (Firebase Phone Auth, free 10/day)

import { useState, useRef, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth } from '../../firebase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, User, Phone, Eye, EyeOff,
         ArrowRight, Loader, CheckCircle, ChevronLeft,
         ChevronDown, Search } from 'lucide-react';

// ── Country codes ──────────────────────────────────────────────
const COUNTRIES = [
  { code: '+91',  flag: '🇮🇳', name: 'India',          short: 'IN' },
  { code: '+1',   flag: '🇺🇸', name: 'United States',   short: 'US' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom',  short: 'GB' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',       short: 'AU' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada',          short: 'CA' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany',         short: 'DE' },
  { code: '+33',  flag: '🇫🇷', name: 'France',          short: 'FR' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan',           short: 'JP' },
  { code: '+86',  flag: '🇨🇳', name: 'China',           short: 'CN' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil',          short: 'BR' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia',          short: 'RU' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea',     short: 'KR' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',       short: 'SG' },
  { code: '+971', flag: '🇦🇪', name: 'UAE',             short: 'AE' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa',    short: 'ZA' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria',         short: 'NG' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan',        short: 'PK' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh',      short: 'BD' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',       short: 'LK' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal',           short: 'NP' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia',        short: 'MY' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand',        short: 'TH' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia',       short: 'ID' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines',     short: 'PH' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt',           short: 'EG' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya',           short: 'KE' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico',          short: 'MX' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina',       short: 'AR' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain',           short: 'ES' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy',           short: 'IT' },
];

// ── Shared input component ─────────────────────────────────────
function Input({ icon: Icon, type='text', value, onChange, placeholder, right, autoFocus }) {
  return (
    <div className="relative flex items-center">
      {Icon && <Icon className="absolute left-3 w-4 h-4 text-slate-600 shrink-0"/>}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoFocus={autoFocus}
        className={`w-full py-3 text-sm bg-game-surface border border-game-border
          rounded-xl text-white placeholder-slate-700 outline-none
          focus:border-purple-500/60 transition-colors
          ${Icon ? 'pl-10' : 'pl-4'} ${right ? 'pr-10' : 'pr-4'}`}
      />
      {right}
    </div>
  );
}

// ── Country picker ─────────────────────────────────────────────
function CountryPicker({ selected, onSelect }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) || c.short.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-full px-3 py-3 bg-game-surface
          border border-game-border rounded-xl text-sm text-white
          hover:border-purple-500/40 transition-colors whitespace-nowrap">
        <span className="text-base">{selected.flag}</span>
        <span className="text-slate-400">{selected.code}</span>
        <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${open?'rotate-180':''}`}/>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 game-card w-64 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {/* Search */}
          <div className="p-2 border-b border-game-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-game-surface rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search country…" autoFocus
                className="flex-1 bg-transparent text-xs text-slate-300 outline-none
                  placeholder-slate-700"/>
            </div>
          </div>
          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((c, i) => (
              <button key={i} type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm
                  hover:bg-game-surface transition-colors text-left
                  ${selected.code === c.code && selected.short === c.short
                    ? 'bg-purple-500/10 text-purple-300' : 'text-slate-400'}`}>
                <span className="text-base shrink-0">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-slate-600 text-xs shrink-0">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Google button ──────────────────────────────────────────────
function GoogleButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl
        bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm
        border border-gray-200 transition-all duration-200
        disabled:opacity-50 hover:shadow-lg active:scale-[0.98]">
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

// ── Email + Password flow ──────────────────────────────────────
function EmailPasswordFlow({ onBack }) {
  const [step,      setStep]      = useState('choose'); // choose | signin | signup | reset | profile
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [resetSent, setResetSent] = useState(false);

  function firebaseError(e) {
    const map = {
      'auth/user-not-found':      'No account found with this email.',
      'auth/wrong-password':      'Incorrect password.',
      'auth/email-already-in-use':'An account already exists with this email.',
      'auth/weak-password':       'Password must be at least 6 characters.',
      'auth/invalid-email':       'Please enter a valid email address.',
      'auth/too-many-requests':   'Too many attempts. Please try again later.',
      'auth/invalid-credential':  'Incorrect email or password.',
    };
    return map[e.code] || e.message;
  }

  async function handleSignIn() {
    if (!email || !password) { setError('Enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(e) { setError(firebaseError(e)); }
    finally { setLoading(false); }
  }

  async function handleSignUp() {
    if (!name.trim())          { setError('Enter your name.'); return; }
    if (!email)                { setError('Enter your email.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch(e) { setError(firebaseError(e)); }
    finally { setLoading(false); }
  }

  async function handleReset() {
    if (!email) { setError('Enter your email first.'); return; }
    setLoading(true); setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch(e) { setError(firebaseError(e)); }
    finally { setLoading(false); }
  }

  const PwToggle = (
    <button type="button" onClick={() => setShowPw(s => !s)}
      className="absolute right-3 text-slate-600 hover:text-slate-300 transition-colors">
      {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
    </button>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-600
          hover:text-slate-300 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5"/> Back
      </button>

      {/* Choose sign in or sign up */}
      {step === 'choose' && (
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm text-center">Continue with Email</p>
          <button onClick={() => setStep('signin')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              bg-game-surface border border-game-border text-slate-300
              hover:border-purple-500/50 hover:text-white transition-all group">
            <span className="text-sm">Sign in to existing account</span>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors"/>
          </button>
          <button onClick={() => setStep('signup')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              bg-purple-600/15 border border-purple-500/30 text-purple-300
              hover:bg-purple-600/25 transition-all group">
            <span className="text-sm font-medium">Create new account</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>
      )}

      {/* Sign in */}
      {step === 'signin' && (
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm">Sign in</p>
          <Input icon={Mail} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="Email address" autoFocus/>
          <div className="relative">
            <Input icon={Lock} type={showPw?'text':'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Password" right={PwToggle}
              onKeyDown={e => e.key==='Enter' && handleSignIn()}/>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSignIn} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <button onClick={() => setStep('reset')}
            className="w-full text-xs text-slate-600 hover:text-purple-400 transition-colors text-center">
            Forgot password?
          </button>
        </div>
      )}

      {/* Sign up */}
      {step === 'signup' && (
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm">Create account</p>
          <Input icon={User} value={name} onChange={e => setName(e.target.value)}
            placeholder="Your full name" autoFocus/>
          <Input icon={Mail} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="Email address"/>
          <div className="relative">
            <Input icon={Lock} type={showPw?'text':'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)" right={PwToggle}/>
          </div>
          <Input icon={Lock} type={showPw?'text':'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Confirm password"
            onKeyDown={e => e.key==='Enter' && handleSignUp()}/>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSignUp} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>
      )}

      {/* Password reset */}
      {step === 'reset' && (
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm">Reset password</p>
          {resetSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-400"/>
              <p className="text-green-400 text-sm font-medium">Reset email sent!</p>
              <p className="text-slate-500 text-xs">
                Check your inbox for a password reset link from Firebase.
              </p>
              <button onClick={() => setStep('signin')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-xs">
                Enter your email and we'll send a reset link via Firebase (free, instant).
              </p>
              <Input icon={Mail} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address" autoFocus/>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={handleReset} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
                {loading ? <Loader className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Phone Auth flow ────────────────────────────────────────────
function PhoneFlow({ onBack }) {
  const [country,    setCountry]    = useState(COUNTRIES[0]); // India default
  const [phone,      setPhone]      = useState('');
  const [otp,        setOtp]        = useState('');
  const [step,       setStep]       = useState('phone'); // phone | otp
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [confirm,    setConfirm]    = useState(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // Setup invisible reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
    return () => {
      // Cleanup
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear?.();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  async function sendOTP() {
    const fullPhone = country.code + phone.replace(/\s/g, '');
    if (phone.length < 7) { setError('Enter a valid phone number.'); return; }
    setLoading(true); setError('');
    try {
      const verifier = window.recaptchaVerifier;
      const result   = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirm(result);
      setStep('otp');
    } catch(e) {
      console.error(e);
      setError(e.message?.includes('TOO_LONG') ? 'Phone number too long.'
        : e.message?.includes('INVALID') ? 'Invalid phone number format.'
        : e.message?.includes('quota') ? 'Daily SMS limit reached. Try email login.'
        : 'Failed to send OTP: ' + e.message);
      // Reset recaptcha on error
      window.recaptchaVerifier?.clear?.();
      window.recaptchaVerifier = null;
    } finally { setLoading(false); }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      await confirm.confirm(otp);
    } catch(e) {
      setError(e.code === 'auth/invalid-verification-code'
        ? 'Incorrect code. Please try again.'
        : 'Verification failed: ' + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-600
          hover:text-slate-300 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5"/> Back
      </button>

      {step === 'phone' && (
        <div className="space-y-3">
          <div>
            <p className="text-white font-semibold text-sm mb-1">Phone number</p>
            <p className="text-slate-600 text-xs">
              Firebase sends a free verification SMS. Limit: 10/day on free tier.
            </p>
          </div>

          <div className="flex gap-2">
            <CountryPicker selected={country} onSelect={setCountry}/>
            <div className="flex-1 relative flex items-center">
              <Phone className="absolute left-3 w-4 h-4 text-slate-600"/>
              <input
                type="tel" value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
                placeholder="Phone number" autoFocus
                className="w-full pl-10 pr-4 py-3 text-sm bg-game-surface border border-game-border
                  rounded-xl text-white placeholder-slate-700 outline-none
                  focus:border-purple-500/60 transition-colors"/>
            </div>
          </div>

          {/* Preview */}
          {phone && (
            <p className="text-xs text-slate-600 text-center">
              Sending to: <span className="text-slate-400">{country.code} {phone}</span>
            </p>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container" ref={recaptchaRef}/>

          <button onClick={sendOTP} disabled={loading || !phone}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <Phone className="w-4 h-4"/>}
            {loading ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Enter verification code</p>
            <p className="text-slate-500 text-xs mt-1">
              Sent to {country.flag} {country.code} {phone}
            </p>
          </div>

          <input
            type="text" inputMode="numeric" maxLength={6}
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
            onKeyDown={e => e.key === 'Enter' && verifyOTP()}
            placeholder="000000" autoFocus
            className="w-full px-4 py-4 text-2xl font-mono text-center tracking-[14px]
              bg-game-surface border border-game-border rounded-xl text-white
              placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors"/>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button onClick={verifyOTP} disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            {loading ? <Loader className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors text-center">
            Wrong number? Go back
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main LoginPage ─────────────────────────────────────────────
export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [view,         setView]         = useState('main'); // main | email | phone
  const [googleLoading,setGoogleLoading]= useState(false);
  const [googleError,  setGoogleError]  = useState('');

  async function handleGoogle() {
    setGoogleLoading(true); setGoogleError('');
    try { await loginWithGoogle(); }
    catch(e) { setGoogleError(e.message || 'Google sign-in failed.'); }
    finally { setGoogleLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.15) 0%,#0f0e17 60%)' }}>

      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_,i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width:i%7===0?2:1, height:i%7===0?2:1,
              left:`${(i*137)%100}%`, top:`${(i*71)%100}%`,
              opacity:0.08+(i%4)*0.08 }}/>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4
            bg-purple-600/30 border border-purple-500/40">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="pixel text-lg text-white mb-1">DSA Quest</h1>
          <p className="text-slate-500 text-sm">Level up your coding skills</p>
        </div>

        {/* Card */}
        <div className="game-card p-6" style={{ minHeight: 280 }}>
          {view === 'main' && (
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

              {/* Email */}
              <button onClick={() => setView('email')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-game-surface border border-game-border text-slate-300
                  hover:border-purple-500/50 hover:text-white transition-all group">
                <Mail className="w-4 h-4 text-purple-400"/>
                <span className="text-sm flex-1 text-left">Email & Password</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400
                  group-hover:translate-x-0.5 transition-all"/>
              </button>

              {/* Phone */}
              <button onClick={() => setView('phone')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-game-surface border border-game-border text-slate-300
                  hover:border-blue-500/50 hover:text-white transition-all group">
                <Phone className="w-4 h-4 text-blue-400"/>
                <span className="text-sm flex-1 text-left">Phone Number</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400
                  group-hover:translate-x-0.5 transition-all"/>
              </button>

              <p className="text-slate-700 text-xs text-center leading-relaxed pt-1">
                By signing in you agree to our terms. No spam, ever.
              </p>
            </div>
          )}

          {view === 'email' && <EmailPasswordFlow onBack={() => setView('main')}/>}
          {view === 'phone' && <PhoneFlow       onBack={() => setView('main')}/>}
        </div>
      </div>
    </div>
  );
}