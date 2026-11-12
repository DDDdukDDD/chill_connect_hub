'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleInAppNote, PROVIDERS } from '@/components/auth/AuthPanel';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { useInAppBrowser } from '@/lib/useInAppBrowser';
import { useMemberSession } from '@/lib/useMemberSession';

/**
 * Sign up right where the visitor is, in one tap: LINE first and large, the other sign-ins beside each other, and
 * email when nothing else is on. Used by the ชวนไป sign-up (InviteSignupSheet) and by "สมัครก่อนนะ" everywhere
 * (RequireMembershipModal), so both ask the same way (owner 2026-11-12). `returnTo` is where sign-up comes back to.
 */
export function QuickSignup({
  returnTo,
  lineLabel = 'สมัครด้วย LINE',
  onEmail,
  onLogin,
}: {
  returnTo: string;
  lineLabel?: string;
  /** Opens the email form in place; without it email goes to /login?mode=signup */
  onEmail?: () => void;
  /** Opens the login form in place; without it "เข้าสู่ระบบ" goes to /login */
  onLogin?: () => void;
}) {
  const session = useMemberSession();
  const [busy, setBusy] = useState(false);
  const [terms, setTerms] = useState<{ open: boolean; tab: 'terms' | 'privacy' }>({ open: false, tab: 'terms' });
  const { inApp, externalHref } = useInAppBrowser();
  // Google refuses the in-app browsers of LINE, Facebook and Instagram: hidden there, with a way out below
  const available = PROVIDERS.filter((p) => session.providers[p.id] && !(inApp && p.id === 'google'));
  const line = available.find((p) => p.id === 'line');
  const others = available.filter((p) => p.id !== 'line');
  // No social sign-in turned on (or not known yet): email becomes the main button, never a dead end
  const emailFirst = session.isLoaded && available.length === 0;
  const emailHref = `/login?mode=signup&returnTo=${encodeURIComponent(returnTo)}`;
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const start = (provider: (typeof PROVIDERS)[number]['id']) => {
    setBusy(true);
    session.loginWith(provider, returnTo, true);
  };
  const inPlace = (open?: () => void) => (e: React.MouseEvent) => {
    if (!open) return;
    e.preventDefault();
    open();
  };
  const linkButton = 'font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 cursor-pointer';

  return (
    <>
      {!session.isLoaded && <div className="h-12 rounded-full bg-slate-100 animate-pulse" aria-hidden="true" />}
      {emailFirst && (
        <Link href={emailHref} onClick={inPlace(onEmail)} data-autofocus className="w-full h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base flex items-center justify-center">
          สมัครฟรี
        </Link>
      )}
      {line && (
        <button
          type="button"
          data-autofocus
          disabled={busy}
          onClick={() => start('line')}
          className="w-full h-12 rounded-full bg-[#06C755] hover:bg-[#05B34C] disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center">{line.icon}</span>
          {lineLabel}
        </button>
      )}
      {others.length > 0 && (
        <div className={`grid gap-2 ${line ? 'mt-2.5' : ''} ${others.length > 1 ? 'grid-cols-2' : ''}`}>
          {others.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => start(p.id)}
              className="h-11 rounded-full border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-sm font-bold text-slate-800 flex items-center justify-center gap-2 cursor-pointer"
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
      )}

      {inApp && session.providers.google && <GoogleInAppNote externalHref={externalHref} className="mt-3" />}
      <p className="mt-4 text-center text-xs font-medium text-slate-500">ฟรี · ไม่ถึง 1 นาที · ไม่โพสต์อะไรแทนคุณ</p>
      {/* One line on a 360 px phone (owner 2026-11-12: lighter); the links open the full texts */}
      <p className="mt-1 text-center text-xs text-slate-500 leading-relaxed">
        อายุ 18+ · ยอมรับ{' '}
        <button type="button" onClick={() => setTerms({ open: true, tab: 'terms' })} className={linkButton}>ข้อตกลง</button>
        {' และ '}
        <button type="button" onClick={() => setTerms({ open: true, tab: 'privacy' })} className={linkButton}>ความเป็นส่วนตัว</button>
      </p>
      <p className="mt-4 pt-4 border-t border-slate-100 text-center text-sm font-medium text-slate-600">
        {!emailFirst && (
          <>
            <Link href={emailHref} onClick={inPlace(onEmail)} className="font-bold text-slate-700 hover:underline">สมัครด้วยอีเมล</Link>
            {' · '}
          </>
        )}
        มีบัญชีแล้ว? <Link href={loginHref} onClick={inPlace(onLogin)} className="font-bold text-[#2563EB] hover:underline">เข้าสู่ระบบ</Link>
      </p>
      <TermsPrivacyModal isOpen={terms.open} onClose={() => setTerms((t) => ({ ...t, open: false }))} initialTab={terms.tab} />
    </>
  );
}
