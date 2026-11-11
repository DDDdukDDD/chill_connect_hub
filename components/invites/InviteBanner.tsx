'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MomentAvatar } from '@/components/moments/CommentThread';
import type { InviteInfo } from '@/lib/social/friendPlans';

// Only a guest who taps "ไปกัน" needs it (it brings the sign-up buttons)
const InviteSignupSheet = dynamic(() => import('./InviteSignupSheet').then((m) => m.InviteSignupSheet), { ssr: false });

/**
 * The invitation on top of a page opened from "ชวนไป" (a notice or a LINE link, `?invite=<signed token>`), on every
 * section (owner 2026-11-11). A plan shows who is going and answers "ไปกัน" in one tap, which joins the group plan
 * and opens its chat in My Hub. A ตี้ invitation hands over to the page's own sign-up (`onJoinTee`).
 * The address is tidied so a reload does not ask again, but the invitation waits in this tab until it is answered.
 * "ไปกัน" keeps the reader on the page (the line becomes "คุณไปกับ … แล้ว · เปิดแผน"). A guest's "ไปกัน" opens InviteSignupSheet; sign-up carries the invitation in its return address (`&answer=1`), so it
 * survives a switch of browser, and back here the answer is sent by itself (owner 2026-11-11).
 */
export function InviteBanner({
  isLoggedIn,
  myId,
  onMessage,
  onJoinTee,
  className = '',
}: {
  isLoggedIn: boolean;
  myId?: string | null;
  onMessage: (message: string) => void;
  /** A ตี้: the page's own sign-up */
  onJoinTee?: () => void;
  className?: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  // Back from sign-up with ?answer=1: answer "ไปกัน" once the invitation is read
  const autoAnswer = useRef(false);
  const key = typeof window === 'undefined' ? '' : `chillwaa:invite:${window.location.pathname}`;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    let asked = query.get('invite');
    // Arrived through the link just now (not a reload or a sign-in later): counted once as an open
    const isArrival = Boolean(asked) && query.get('answer') !== '1';
    if (query.get('answer') === '1') autoAnswer.current = true;
    const storeKey = `chillwaa:invite:${window.location.pathname}`;
    if (asked) {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      url.searchParams.delete('answer');
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
    fetch(`/api/invites?token=${encodeURIComponent(asked)}${isArrival ? '&open=1' : ''}`, { cache: 'no-store' })
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

  const answer = async (inv: InviteInfo, tok: string) => {
    if (!isLoggedIn) return setIsSigningUp(true);
    if (inv.kind === 'tee') {
      forget();
      return onJoinTee?.();
    }
    setIsBusy(true);
    const result = await fetch('/api/invites/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tok }) })
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .catch(() => ({ ok: false, json: null }));
    setIsBusy(false);
    if (!result.ok || !result.json?.planId) return onMessage(result.json?.message || 'ตอบไม่สำเร็จ ลองอีกครั้งนะ');
    // Stay on the page (owner 2026-11-12): they came to look at the place; the line turns into "คุณไปกับ … แล้ว · เปิดแผน"
    setInfo({ ...inv, isIn: true, planId: result.json.planId, goingCount: inv.isIn ? inv.goingCount : inv.goingCount + 1 });
    onMessage('ไปกัน! นัดวันกับเพื่อนๆ ได้ในแผน');
  };

  // "ไม่สะดวก" (owner 2026-11-12): a member's no reaches the host, gently; a guest's "ไว้ก่อน" only hides the line
  const decline = (inv: InviteInfo, tok: string) => {
    // A guest's "ไว้ก่อน" only hides the line for now; the invitation is kept, so opening the page again asks again
    if (!(isLoggedIn && inv.kind === 'plan')) return setIsHidden(true);
    forget();
    void fetch('/api/invites/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tok, answer: 'no' }) }).catch(() => undefined);
    onMessage(`บอก ${inv.host.name} แล้วว่ารอบนี้ไม่สะดวก`);
  };

  const isOwn = Boolean(info && myId && info.host.id === myId);

  useEffect(() => {
    if (!autoAnswer.current || !info || !token || !isLoggedIn || isOwn) return;
    autoAnswer.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the answer is a request; its busy state is set once
    if (!info.isIn) void answer(info, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the invitation and the session are both in
  }, [info, token, isLoggedIn, isOwn]);

  // Opening one's own invitation asks nothing
  if (!info || !token || isOwn || isHidden) return null;

  // Where sign-up comes back to: a ตี้ to its own join (?join=1), a plan to this page answering by itself
  const signupReturn = () =>
    info.kind === 'tee' ? `${window.location.pathname}?join=1` : `${window.location.pathname}?invite=${encodeURIComponent(token)}&answer=1`;


  // The page already names the place: the line says who asked, the second line who is going (design pass 2026-11-12)
  const title = info.isIn ? `คุณไปกับ ${info.host.name} แล้ว` : info.kind === 'tee' ? `${info.host.name} ชวนคุณมาตี้นี้ด้วยกัน` : `${info.host.name} ชวนคุณไปด้วยกัน`;
  const sub = [info.dateLabel, info.goingCount > 1 ? `ไปกันแล้ว ${info.goingCount} คน` : ''].filter(Boolean).join(' · ');

  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-blue-50 px-4 py-3 ${className}`}>
      <span className="flex -space-x-2 shrink-0" aria-hidden="true">
        {info.going.slice(0, 3).map((p) => (
          <MomentAvatar key={p.id} name={p.name} src={p.avatar} className="w-9 h-9 text-xs ring-2 ring-blue-50" />
        ))}
      </span>
      <div className="flex-1 min-w-[10rem]">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {sub && <p className="text-[13px] text-slate-500">{sub}</p>}
      </div>
      {info.isIn && info.planId ? (
        <Link href={`/myhub?plan=${encodeURIComponent(info.planId)}`} onClick={forget} className="h-9 px-4 inline-flex items-center rounded-full bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50">
          เปิดแผน
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => decline(info, token)} className="h-9 px-4 rounded-full bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            {isLoggedIn && info.kind === 'plan' ? 'ไม่สะดวก' : 'ไว้ก่อน'}
          </button>
          <button type="button" onClick={() => void answer(info, token)} disabled={isBusy} className="h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold text-white disabled:opacity-60 cursor-pointer">
            {info.kind === 'tee' ? 'ลงทะเบียนไปด้วย' : 'ไปกัน'}
          </button>
        </div>
      )}
      {isSigningUp && <InviteSignupSheet info={info} returnTo={signupReturn()} onClose={() => setIsSigningUp(false)} />}
    </div>
  );
}
