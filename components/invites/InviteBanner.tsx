'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { MomentAvatar } from '@/components/moments/CommentThread';
import type { InviteInfo } from '@/lib/social/friendPlans';

/**
 * The invitation on top of a page opened from "ชวนไป" (a notice or a LINE link, `?invite=<signed token>`), on every
 * section (owner 2026-11-11). A plan shows who is going and answers "ไปกัน" in one tap, which joins the group plan
 * and opens its chat in My Hub. A ตี้ invitation hands over to the page's own sign-up (`onJoinTee`).
 * The address is tidied so a reload does not ask again, but the invitation waits in this tab until it is answered:
 * a guest signs up (or in) first and comes back here.
 */
export function InviteBanner({
  isLoggedIn,
  myId,
  onRequireLogin,
  onMessage,
  onJoinTee,
  className = '',
}: {
  isLoggedIn: boolean;
  myId?: string | null;
  onRequireLogin: () => void;
  onMessage: (message: string) => void;
  /** A ตี้: the page's own sign-up */
  onJoinTee?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const key = typeof window === 'undefined' ? '' : `chillwaa:invite:${window.location.pathname}`;

  useEffect(() => {
    let asked = new URLSearchParams(window.location.search).get('invite');
    const storeKey = `chillwaa:invite:${window.location.pathname}`;
    if (asked) {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      try {
        sessionStorage.setItem(storeKey, asked);
      } catch {}
    } else {
      try {
        asked = sessionStorage.getItem(storeKey);
      } catch {}
    }
    if (!asked) return;
    let active = true;
    fetch(`/api/invites?token=${encodeURIComponent(asked)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const found: InviteInfo | null = json?.invite ?? null;
        setToken(asked);
        setInfo(found);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // The reader signing in changes what the server says ("already going")
  }, [isLoggedIn]);

  const forget = () => {
    setInfo(null);
    try {
      sessionStorage.removeItem(key);
    } catch {}
  };

  // Opening one's own invitation asks nothing
  if (!info || !token || (myId && info.host.id === myId)) return null;

  const answer = async () => {
    if (info.kind === 'tee') {
      forget();
      if (!isLoggedIn) return onRequireLogin();
      return onJoinTee?.();
    }
    if (!isLoggedIn) return onRequireLogin();
    setIsBusy(true);
    const result = await fetch('/api/invites/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .catch(() => ({ ok: false, json: null }));
    setIsBusy(false);
    if (!result.ok || !result.json?.planId) return onMessage(result.json?.message || 'ตอบไม่สำเร็จ ลองอีกครั้งนะ');
    forget();
    onMessage('ไปกัน! เปิดแชตนัดวันกับเพื่อนๆ ได้เลย');
    router.push(`/myhub?plan=${encodeURIComponent(result.json.planId)}`);
  };

  const others = info.goingCount - 1;
  const line =
    info.kind === 'tee'
      ? `${info.host.name}ชวนคุณมาตี้นี้ด้วยกัน`
      : `${info.host.name}ชวนคุณไป${info.title}${others > 0 ? ` · ไปกันแล้ว ${info.goingCount} คน` : ''}`;

  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-blue-50 px-4 py-3 ${className}`}>
      {info.going.length > 1 ? (
        <span className="flex -space-x-2 shrink-0" aria-hidden="true">
          {info.going.slice(0, 3).map((p) => (
            <MomentAvatar key={p.id} name={p.name} src={p.avatar} className="w-8 h-8 text-xs ring-2 ring-blue-50" />
          ))}
        </span>
      ) : (
        <Send className="w-5 h-5 text-[#2563EB] -rotate-12 shrink-0" aria-hidden="true" />
      )}
      <p className="flex-1 min-w-[12rem] text-sm font-semibold text-slate-900">{line} ไปกันไหม?</p>
      {info.isIn && info.planId ? (
        <Link href={`/myhub?plan=${encodeURIComponent(info.planId)}`} onClick={forget} className="h-9 px-4 inline-flex items-center rounded-full bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50">
          คุณตอบไปกันแล้ว · เปิดแผน
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={forget} className="h-9 px-4 rounded-full bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            ไว้ก่อน
          </button>
          <button type="button" onClick={answer} disabled={isBusy} className="h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold text-white disabled:opacity-60 cursor-pointer">
            {info.kind === 'tee' ? 'ลงทะเบียนไปด้วย' : 'ไปกัน'}
          </button>
        </div>
      )}
    </div>
  );
}
