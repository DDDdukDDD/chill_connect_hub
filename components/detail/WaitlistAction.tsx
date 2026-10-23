'use client';

import React, { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { heroButton } from './DetailHero';

interface Status {
  inLine: boolean;
  position?: number;
  offeredUntil?: string;
  waiting: number;
}

/**
 * For a full ตี้: join the waiting list. When a seat frees up, the first person in line is told and the seat is held
 * for them for 2 hours (lib/social/waitlist.ts); then this shows "มีที่ว่างให้คุณ" with the join button.
 */
export function WaitlistAction({ eventId, isLoggedIn, onRequireLogin, onJoin }: { eventId: string; isLoggedIn: boolean; onRequireLogin: () => void; onJoin: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/waitlist`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => active && json && setStatus(json))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [eventId, isLoggedIn]);

  const toggle = async () => {
    if (!isLoggedIn) return onRequireLogin();
    setBusy(true);
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: status?.inLine ? 'leave' : 'join' }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (json?.success) setStatus(json);
    setBusy(false);
  };

  if (status?.offeredUntil) {
    const until = new Date(status.offeredUntil).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return (
      <>
        <button type="button" onClick={onJoin} className={heroButton.primary}>
          มีที่ว่างให้คุณ · ลงทะเบียน
        </button>
        <span className="text-sm font-semibold text-emerald-700">กันที่ไว้ให้ถึง {until} น.</span>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={Boolean(status?.inLine)} className={status?.inLine ? heroButton.done : heroButton.primary}>
        <BellRing className="w-5 h-5" aria-hidden="true" />
        {status?.inLine ? `ต่อคิวอยู่ ลำดับที่ ${status.position}` : 'ต่อคิวรายชื่อสำรอง'}
      </button>
      {status?.inLine && (
        <button type="button" onClick={toggle} disabled={busy} className="text-sm text-slate-600 underline underline-offset-2 cursor-pointer">
          ออกจากคิว
        </button>
      )}
    </>
  );
}
