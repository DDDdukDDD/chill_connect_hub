'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { QuickSignup } from '@/components/auth/QuickSignup';
import { MomentAvatar } from '@/components/moments/CommentThread';
import type { InviteInfo } from '@/lib/social/friendPlans';

/**
 * Sign-up for someone who opened a friend's "ชวนไป" and tapped "ไปกัน" without an account (owner 2026-11-11: "they
 * must want to sign up, not close it"). It leads with the friend who asked, says what happens right after, and signs up
 * in one tap with LINE (they came from LINE). `returnTo` carries the invitation through sign-up, and the page answers
 * "ไปกัน" by itself when they are back (InviteBanner); a new member only accepts the safety pledge on the way.
 */
export function InviteSignupSheet({ info, returnTo, onClose }: { info: InviteInfo; returnTo: string; onClose: () => void }) {
  const isTee = info.kind === 'tee';
  const promises = isTee
    ? ['ลงทะเบียนตี้นี้ต่อได้ทันที', `ไปตี้เดียวกับ ${info.host.name}`]
    : ['เข้าแผนนี้ทันที', `แชตนัดวันกับ ${info.host.name}${info.goingCount > 1 ? ' และเพื่อนๆ' : ''}`];

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
        <h2 id="invite-signup-title" className="text-lg sm:text-xl font-bold text-slate-900">{info.host.name} รอคำตอบคุณอยู่</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {isTee ? `ชวนไปตี้ ${info.title}` : `ไปกันที่ ${info.title}`}
          {info.dateLabel && ` · ${info.dateLabel}`}
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

      <QuickSignup returnTo={returnTo} lineLabel="ไปกันด้วย LINE" />
    </DialogShell>
  );
}
