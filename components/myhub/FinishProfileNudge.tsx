'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useMemberSession } from '@/lib/useMemberSession';

const HIDE_KEY = 'chillwaa:finish-profile-hidden';

/**
 * For a member who came in through a friend's "ชวนไป" and accepted the pledge only (owner 2026-11-12): one soft line
 * in My Hub asking the onboarding questions, so their feed and suggestions fit them. Never a wall; closing it hides it
 * on this device for a week.
 */
export function FinishProfileNudge() {
  const member = useMemberSession({ background: true }).member;
  const [hidden, setHidden] = useState(() => {
    try {
      return Number(localStorage.getItem(HIDE_KEY) ?? 0) > Date.now();
    } catch {
      return false;
    }
  });
  if (!member || member.onboarded || hidden) return null;
  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 86_400_000));
    } catch {}
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blue-50 pl-4 pr-2 py-2.5">
      <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" aria-hidden="true" />
      <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900">บอกเราหน่อยว่าชอบไปที่แบบไหน แนะนำจะตรงใจขึ้น</p>
      <Link href="/onboarding?returnTo=%2Fmyhub" className="shrink-0 h-9 px-4 inline-flex items-center rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold text-white">
        ตอบ 3 ข้อ
      </Link>
      <button type="button" onClick={hide} aria-label="ไว้ทีหลัง" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white cursor-pointer">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
