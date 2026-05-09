// frontend/src/components/Legal/LegalPage.jsx
// Terms of Service + Privacy Policy for DSA Quest
// Legal entity: Arnav Goel | Domain: codez.com

import { useState } from 'react';
import { X, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const LAST_UPDATED = 'May 9, 2026';
const DOMAIN       = 'codez.com';
const APP_NAME     = 'DSA Quest';
const OWNER        = 'Arnav Goel';
const CONTACT      = 'arnav@codez.com';

// ── Section accordion ──────────────────────────────────────────
function LegalSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-game-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left group">
        <span className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
          {title}
        </span>
        {open
          ? <ChevronUp   className="w-3.5 h-3.5 text-slate-600 shrink-0"/>
          : <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0"/>}
      </button>
      {open && (
        <div className="pb-4 text-sm text-slate-500 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Tab button ─────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
          : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Terms of Service ───────────────────────────────────────────
function TermsOfService() {
  return (
    <div className="space-y-1">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using {APP_NAME} at {DOMAIN} ("the Service"), you agree to be bound
          by these Terms of Service. If you do not agree, please do not use the Service.
        </p>
        <p>
          The Service is operated by {OWNER} ("we", "us", "our"). These terms apply to all
          visitors, registered users, and premium subscribers.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <p>
          {APP_NAME} is a gamified data structures and algorithms (DSA) practice platform that
          provides problem tracking, spaced repetition review scheduling, an in-browser code
          editor with multi-language execution, AI-powered hints and code review, a community
          forum, and progress analytics.
        </p>
        <p>
          Certain features — including AI assistance — require a Premium subscription purchased
          through Razorpay.
        </p>
      </LegalSection>

      <LegalSection title="3. User Accounts">
        <p>
          You may register using Google Sign-In, email/password, or phone (SMS OTP). You are
          responsible for maintaining the confidentiality of your credentials and for all
          activity under your account.
        </p>
        <p>
          You must provide accurate information. Accounts found to be fraudulent or used to
          abuse the Service may be suspended without notice.
        </p>
        <p>
          You must be at least 13 years old to use this Service. By registering, you confirm
          that you meet this requirement.
        </p>
      </LegalSection>

      <LegalSection title="4. Premium Subscriptions & Payments">
        <p>
          Premium features are available via paid subscription processed by Razorpay. By
          subscribing you agree to Razorpay's terms at razorpay.com/terms. All prices are
          listed in Indian Rupees (INR) and include applicable taxes.
        </p>
        <p>
          Subscriptions are non-refundable except where required by applicable law. We reserve
          the right to change pricing with 14 days' notice.
        </p>
        <p>
          Access to premium features will continue until the end of the paid billing period,
          after which your account reverts to the free tier.
        </p>
      </LegalSection>

      <LegalSection title="5. Code Execution">
        <p>
          Code you submit is sent to third-party execution services (Wandbox) for compilation
          and execution. Do not submit code that is malicious, attempts to exploit the execution
          environment, or violates any applicable law.
        </p>
        <p>
          We are not responsible for the output produced by the execution service or for any
          data loss resulting from execution failures.
        </p>
      </LegalSection>

      <LegalSection title="6. AI Features">
        <p>
          AI-powered features (hints, code review, study plans) use Google's Gemini API.
          AI responses are generated automatically and may be inaccurate. Do not rely on AI
          responses as authoritative technical or educational guidance.
        </p>
        <p>
          AI features are limited to 50 requests per day for premium users and are not available
          on the free tier. Usage is tracked server-side.
        </p>
      </LegalSection>

      <LegalSection title="7. Community Forum">
        <p>
          The community forum allows authenticated users to post questions, answers, and
          comments. You agree not to post content that is:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Spam, promotional, or off-topic</li>
          <li>Abusive, harassing, or discriminatory</li>
          <li>In violation of any third party's intellectual property rights</li>
          <li>Complete solutions to problems that undermine other users' learning</li>
        </ul>
        <p>
          We reserve the right to remove any content and suspend any user who violates these
          guidelines, at our sole discretion.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>
          All content on the Service — including the game design, UI, artwork, and problem
          descriptions — is owned by {OWNER} or licensed to us. You may not reproduce, copy,
          or redistribute any part of the Service without prior written permission.
        </p>
        <p>
          Code you write in the editor remains yours. By submitting it to the community forum,
          you grant us a non-exclusive, royalty-free licence to display it.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of Liability">
        <p>
          The Service is provided "as is" without warranties of any kind. To the fullest extent
          permitted by law, {OWNER} shall not be liable for any indirect, incidental, or
          consequential damages arising from your use of the Service.
        </p>
        <p>
          Our total liability to you for any claim arising from use of the Service shall not
          exceed the amount you paid us in the 3 months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>
          We may terminate or suspend your account at any time for violation of these Terms.
          You may delete your account at any time from your profile settings. Upon termination,
          your right to use the Service ceases immediately.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to Terms">
        <p>
          We may update these Terms at any time. We will notify you of material changes via
          email or an in-app notice. Continued use of the Service after changes constitutes
          acceptance of the new Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts in New Delhi, India.
        </p>
        <p>
          For any questions, contact us at <a href={`mailto:${CONTACT}`}
            className="text-purple-400 hover:underline">{CONTACT}</a>.
        </p>
      </LegalSection>
    </div>
  );
}

// ── Privacy Policy ─────────────────────────────────────────────
function PrivacyPolicy() {
  return (
    <div className="space-y-1">
      <LegalSection title="1. Who We Are">
        <p>
          {APP_NAME} is operated by {OWNER}. This Privacy Policy explains how we collect,
          use, and protect your personal data when you use our Service at {DOMAIN}.
        </p>
        <p>
          Contact: <a href={`mailto:${CONTACT}`} className="text-purple-400 hover:underline">{CONTACT}</a>
        </p>
      </LegalSection>

      <LegalSection title="2. Data We Collect">
        <p><span className="text-slate-300 font-medium">Account data:</span> When you register,
        we collect your email address, display name, and profile photo (if using Google Sign-In)
        or phone number (if using phone auth).</p>

        <p><span className="text-slate-300 font-medium">Usage data:</span> We store your problem
        solving progress, notes, XP/level/streak, spaced repetition review schedules, and custom
        problem lists in Firebase Firestore.</p>

        <p><span className="text-slate-300 font-medium">Payment data:</span> If you subscribe to
        Premium, payment is processed by Razorpay. We do not store your card details. We receive
        a payment confirmation and subscription status from Razorpay.</p>

        <p><span className="text-slate-300 font-medium">Code submissions:</span> Code you run is
        sent to Wandbox for execution. We do not permanently store your code submissions.</p>

        <p><span className="text-slate-300 font-medium">AI usage:</span> Prompts sent to AI
        features (hints, review, study plan) are processed by Google's Gemini API. We store a
        daily usage counter per user but not the content of AI conversations.</p>

        <p><span className="text-slate-300 font-medium">Community content:</span> Posts and
        replies you submit to the forum are stored in Firestore and visible to other authenticated
        users.</p>
      </LegalSection>

      <LegalSection title="3. How We Use Your Data">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>To provide and improve the Service</li>
          <li>To authenticate your identity and maintain your session</li>
          <li>To track your learning progress and generate personalised study plans</li>
          <li>To send daily review reminder emails (you can opt out in profile settings)</li>
          <li>To process and verify Premium subscription payments</li>
          <li>To enforce AI usage limits for premium users</li>
          <li>To moderate community content</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </LegalSection>

      <LegalSection title="4. Third-Party Services">
        <p>We use the following third-party services that may process your data:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><span className="text-slate-300">Firebase (Google)</span> — authentication, database, hosting</li>
          <li><span className="text-slate-300">Razorpay</span> — payment processing</li>
          <li><span className="text-slate-300">Google Gemini API</span> — AI features</li>
          <li><span className="text-slate-300">Wandbox</span> — code execution</li>
          <li><span className="text-slate-300">Resend</span> — transactional email</li>
          <li><span className="text-slate-300">Railway</span> — backend hosting</li>
          <li><span className="text-slate-300">Vercel</span> — frontend hosting</li>
        </ul>
        <p>Each provider has its own privacy policy. We encourage you to review them.</p>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your account and progress data for as long as your account is active.
          If you delete your account, we will delete your personal data within 30 days, except
          where retention is required by law or for legitimate business purposes (e.g. payment
          records).
        </p>
        <p>
          Community posts you have made may remain visible after account deletion in anonymised
          form unless you request their removal.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies & Local Storage">
        <p>
          We use Firebase Authentication tokens stored in your browser's local storage to keep
          you signed in. We do not use third-party advertising cookies.
        </p>
        <p>
          Your language preference and editor settings are stored in your browser's local storage
          and never sent to our servers.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of marketing/notification emails via your profile settings</li>
          <li>Export your progress data as a CSV from the Settings panel</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT}`}
          className="text-purple-400 hover:underline">{CONTACT}</a>.</p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>
          The Service is not directed at children under 13. We do not knowingly collect personal
          data from children under 13. If you believe we have inadvertently collected such data,
          please contact us and we will delete it promptly.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We use industry-standard security measures including Firebase's built-in security,
          Firestore security rules, HTTPS-only communication, and server-side authentication
          checks. However, no system is completely secure and we cannot guarantee absolute
          security of your data.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes via email or an in-app notice at least 7 days before they take effect.
        </p>
      </LegalSection>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function LegalPage({ onClose, defaultTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col
          bg-game-card border border-game-border rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
          border-b border-game-border shrink-0">
          <div>
            <p className="pixel text-xs text-purple-400">{APP_NAME}</p>
            <p className="text-xs text-slate-600 mt-0.5">Last updated: {LAST_UPDATED}</p>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="text-slate-600 hover:text-slate-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-game-border shrink-0">
          <Tab active={activeTab === 'terms'}   onClick={() => setActiveTab('terms')}
            icon={FileText} label="Terms of Service" />
          <Tab active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')}
            icon={Shield}   label="Privacy Policy" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'terms'   && <TermsOfService />}
          {activeTab === 'privacy' && <PrivacyPolicy />}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-game-border shrink-0
          flex items-center justify-between">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} {OWNER} · {DOMAIN}
          </p>
          {onClose && (
            <button onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs bg-game-surface border
                border-game-border text-slate-400 hover:text-slate-200 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}