'use client';

import React, { useId, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, MailCheck, X } from 'lucide-react';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { PhraseText } from './PhraseText';
import { useMemberSession } from '@/lib/useMemberSession';
import type { OAuthProvider, PublicMember } from '@/lib/members/types';

/**
 * The one login / sign-up / forgot-password card. Used by AuthModal (popup), /login and /onboarding,
 * so the three places can never drift apart again. Talks to the real member API (docs/API.md → Member auth).
 */
export type AuthView = 'login' | 'signup' | 'signup-email' | 'forgot' | 'forgot-sent';

interface AuthPanelProps {
  initialView?: 'login' | 'signup';
  /** Where social sign-in returns to (defaults to the current page) */
  returnTo?: string;
  /** Called after email login / sign-up succeeds. Social sign-in leaves the page instead. */
  onAuthenticated: (member: PublicMember, info: { isNew: boolean }) => void;
  onClose?: () => void;
  /** Error to show on open (e.g. ?auth_error= from a failed social sign-in) */
  initialError?: string;
  titleId?: string;
}

const MIN_PASSWORD = 8;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const inputClass =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all aria-[invalid=true]:border-rose-400';
const primaryButton =
  'w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-full font-extrabold text-sm sm:text-base shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer';
const linkButton = 'font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap';

function passwordStrength(value: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!value) return { level: 0, label: '' };
  if (value.length < MIN_PASSWORD) return { level: 1, label: 'สั้นเกินไป' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  if (value.length >= 12 || (value.length >= 10 && variety >= 3)) return { level: 3, label: 'แข็งแรง' };
  return { level: 2, label: 'พอใช้' };
}

/* ---------- Small building blocks ---------- */

const PROVIDERS: { id: OAuthProvider; label: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: (
      <svg className="w-5 h-5 fill-black shrink-0" viewBox="0 0 170 170" aria-hidden="true">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: (
      <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

function SocialButtons({ verb, available, disabled, onPick }: { verb: string; available: Record<string, boolean>; disabled?: boolean; onPick: (p: OAuthProvider) => void }) {
  return (
    <div className="space-y-3">
      {PROVIDERS.map((p) => {
        const ready = available[p.id];
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled || !ready}
            onClick={() => onPick(p.id)}
            className="w-full bg-white hover:bg-slate-50 disabled:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 py-3.5 px-4 sm:px-6 rounded-full border border-slate-300 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 active:scale-98 disabled:active:scale-100 transition-all cursor-pointer"
          >
            {p.icon}
            <span className="whitespace-nowrap"><span className="hidden min-[400px]:inline">{verb}ด้วย </span>{p.label}</span>
            {!ready && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">เร็วๆ นี้</span>}
          </button>
        );
      })}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-6" role="separator">
      <div className="border-t border-slate-200 flex-1" />
      <span className="text-xs text-slate-400 font-bold shrink-0">{label}</span>
      <div className="border-t border-slate-200 flex-1" />
    </div>
  );
}

function ErrorBox({ message, children }: { message: string; children?: React.ReactNode }) {
  if (!message) return null;
  return (
    <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-start gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        <PhraseText text={message} />
        {children}
      </span>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean; describedBy?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Checkbox({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 rounded border-slate-400 accent-[#2563EB] cursor-pointer shrink-0"
      />
      <label htmlFor={id} className="text-sm text-slate-700 font-semibold leading-snug cursor-pointer">
        {children}
      </label>
    </div>
  );
}

/* ---------- The panel ---------- */

export function AuthPanel({ initialView = 'login', returnTo, onAuthenticated, onClose, initialError = '', titleId }: AuthPanelProps) {
  const session = useMemberSession();
  const uid = useId();
  const [view, setView] = useState<AuthView>(initialView);
  const [error, setError] = useState(initialError);
  const [emailExists, setEmailExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ minutes: number; devResetUrl?: string } | null>(null);
  const [terms, setTerms] = useState<{ open: boolean; tab: 'terms' | 'privacy' }>({ open: false, tab: 'terms' });

  const consentGiven = isAdult && acceptsTerms;
  const strength = passwordStrength(password);

  const go = (next: AuthView) => {
    setView(next);
    setError('');
    setEmailExists(false);
    setSubmitted(false);
    setPassword('');
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setEmailExists(false);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const social = (provider: OAuthProvider) => {
    setBusy(true);
    session.loginWith(provider, returnTo);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isEmail(email) || !password) return;
    void run(async () => {
      const member = await session.login(email.trim(), password);
      onAuthenticated(member, { isNew: false });
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (name.trim().length < 2 || !isEmail(email) || password.length < MIN_PASSWORD || !consentGiven) return;
    void run(async () => {
      try {
        const member = await session.register({ displayName: name.trim(), email: email.trim(), password, consent: true });
        onAuthenticated(member, { isNew: true });
      } catch (err) {
        if (err instanceof Error && err.message.includes('มีบัญชีอยู่แล้ว')) setEmailExists(true);
        throw err;
      }
    });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isEmail(email)) return;
    void run(async () => {
      setResetInfo(await session.requestPasswordReset(email.trim()));
      setView('forgot-sent');
    });
  };

  const openTerms = (tab: 'terms' | 'privacy') => setTerms({ open: true, tab });
  const termsLinks = (
    <>
      <button type="button" onClick={() => openTerms('terms')} className={linkButton}>ข้อตกลงการใช้งาน</button>
      {' และ '}
      <button type="button" onClick={() => openTerms('privacy')} className={linkButton}>นโยบายความเป็นส่วนตัว</button>
    </>
  );

  const ids = {
    email: `${uid}-email`,
    password: `${uid}-password`,
    name: `${uid}-name`,
    pwHelp: `${uid}-pw-help`,
    adult: `${uid}-adult`,
    terms: `${uid}-terms`,
  };
  const emailInvalid = submitted && !isEmail(email);

  const emailField = (
    <div className="space-y-1.5">
      <label htmlFor={ids.email} className="block text-sm font-bold text-slate-800">อีเมล</label>
      <input
        id={ids.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={emailInvalid || undefined}
        className={inputClass}
      />
      {emailInvalid && <p className="text-xs font-bold text-rose-600">กรุณากรอกอีเมลให้ถูกต้อง</p>}
    </div>
  );

  const header = (title: string, subtitle?: string, onBack?: () => void) => (
    <div className="relative text-center pb-6">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="ย้อนกลับ" className="absolute -left-2 -top-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="ปิด" className="absolute -right-2 -top-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      )}
      <h2 id={titleId} className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 px-8"><PhraseText text={title} /></h2>
      {subtitle && <p className="text-sm text-slate-500 font-medium mt-2 max-w-sm mx-auto leading-relaxed"><PhraseText text={subtitle} /></p>}
    </div>
  );

  const switchLine = (question: string, action: string, target: AuthView) => (
    <p className="pt-5 mt-6 border-t border-slate-100 text-center text-sm text-slate-600 font-medium">
      {question}{' '}
      <button type="button" onClick={() => go(target)} className={linkButton}>{action}</button>
    </p>
  );

  return (
    <>
      {view === 'login' && (
        <div>
          {header('เข้าสู่ระบบ', 'ยินดีต้อนรับกลับสู่ Chill & Connect Hub')}
          <SocialButtons verb="เข้าสู่ระบบ" available={session.providers} disabled={busy} onPick={social} />
          <Divider label="หรือใช้อีเมล" />
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {emailField}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={ids.password} className="block text-sm font-bold text-slate-800">รหัสผ่าน</label>
                <button type="button" onClick={() => go('forgot')} className="text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:underline cursor-pointer">
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <PasswordInput id={ids.password} value={password} onChange={setPassword} autoComplete="current-password" invalid={submitted && !password} />
              {submitted && !password && <p className="text-xs font-bold text-rose-600">กรุณากรอกรหัสผ่าน</p>}
            </div>
            <ErrorBox message={error} />
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              <span>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</span>
            </button>
          </form>
          {switchLine('ยังไม่มีบัญชี?', 'สมัครสมาชิกฟรี', 'signup')}
          <p className="pt-3 text-center text-xs text-slate-400 font-medium leading-relaxed">
            <PhraseText text="การเข้าสู่ระบบถือว่าคุณยอมรับ" />{' '}{termsLinks}
          </p>
        </div>
      )}

      {view === 'signup' && (
        <div>
          {header('สมัครสมาชิก', 'ฟรี ใช้เวลาไม่ถึง 1 นาที แล้วเริ่มหา กิจกรรม เพื่อนใหม่ และที่เที่ยวที่ใช่')}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
            <Checkbox id={ids.adult} checked={isAdult} onChange={setIsAdult}>ฉันอายุ 18 ปีขึ้นไป</Checkbox>
            <Checkbox id={ids.terms} checked={acceptsTerms} onChange={setAcceptsTerms}>
              <span className="whitespace-nowrap">ฉันยอมรับ</span>{' '}{termsLinks}
            </Checkbox>
          </div>
          {!consentGiven && <p className="text-xs font-bold text-slate-500 text-center mb-3">ติ๊กทั้ง 2 ข้อด้านบนก่อนสมัคร</p>}
          <SocialButtons verb="สมัคร" available={session.providers} disabled={busy || !consentGiven} onPick={social} />
          <Divider label="หรือ" />
          <button
            type="button"
            disabled={!consentGiven}
            onClick={() => go('signup-email')}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-full font-extrabold text-sm sm:text-base shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-5 h-5" aria-hidden="true" />
            <span>สมัครด้วยอีเมล</span>
          </button>
          <ErrorBox message={error} />
          {switchLine('มีบัญชีอยู่แล้ว?', 'เข้าสู่ระบบ', 'login')}
        </div>
      )}

      {view === 'signup-email' && (
        <div>
          {header('สมัครด้วยอีเมล', undefined, () => go('signup'))}
          <form onSubmit={handleSignup} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={ids.name} className="block text-sm font-bold text-slate-800">ชื่อที่แสดง</label>
              <input
                id={ids.name}
                type="text"
                autoComplete="nickname"
                maxLength={40}
                placeholder="เช่น ส้ม หรือ Som S."
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={(submitted && name.trim().length < 2) || undefined}
                className={inputClass}
              />
              <p className={`text-xs font-medium ${submitted && name.trim().length < 2 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                <PhraseText text={submitted && name.trim().length < 2 ? 'ตั้งชื่ออย่างน้อย 2 ตัวอักษร' : 'เพื่อนในกิจกรรมจะเห็นชื่อนี้ เปลี่ยนภายหลังได้'} />
              </p>
            </div>
            {emailField}
            <div className="space-y-1.5">
              <label htmlFor={ids.password} className="block text-sm font-bold text-slate-800">ตั้งรหัสผ่าน</label>
              <PasswordInput id={ids.password} value={password} onChange={setPassword} autoComplete="new-password" invalid={submitted && password.length < MIN_PASSWORD} describedBy={ids.pwHelp} />
              <div className="flex items-center gap-3 pt-1">
                <div className="grid grid-cols-3 gap-1.5 flex-1" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 rounded-full transition-colors ${
                        strength.level >= n ? (strength.level === 1 ? 'bg-rose-400' : strength.level === 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-600 w-16 text-right">{strength.label}</span>
              </div>
              <p id={ids.pwHelp} className={`text-xs font-medium ${submitted && password.length < MIN_PASSWORD ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                <PhraseText text={`อย่างน้อย ${MIN_PASSWORD} ตัวอักษร ยาวขึ้น หรือผสมตัวเลขและสัญลักษณ์ จะปลอดภัยกว่า`} />
              </p>
            </div>
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <Checkbox id={ids.adult} checked={isAdult} onChange={setIsAdult}>ฉันอายุ 18 ปีขึ้นไป</Checkbox>
              <Checkbox id={ids.terms} checked={acceptsTerms} onChange={setAcceptsTerms}>
                <span className="whitespace-nowrap">ฉันยอมรับ</span>{' '}{termsLinks}
              </Checkbox>
            </div>
            <ErrorBox message={error}>
              {emailExists && (
                <>
                  {' '}
                  <button type="button" onClick={() => go('login')} className="underline cursor-pointer">ไปหน้าเข้าสู่ระบบ</button>
                </>
              )}
            </ErrorBox>
            <button type="submit" disabled={busy || !consentGiven} className={primaryButton}>
              {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              <span>{busy ? 'กำลังสร้างบัญชี…' : 'สร้างบัญชี'}</span>
            </button>
          </form>
          {switchLine('มีบัญชีอยู่แล้ว?', 'เข้าสู่ระบบ', 'login')}
        </div>
      )}

      {view === 'forgot' && (
        <div>
          {header('ลืมรหัสผ่าน', 'กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้', () => go('login'))}
          <form onSubmit={handleForgot} noValidate className="space-y-4">
            {emailField}
            <ErrorBox message={error} />
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              <span>{busy ? 'กำลังส่ง…' : 'ส่งลิงก์ตั้งรหัสผ่าน'}</span>
            </button>
          </form>
          <p className="pt-4 text-center text-xs text-slate-500 font-medium leading-relaxed">
            <PhraseText text="สมัครด้วย Google, Apple หรือ Facebook? ใช้ปุ่มนั้นเข้าสู่ระบบได้เลย ไม่ต้องใช้รหัสผ่าน" />
          </p>
        </div>
      )}

      {view === 'forgot-sent' && (
        <div className="text-center">
          {header('ตรวจสอบอีเมลของคุณ')}
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-5 border border-blue-100">
            <MailCheck className="w-8 h-8" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            ถ้า <span className="font-bold text-slate-900 break-all">{email.trim()}</span>{' '}
            <PhraseText text={`มีบัญชีกับเรา ลิงก์ตั้งรหัสผ่านใหม่ จะไปถึงในไม่กี่นาที ลิงก์ใช้ได้ ${resetInfo?.minutes ?? 30} นาที และใช้ได้ครั้งเดียว`} />
          </p>
          {resetInfo?.devResetUrl && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
              <p className="text-xs font-bold text-amber-900"><PhraseText text="โหมดพัฒนา: ยังไม่ได้ตั้งค่าระบบส่งอีเมล ลิงก์จึงแสดงตรงนี้แทน" /></p>
              <a href={resetInfo.devResetUrl} className="mt-1 block text-xs font-bold text-[#2563EB] underline break-all">{resetInfo.devResetUrl}</a>
            </div>
          )}
          <button type="button" onClick={() => go('login')} className={`${primaryButton} mt-6`}>
            <Check className="w-5 h-5" aria-hidden="true" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </button>
        </div>
      )}

      {terms.open && (
        <div data-nested-dialog>
          <TermsPrivacyModal isOpen onClose={() => setTerms((t) => ({ ...t, open: false }))} initialTab={terms.tab} />
        </div>
      )}
    </>
  );
}
