'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { PROVIDERS } from '@/components/auth/AuthPanel';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { MomentAvatar } from '@/components/moments/CommentThread';
import { useMemberSession } from '@/lib/useMemberSession';
import type { InviteInfo } from '@/lib/social/friendPlans';

/**
 * Sign-up for someone who opened a friend's "ชวนไป" and tapped "ไปกัน" without an account (owner 2026-11-11: "they
 * must want to sign up, not close it"). It leads with the friend who asked, says what happens right after, and signs up
 * in one tap with LINE (they came from LINE). `returnTo` carries the invitation through sign-up, and the page answers
 * "ไปกัน" by itself when they are back (InviteBanner); a new member only accepts the safety pledge on the way.
 */
export function InviteSignupSheet({ info, returnTo, onClose }: { info: InviteInfo; returnTo: string; onClose: () => void }) {
  const session = useMemberSession();
  const [busy, setBusy] = useState(false);
  const [terms, setTerms] = useState<{ open: boolean; tab: 'terms' | 'privacy' }>({ open: false, tab: 'terms' });
  const isTee = info.kind === 'tee';
  const available = PROVIDERS.filter((p) => session.providers[p.id]);
  const line = available.find((p) => p.id === 'line');
  const others = available.filter((p) => p.id !== 'line');
  const start = (provider: (typeof PROVIDERS)[number]['id']) => {
    setBusy(true);
    session.loginWith(provider, returnTo, true);
  };
  const promises = isTee
    ? ['ลงทะเบียนตี้นี้ต่อได้ทันที', `ไปตี้เดียวกับ ${info.host.name}`]
    : ['เข้าแผนนี้ทันที', `แชตนัดวันกับ ${info.host.name}${info.goingCount > 1 ? ' และเพื่อนๆ' : ''}`];
  const linkButton = 'font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 cursor-pointer';

  return (
    <DialogShell onClose={onClose} size="sm" focusField={false} labelledBy="invite-signup-title">
      <div className="text-center">
        <span className="inline-flex -space-x-3 mb-3" aria-hidden="true">
          {info.going.slice(0, 3).map((p) => (
            <MomentAvatar key={p.id} name={p.name} src={p.avatar} className="w-14 h-14 text-lg ring-4 ring-white" />
          ))}
          {info.goingCount > 3 && (
            <span className="w-14 h-14 rounded-full bg-slate-100 ring-4 ring-white flex items-center justify-center text-sm font-bold text-slate-700">+{info.goingCount - 3}</span>
          )}
        </span>
        <h2 id="invite-signup-title" className="text-xl font-bold text-slate-900">{info.host.name} รอคำตอบคุณอยู่</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {isTee ? `ชวนไปตี้ ${info.title}` : `ไปกันที่ ${info.title}`}
          {info.goingCount > 1 && ` · ไปกันแล้ว ${info.goingCount} คน`}
        </p>
      </div>

      <div className="my-5 rounded-2xl bg-blue-50 px-4 py-3">
        <p className="text-xs font-bold text-slate-500 mb-1.5">สมัครแล้วคุณจะ</p>
        <ul className="space-y-1">
          {promises.map((text) => (
            <li key={text} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Check className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {line && (
        <button
          type="button"
          data-autofocus
          disabled={busy}
          onClick={() => start('line')}
          className="w-full h-12 rounded-full bg-[#06C755] hover:bg-[#05B34C] disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center">{line.icon}</span>
          ไปกันด้วย LINE
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

      <p className="mt-4 text-center text-xs font-medium text-slate-500">ฟรี · ไม่ถึง 1 นาที · ไม่โพสต์อะไรแทนคุณ</p>
      <p className="mt-1 text-center text-xs text-slate-500 leading-relaxed">
        การสมัครถือว่าคุณอายุ 18 ปีขึ้นไป และยอมรับ{' '}
        <button type="button" onClick={() => setTerms({ open: true, tab: 'terms' })} className={linkButton}>ข้อตกลงการใช้งาน</button>
        {' และ '}
        <button type="button" onClick={() => setTerms({ open: true, tab: 'privacy' })} className={linkButton}>นโยบายความเป็นส่วนตัว</button>
      </p>
      <p className="mt-4 pt-4 border-t border-slate-100 text-center text-sm font-medium text-slate-600">
        <Link href={`/login?mode=signup&returnTo=${encodeURIComponent(returnTo)}`} className="font-bold text-slate-700 hover:underline">สมัครด้วยอีเมล</Link>
        {' · '}
        มีบัญชีแล้ว? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-bold text-[#2563EB] hover:underline">เข้าสู่ระบบ</Link>
      </p>
      <TermsPrivacyModal isOpen={terms.open} onClose={() => setTerms((t) => ({ ...t, open: false }))} initialTab={terms.tab} />
    </DialogShell>
  );
}
