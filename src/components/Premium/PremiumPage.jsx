// frontend/src/components/Premium/PremiumPage.jsx
// Beautiful premium upgrade page with Razorpay integration

import { useState, useEffect } from 'react';
import { Zap, Check, X, Crown, Lightbulb, Star, BookOpen,
         Shield, Loader, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth }    from '../../context/AuthContext.jsx';
import { usePremium } from '../../context/PremiumContext.jsx';

import { API_URL } from '../../utils/config.js';
const API = API_URL;

const FEATURES = {
  free: [
    { text: 'Access to all 40+ problems',          has: true  },
    { text: 'C++ & Python code execution',          has: true  },
    { text: 'World map & City view',                has: true  },
    { text: 'Community forum',                      has: true  },
    { text: 'Progress tracking',                    has: true  },
    { text: 'AI Hints',                             has: false },
    { text: 'AI Code Review',                       has: false },
    { text: 'Personalized Study Plan',              has: false },
    { text: 'Solutions & Explanations',             has: false },
    { text: 'Unlimited daily AI requests',          has: false },
  ],
  premium: [
    { text: 'Everything in Free',                   has: true  },
    { text: 'AI Hints — unlimited per day',         has: true  },
    { text: 'AI Code Review after each solve',      has: true  },
    { text: 'Personalized AI Study Plan',           has: true  },
    { text: 'Full solutions in 3 languages',        has: true  },
    { text: 'Step-by-step explanations',            has: true  },
    { text: 'Priority community support',           has: true  },
    { text: 'Early access to new problems',         has: true  },
    { text: 'No ads, ever',                         has: true  },
    { text: 'Cancel anytime',                       has: true  },
  ],
};

const AI_FEATURES = [
  { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20', title: 'AI Hints',
    desc: 'Stuck on a problem? Get a nudge — not the answer — from Gemini AI.' },
  { icon: Star, color: 'text-green-400', bg: 'bg-green-500/10',
    border: 'border-green-500/20', title: 'AI Code Review',
    desc: 'After passing all tests, get your time/space complexity reviewed instantly.' },
  { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10',
    border: 'border-blue-500/20', title: 'Study Plan',
    desc: 'Gemini analyzes your weak topics and builds a personalized 3-day plan.' },
];

function PlanCard({ plan, price, period, description, savings, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300
        ${selected
          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
          : 'border-game-border bg-game-surface hover:border-purple-500/40'}`}
      style={selected ? { boxShadow: '0 0 30px rgba(124,58,237,0.2)' } : {}}>

      {savings && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full
          bg-green-500 text-white text-xs font-bold whitespace-nowrap">
          {savings}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-bold text-base">{plan}</p>
          <p className="text-slate-500 text-xs mt-0.5">{description}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all ${selected ? 'border-purple-500 bg-purple-500' : 'border-game-border'}`}>
          {selected && <Check className="w-3 h-3 text-white"/>}
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-white">₹{price}</span>
        <span className="text-slate-500 text-sm">/{period}</span>
      </div>
    </div>
  );
}

export default function PremiumPage({ onClose }) {
  const { user, userProfile } = useAuth();
  const { premium: isPremium, premiumInfo, expiryText, daysRemaining } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading,      setLoading]      = useState(false);
  const [status,       setStatus]       = useState(null);
  const [errorMsg,     setErrorMsg]     = useState('');

  // Load Razorpay SDK
  useEffect(() => {
    if (!document.getElementById('razorpay-sdk')) {
      const s = document.createElement('script');
      s.id  = 'razorpay-sdk';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(s);
    }
  }, []);

  async function handleUpgrade() {
    if (!user) return;
    setLoading(true); setStatus(null);
    try {
      // Create order
      const orderRes = await fetch(API + '/api/premium/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, uid: user.uid }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Failed to create order');

      // Open Razorpay checkout
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'DSA Quest',
        description: order.description,
        order_id:    order.orderId,
        prefill: {
          email: user.email || '',
          name:  userProfile?.displayName || user.displayName || '',
        },
        theme: { color: '#7c3aed' },
        handler: async function(response) {
          try {
            const verifyRes = await fetch(API + '/api/premium/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                uid:  user.uid,
                plan: selectedPlan,
              }),
            });
            const verified = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verified.error || 'Verification failed');
            setStatus('success');
            setLoading(false);
          } catch(verifyErr) {
            console.error('[Razorpay] Verify error:', verifyErr.message);
            setErrorMsg('Payment done but verification failed: ' + verifyErr.message);
            setStatus('error');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() { setLoading(false); },
        },
      };

      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Check your connection.');
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(response) {
        console.error('[Razorpay] Payment failed:', response.error);
        setErrorMsg(response.error?.description || 'Payment was declined. Please try again.');
        setStatus('error'); setLoading(false);
      });
      rzp.open();
    } catch(e) {
      console.error('[Premium] Error:', e.message);
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setStatus('error');
      setLoading(false);
    }
  }

  // Already premium
  if (isPremium) {
    const exp = premiumInfo?.expiresAt || null;
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30
          flex items-center justify-center mx-auto">
          <Crown className="w-8 h-8 text-purple-400"/>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">You're Premium! 👑</h2>
          <p className="text-slate-400 text-sm">
            {isPremium ? expiryText() : 'Active'}
          </p>
        </div>
        <div className="game-card p-4 space-y-2 text-left">
          {FEATURES.premium.map((f,i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400 shrink-0"/>
              <span className="text-sm text-slate-300">{f.text}</span>
            </div>
          ))}
        </div>
        {onClose && (
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium">
            Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">

      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5"/>
          Powered by Gemini AI
        </div>
        <h1 className="text-2xl font-extrabold text-white leading-tight">
          Unlock AI-Powered Learning
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Get unstuck faster, learn deeper, and level up with personalized AI guidance — 
          all at a price that won't break the bank.
        </p>
      </div>

      {/* AI Feature showcase */}
      <div className="grid grid-cols-3 gap-3">
        {AI_FEATURES.map(({ icon: Icon, color, bg, border, title, desc }) => (
          <div key={title} className={`rounded-2xl p-4 border ${bg} ${border}`}>
            <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center
              justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`}/>
            </div>
            <p className="text-white text-xs font-bold mb-1">{title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <h2 className="text-white font-bold text-center text-base">Choose your plan</h2>
        <div className="grid grid-cols-2 gap-3">
          <PlanCard
            plan="Monthly" price={99} period="month"
            description="Billed monthly, cancel anytime"
            selected={selectedPlan==='monthly'}
            onSelect={() => setSelectedPlan('monthly')}/>
          <PlanCard
            plan="Yearly" price={799} period="year"
            description="Best value — 2 months free"
            savings="Save 33%"
            selected={selectedPlan==='yearly'}
            onSelect={() => setSelectedPlan('yearly')}/>
        </div>

        {/* CTA */}
        <button onClick={handleUpgrade} disabled={loading || !user}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl
            text-base font-bold text-white transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
            boxShadow:  '0 8px 30px rgba(124,58,237,0.4)',
          }}>
          {loading
            ? <><Loader className="w-5 h-5 animate-spin"/> Processing…</>
            : <><Crown className="w-5 h-5"/>
                Get Premium — ₹{selectedPlan==='monthly'?'99/mo':'799/yr'}
                <ChevronRight className="w-4 h-4"/>
              </>
          }
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <Check className="w-4 h-4 text-green-400 shrink-0"/>
            <p className="text-green-400 text-sm">Payment successful! Premium activated. 🎉</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <X className="w-4 h-4 text-red-400 shrink-0"/>
            <p className="text-red-400 text-sm">{errorMsg || 'Payment failed. Please try again.'}</p>
          </div>
        )}

        <p className="text-center text-slate-700 text-xs flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3"/>
          Secured by Razorpay · UPI, Cards, Net Banking accepted
        </p>
      </div>

      {/* Feature comparison */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { title: 'Free', features: FEATURES.free, accent: 'text-slate-400' },
          { title: 'Premium 👑', features: FEATURES.premium, accent: 'text-purple-400' },
        ].map(({ title, features, accent }) => (
          <div key={title} className="game-card p-4">
            <p className={`text-sm font-bold mb-3 ${accent}`}>{title}</p>
            <div className="space-y-2">
              {features.map((f,i) => (
                <div key={i} className="flex items-center gap-2">
                  {f.has
                    ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0"/>
                    : <X     className="w-3.5 h-3.5 text-slate-700 shrink-0"/>}
                  <span className={`text-xs ${f.has?'text-slate-300':'text-slate-700'}`}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cost transparency */}
      <div className="game-card p-4 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Why ₹99/month?
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'AI API cost', value: '~₹14', sub: 'per 1000 requests' },
            { label: 'Infrastructure', value: '~₹15', sub: 'per user/month' },
            { label: 'Our cut', value: '~₹70', sub: 'keeps lights on' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-game-surface rounded-xl p-3">
              <p className="text-white font-bold text-base">{value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              <p className="text-slate-700 text-xs">{sub}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-700 text-xs text-center leading-relaxed">
          We believe in transparent pricing. Gemini 2.5 Flash-Lite costs $0.10/1M tokens.
          A typical AI session (hints + review + study plan) uses ~800 tokens = ₹0.007.
          At ₹99/month you get full AI access, fully sustainable.
        </p>
      </div>
    </div>
  );
}