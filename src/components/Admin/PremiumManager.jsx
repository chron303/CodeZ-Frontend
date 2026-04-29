// frontend/src/components/Admin/PremiumManager.jsx
// Admin tool to grant/revoke/extend premium + view payment history

import { useState, useEffect } from 'react';
import { Crown, Search, Check, X, Plus, Loader, Calendar,
         CreditCard, User, RefreshCw } from 'lucide-react';
import { db } from '../../firebase.js';
import {
  collection, query, where, getDocs, doc,
  setDoc, updateDoc, serverTimestamp, Timestamp, orderBy, limit,
} from 'firebase/firestore';

const PLANS = [
  { id: 'monthly', label: '1 Month',  days: 30  },
  { id: 'yearly',  label: '1 Year',   days: 365 },
  { id: 'custom',  label: 'Custom',   days: 0   },
];

function timeAgo(date) {
  if (!date) return '—';
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

function formatDate(date) {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export default function PremiumManager() {
  const [search,    setSearch]    = useState('');
  const [users,     setUsers]     = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState('grant'); // grant | history
  const [saving,    setSaving]    = useState('');
  const [toast,     setToast]     = useState('');

  // Grant form
  const [uid,       setUid]       = useState('');
  const [email,     setEmail]     = useState('');
  const [plan,      setPlan]      = useState('monthly');
  const [customDays,setCustomDays]= useState(30);
  const [note,      setNote]      = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Load payment history
  async function loadHistory() {
    setLoading(true);
    try {
      const q    = query(collection(db, 'users'),
        where('premium', '==', true), limit(50));
      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { showToast('Error: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  // Search user by email
  async function searchUser() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const q    = query(collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) { showToast('No user found with that email.'); setLoading(false); return; }
      const d = snap.docs[0];
      setUid(d.id);
      showToast('User found: ' + d.id.slice(0,8) + '...');
    } catch(e) { showToast('Error: ' + e.message); }
    finally { setLoading(false); }
  }

  // Grant premium
  async function grantPremium() {
    if (!uid.trim()) { showToast('Enter a UID or find user by email first.'); return; }
    setSaving('grant');
    try {
      const days    = plan === 'custom' ? customDays : PLANS.find(p=>p.id===plan)?.days || 30;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await setDoc(doc(db, 'users', uid.trim()), {
        premium:             true,
        premiumPlan:         plan,
        premiumExpiresAt:    Timestamp.fromDate(expires),
        premiumActivatedAt:  serverTimestamp(),
        premiumGrantedBy:    'admin',
        premiumNote:         note || 'Manually granted by admin',
        lastUpdated:         serverTimestamp(),
      }, { merge: true });

      showToast(`Premium granted until ${formatDate(expires)}`);
      setUid(''); setEmail(''); setNote('');
    } catch(e) { showToast('Error: ' + e.message); }
    finally { setSaving(''); }
  }

  // Revoke premium
  async function revokePremium(userId) {
    setSaving(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        premium:          false,
        premiumRevokedAt: serverTimestamp(),
        premiumRevokedBy: 'admin',
      });
      showToast('Premium revoked.');
      loadHistory();
    } catch(e) { showToast('Error: ' + e.message); }
    finally { setSaving(''); }
  }

  // Extend premium by 30 days from now
  async function extendPremium(userId, currentExpiry) {
    setSaving(userId + '_extend');
    try {
      const base    = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
      const expires = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', userId), {
        premiumExpiresAt: Timestamp.fromDate(expires),
        lastUpdated:      serverTimestamp(),
      });
      showToast('Extended until ' + formatDate(expires));
      loadHistory();
    } catch(e) { showToast('Error: ' + e.message); }
    finally { setSaving(''); }
  }

  const filteredPayments = search.trim()
    ? payments.filter(u =>
        (u.email||'').includes(search) ||
        u.id.includes(search) ||
        (u.displayName||'').toLowerCase().includes(search.toLowerCase()))
    : payments;

  const inputCls = `w-full px-3 py-2 text-sm bg-game-surface border border-game-border
    rounded-xl text-white placeholder-slate-700 outline-none focus:border-purple-500/60 transition-colors`;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium
          bg-green-500/20 border border-green-500/40 text-green-300">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-game-border pb-3">
        {[['grant','Grant Premium'],['history','Premium Users']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
              ${tab===id
                ?'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                :'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Grant tab ── */}
      {tab === 'grant' && (
        <div className="space-y-4 max-w-md">
          <p className="text-xs text-slate-500">
            Grant premium access manually. Find user by email or paste their Firebase UID directly.
          </p>

          {/* Find by email */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Find user by email</label>
            <div className="flex gap-2">
              <input value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&searchUser()}
                placeholder="user@example.com" className={inputCls}/>
              <button onClick={searchUser} disabled={loading}
                className="px-3 py-2 rounded-xl bg-game-surface border border-game-border
                  text-slate-400 hover:text-slate-200 shrink-0 transition-colors">
                <Search className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* UID */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Firebase UID</label>
            <input value={uid} onChange={e=>setUid(e.target.value)}
              placeholder="Paste UID or use search above"
              className={inputCls}/>
            {uid && <p className="text-xs text-green-400 mt-1">✓ UID set</p>}
          </div>

          {/* Plan */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Plan duration</label>
            <div className="flex gap-2 flex-wrap">
              {PLANS.map(p => (
                <button key={p.id} onClick={() => setPlan(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                    ${plan===p.id
                      ?'bg-purple-600/20 text-purple-400 border-purple-500/30'
                      :'bg-game-surface text-slate-500 border-game-border hover:text-slate-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {plan === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input type="number" value={customDays} onChange={e=>setCustomDays(parseInt(e.target.value)||1)}
                  min={1} max={3650}
                  className="w-24 px-3 py-2 text-sm bg-game-surface border border-game-border
                    rounded-xl text-white outline-none focus:border-purple-500/60"/>
                <span className="text-xs text-slate-500">days</span>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Note (optional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)}
              placeholder="e.g. Beta tester, Sponsored access…"
              className={inputCls}/>
          </div>

          {/* Preview */}
          {uid && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
              <p className="text-purple-400 font-medium">Preview:</p>
              <p className="text-slate-400">UID: {uid.slice(0,16)}…</p>
              <p className="text-slate-400">
                Duration: {plan==='custom' ? customDays + ' days'
                  : PLANS.find(p=>p.id===plan)?.label}
              </p>
              <p className="text-slate-400">
                Expires: {formatDate(new Date(Date.now() +
                  (plan==='custom'?customDays:PLANS.find(p=>p.id===plan)?.days||30)
                  * 86400000))}
              </p>
            </div>
          )}

          <button onClick={grantPremium} disabled={!!saving || !uid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
              text-white disabled:opacity-40 transition-colors"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)' }}>
            {saving==='grant'
              ? <Loader className="w-4 h-4 animate-spin"/>
              : <Crown className="w-4 h-4"/>}
            {saving==='grant' ? 'Granting…' : 'Grant Premium'}
          </button>
        </div>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-game-surface border border-game-border
              rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by email, UID, or name…"
                className="flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder-slate-700"/>
            </div>
            <button onClick={loadHistory} disabled={loading}
              className="p-2 rounded-xl bg-game-surface border border-game-border
                text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
            </button>
          </div>

          <p className="text-xs text-slate-600">{filteredPayments.length} premium users</p>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-purple-400"/>
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">No premium users yet.</p>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map(u => {
                const expires   = u.premiumExpiresAt?.toDate?.();
                const expired   = expires && expires < new Date();
                const days      = expires
                  ? Math.max(0, Math.ceil((expires - new Date()) / 86400000))
                  : null;

                return (
                  <div key={u.id}
                    className={`game-card p-4 flex items-center gap-4
                      ${expired ? 'opacity-50' : ''}`}>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/30
                      flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-purple-400"/>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-white truncate">
                          {u.displayName || u.email || u.id.slice(0,12)+'…'}
                        </p>
                        {expired
                          ? <span className="text-xs text-red-400 shrink-0">Expired</span>
                          : <span className="text-xs text-green-400 shrink-0">Active</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3"/>
                          {expires ? (expired ? 'Expired ' : days + 'd left · ') + formatDate(expires) : 'No expiry'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3"/>
                          {u.premiumGrantedBy === 'admin' ? 'Admin grant' : u.premiumPlan || 'payment'}
                        </span>
                        {u.premiumNote && (
                          <span className="text-slate-700 truncate max-w-32">{u.premiumNote}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => extendPremium(u.id, expires)}
                        disabled={saving === u.id + '_extend'}
                        title="Extend by 30 days"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-green-400
                          hover:bg-green-500/10 transition-colors disabled:opacity-30">
                        {saving === u.id + '_extend'
                          ? <Loader className="w-3.5 h-3.5 animate-spin"/>
                          : <Plus className="w-3.5 h-3.5"/>}
                      </button>
                      <button onClick={() => revokePremium(u.id)}
                        disabled={saving === u.id}
                        title="Revoke premium"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400
                          hover:bg-red-500/10 transition-colors disabled:opacity-30">
                        {saving === u.id
                          ? <Loader className="w-3.5 h-3.5 animate-spin"/>
                          : <X className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}