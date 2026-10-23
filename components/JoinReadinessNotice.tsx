'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MailCheck, ShieldCheck } from 'lucide-react';
import type { PublicMember } from '@/lib/members/types';
import { memberActions } from '@/lib/useMemberSession';

/**
 * What a member still needs before the server lets them join a ตี้ (lib/members/activity.ts: a "new" account,
 * i.e. email not confirmed or pledge not accepted, is refused). Said up front in the confirm dialog instead of
 * as a refusal after "ยืนยันการเข้าร่วม".
 */
export function joinBlocker(member: PublicMember | null | undefined): 'email' | 'pledge' | null {
  if (!member) return null;
  if (!member.trust.emailVerified) return 'email';
  if (!member.trust.pledged) return 'pledge';
  return null;
}

/** `returnTo`: where the email link and the pledge screen bring the member back (this ตี้, ready to join) */
export function JoinReadinessNotice({ member, returnTo }: { member: PublicMember; returnTo: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; message?: string; devUrl?: string }>({ status: 'idle' });
  const blocker = joinBlocker(member);
  if (!blocker) return null;

  if (blocker === 'pledge') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700" role="status">
        <p className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
          รับคำมั่นของคอมมูนิตี้ก่อนนะ
        </p>
        <p className="mt-1">4 ข้อสั้นๆ ที่ทุกคนรับร่วมกันก่อนออกไปเจอกัน แล้วกลับมาเข้าร่วมตี้นี้ได้เลย</p>
        <Link href={`/onboarding?step=pledge&returnTo=${encodeURIComponent(returnTo)}`} className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold">
          อ่านและรับคำมั่น
        </Link>
      </div>
    );
  }

  const send = async () => {
    setState({ status: 'sending' });
    try {
      const result = await memberActions.sendEmailVerification(returnTo);
      // Accounts on a deployment without a mailer are verified by this request; reload to pick that up
      if (result.alreadyVerified) {
        window.location.reload();
        return;
      }
      setState({ status: 'sent', devUrl: result.devVerifyUrl });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'ส่งลิงก์ไม่สำเร็จ ลองอีกครั้งนะ' });
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-bold text-slate-900">
        <MailCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
        ยืนยันอีเมลก่อนเข้าร่วมตี้
      </p>
      <p className="mt-1">
        {state.status === 'sent'
          ? <>ส่งลิงก์ไปที่ <strong>{member.email}</strong> แล้ว กดลิงก์ในอีเมล แล้วเราจะพากลับมาที่ตี้นี้</>
          : <>เพื่อให้คนที่จะไปเจอกันมั่นใจว่าเป็นคนจริง เราส่งลิงก์ไปที่ <strong>{member.email}</strong> ตอนสมัครแล้ว</>}
      </p>
      {state.status === 'error' && <p className="mt-1 font-semibold text-rose-700" role="alert">{state.message}</p>}
      {state.devUrl && (
        <a href={state.devUrl} className="mt-1 block text-xs font-semibold text-[#2563EB] underline break-all">
          (โหมดทดสอบ ไม่มีอีเมลจริง) เปิดลิงก์ยืนยัน
        </a>
      )}
      <button
        type="button"
        onClick={send}
        disabled={state.status === 'sending'}
        className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold disabled:opacity-60 cursor-pointer"
      >
        {state.status === 'sending' ? 'กำลังส่ง…' : state.status === 'sent' ? 'ส่งลิงก์อีกครั้ง' : 'ส่งลิงก์ยืนยันอีกครั้ง'}
      </button>
    </div>
  );
}
