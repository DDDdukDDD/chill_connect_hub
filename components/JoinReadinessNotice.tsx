'use client';

import React, { useState } from 'react';
import { getCommunityEventCategory } from '@/data/masterHub';
import { NIGHTLIFE_CATEGORY, nightlifeAgeMessage } from '@/lib/members/nightlife';
import type { EventItem } from '@/data/mockData';
import Link from 'next/link';
import { MailCheck, ShieldCheck } from 'lucide-react';
import type { PublicMember } from '@/lib/members/types';
import { memberActions } from '@/lib/useMemberSession';

type BarCheckEvent = Pick<EventItem, 'eventType' | 'lifestyleCategory' | 'category' | 'title' | 'tag'>;

/**
 * What a member still needs before the server lets them join a ตี้ (lib/members/activity.ts: a "new" account,
 * i.e. email not confirmed or pledge not accepted, is refused). Said up front in the confirm dialog instead of
 * as a refusal after "ยืนยันการเข้าร่วม".
 */
export function joinBlocker(member: PublicMember | null | undefined, event?: BarCheckEvent): 'email' | 'pledge' | 'age' | null {
  if (!member) return null;
  if (event && event.eventType !== 'public_venue' && getCommunityEventCategory(event as Parameters<typeof getCommunityEventCategory>[0]) === NIGHTLIFE_CATEGORY && nightlifeAgeMessage(member.birthYear)) return 'age';
  if (!member.trust.identityConfirmed) return 'email';
  if (!member.trust.pledged) return 'pledge';
  return null;
}

/**
 * The email is the only thing missing (BE-392): the member may still press join. The ตี้ then waits in My Hub, the
 * link goes out, and confirming turns it into a seat if one is still free. The join button stays on for this one
 */
export const joinWaitsForEmail = (member: PublicMember | null | undefined, event?: BarCheckEvent) => joinBlocker(member, event) === 'email';

/**
 * `returnTo`: where the email link and the pledge screen bring the member back (this ตี้, ready to join).
 * `pending`: this ตี้ already waits for the email (`devUrl`: the link on a server without a mailer)
 */
export function JoinReadinessNotice({ member, event, returnTo, pending = false, devUrl }: { member: PublicMember; event?: BarCheckEvent; returnTo: string; pending?: boolean; devUrl?: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; message?: string; devUrl?: string }>({ status: 'idle' });
  const blocker = joinBlocker(member, event);
  if (!blocker) return null;

  if (blocker === 'age') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700" role="status">
        <p className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
          {nightlifeAgeMessage(member.birthYear)}
        </p>
        {!member.birthYear && (
          <Link href={`/onboarding?returnTo=${encodeURIComponent(returnTo)}`} className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">
            ไปบอกปีเกิด
          </Link>
        )}
      </div>
    );
  }

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

  // Before pressing join: say the ตี้ can be kept now. The join itself sends the link, so no second button here
  if (!pending) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700" role="status">
        <p className="flex items-center gap-2 font-bold text-slate-900">
          <MailCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
          อีกนิดเดียว ยืนยันอีเมลก่อนนะ
        </p>
        <p className="mt-1">
          สมัครไว้ก่อนได้เลย เราเก็บตี้นี้ไว้ในมายฮับ แล้วส่งลิงก์ไปที่ <strong>{member.email}</strong> กดยืนยันแล้วได้ที่นั่งทันที ถ้ายังว่างอยู่
        </p>
      </div>
    );
  }

  const link = state.devUrl ?? devUrl;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-bold text-slate-900">
        <MailCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
        เก็บไว้ในมายฮับแล้ว รอยืนยันอีเมล
      </p>
      <p className="mt-1">
        กดลิงก์ที่ส่งไปที่ <strong>{member.email}</strong> แล้วได้ที่นั่งทันที ถ้ายังว่างอยู่ ตอนนี้ยังไม่ได้กันที่ไว้ให้ เพื่อให้ทุกคนที่ยืนยันแล้วไปได้ก่อน
      </p>
      {state.status === 'error' && <p className="mt-1 font-semibold text-rose-700" role="alert">{state.message}</p>}
      {link && (
        <a href={link} className="mt-1 block text-xs font-semibold text-[#2563EB] underline break-all">
          (โหมดทดสอบ ไม่มีอีเมลจริง) เปิดลิงก์ยืนยัน
        </a>
      )}
      <button
        type="button"
        onClick={send}
        disabled={state.status === 'sending'}
        className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold disabled:opacity-60 cursor-pointer"
      >
        {state.status === 'sending' ? 'กำลังส่ง…' : state.status === 'sent' ? 'ส่งแล้ว · ส่งอีกครั้ง' : 'ไม่ได้รับอีเมล? ส่งลิงก์อีกครั้ง'}
      </button>
    </div>
  );
}
