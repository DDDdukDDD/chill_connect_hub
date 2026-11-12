'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, MessageCircle, Search, Share2 } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { MomentAvatar } from '@/components/moments/CommentThread';
import type { TagFriend } from '@/components/moments/FriendTagPicker';
import { openLineShare } from '@/components/moments/lineInvite';
import { APPS_INVITE_HINT, appsInviteCopied, useAppsInvite } from './useAppsInvite';

/** Friends one plan can hold besides the one who asks (lib/social/socialRules.ts INVITE_MAX_FRIENDS) */
export const MAX_INVITES = 15;

export type InviteTargetType = 'spot' | 'fair' | 'community' | 'quest' | 'moment';
export interface InviteTarget {
  type: InviteTargetType;
  id: string;
}

type SendResult = { ok: boolean; message?: string; invited?: number; link?: string; dateLabel?: string };

/** POST /api/invites: friends picked get a notice; the link is the same invitation for LINE */
export async function sendInvites(target: InviteTarget, to: string[] = [], day?: string): Promise<SendResult> {
  try {
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, to, ...(day ? { day } : {}) }) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message, invited: json?.invited, link: json?.share || json?.link, dateLabel: json?.dateLabel };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

/**
 * The words LINE opens with (owner 2026-11-11): the invitation on its own line, then the short link on the next, so the
 * chat reads like a friend asking and LINE's preview card (the /i/<code> page) carries the picture.
 */
/** With a day ("ส. 15 พ.ย.") it leads: an invitation with a day gets answered more often (owner 2026-11-12) */
export const inviteWords = (place: string, isTee = false, dateLabel?: string) =>
  `${dateLabel ? `${dateLabel} ` : ''}${place ? (isTee ? `ไปตี้ "${place}" ด้วยกันไหม?` : `ไป${place}กันไหม?`) : 'ไปด้วยกันไหม?'} กดดูแล้วตอบได้เลย`;
export const inviteLineText = (place: string, link: string, isTee = false, dateLabel?: string) => `${inviteWords(place, isTee, dateLabel)}
${window.location.origin}${link}`;

/** The coming Saturday and Sunday in Bangkok ("YYYY-MM-DD"); today counts when it is one */
function weekendDays(): { sat: string; sun: string } {
  const today = new Date(Date.now() + 7 * 3600e3);
  const at = (weekday: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7));
    return d.toISOString().slice(0, 10);
  };
  return { sat: at(6), sun: at(0) };
}

/**
 * "ชวนไป" (owner 2026-11-10; every section and up to 15 friends, 2026-11-11). Friends who follow each other are listed
 * to pick, several at once; LINE reaches the ones not on Chillwaa yet. Everyone who answers "ไปกัน" lands in one group
 * plan and its chat; a ตี้ invitation leads to the ตี้'s own sign-up instead.
 */
export function InviteSheet({ target, place, onClose, onDone, exceptPlanId }: { target: InviteTarget; place: string; onClose: () => void; onDone: (message: string) => void; exceptPlanId?: string }) {
  const [friends, setFriends] = useState<TagFriend[] | null>(null);
  // "คุณมีนัดที่นี่แล้ว" (owner 2026-11-12): plans the member is already going on here lead back to their chat
  const [plans, setPlans] = useState<{ id: string; title: string; dateLabel?: string; people: number; inPlan?: string[] }[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`/api/invites?type=${encodeURIComponent(target.type)}&id=${encodeURIComponent(target.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && Array.isArray(json?.plans) && setPlans(json.plans))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [target.type, target.id]);
  const planned = plans.filter((p) => p.id !== exceptPlanId);
  // Friends already asked to (or going on) the member's own plan here: asking again would do nothing
  const alreadyIn = useMemo(() => new Set(plans.flatMap((p) => p.inPlan ?? [])), [plans]);
  // Invitations join one's own plan here; when it already has a day, a day picked now would be ignored
  const ownHasDay = plans.some((p) => p.inPlan && p.dateLabel);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const isTee = target.type === 'community';
  // "ไปวันไหน" (owner 2026-11-12): an invitation with a day gets answered more often. Optional; a ตี้ has its own date
  // and a challenge has none. Left unset, the plan picks its day later ("วันไหนว่าง").
  const canPickDay = !isTee && target.type !== 'quest';
  const weekend = useMemo(() => weekendDays(), []);
  const [day, setDay] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/members/friends', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setFriends(json?.success && Array.isArray(json.friends) ? json.friends : []))
      .catch(() => active && setFriends([]));
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (friends ?? []).filter((friend) => !q || friend.name.toLowerCase().includes(q));
  }, [friends, query]);

  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_INVITES ? [...list, id] : list));

  const send = async () => {
    if (picked.length === 0 || isSending) return;
    setIsSending(true);
    setError('');
    const result = await sendInvites(target, picked, day || undefined);
    setIsSending(false);
    if (!result.ok) return setError(result.message || 'ส่งคำชวนไม่สำเร็จ ลองอีกครั้งนะ');
    onDone(picked.length === 1 ? 'ส่งคำชวนให้เพื่อนแล้ว' : `ส่งคำชวนให้เพื่อน ${picked.length} คนแล้ว`);
  };

  const apps = useAppsInvite(target, place, (how) => (how === 'copied' ? onDone(appsInviteCopied) : onClose()), setError, day || undefined);

  const viaLine = async () => {
    setError('');
    const result = await sendInvites(target, [], day || undefined);
    if (!result.ok || !result.link) return setError(result.message || 'ทำลิงก์ชวนไม่สำเร็จ ลองอีกครั้งนะ');
    openLineShare(inviteLineText(place, result.link, isTee, result.dateLabel));
  };

  return (
    <DialogShell onClose={onClose} title="ชวนไป" subtitle={place ? (isTee ? `ชวนเพื่อนมาตี้ ${place}` : `ชวนเพื่อนไป ${place} ด้วยกัน`) : 'ชวนเพื่อนไปด้วยกัน'} size="sm">
      {planned.length > 0 && (
        <div className="mb-4 rounded-2xl bg-blue-50 px-3 py-2.5">
          <p className="text-[13px] font-semibold text-[#1D4ED8]">คุณมีนัดที่นี่แล้ว</p>
          <ul className="mt-1.5 space-y-1.5">
            {planned.map((plan) => (
              <li key={plan.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-sm text-slate-800">
                  <span className="block truncate font-semibold text-slate-900">{plan.dateLabel ? `นัดกัน ${plan.dateLabel}` : 'ยังไม่ได้นัดวัน'}</span>
                  <span className="block text-[13px] text-slate-600">ไปกัน {plan.people} คน</span>
                </span>
                {/* White, not blue: inviting stays the sheet's one primary button */}
                <Link href={`/myhub?plan=${encodeURIComponent(plan.id)}&chat=1`} onClick={onClose} className="shrink-0 h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-50 text-[13px] font-bold text-[#1D4ED8] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  ไปที่แชตนัด
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {canPickDay && !ownHasDay && (
        <div className="mb-4" role="radiogroup" aria-label="ไปวันไหน">
          <p className="mb-2 text-[13px] font-semibold text-slate-500">ไปวันไหน</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'ยังไม่ระบุ' },
              { value: weekend.sat, label: 'เสาร์นี้' },
              { value: weekend.sun, label: 'อาทิตย์นี้' },
            ].map((option) => {
              const on = day === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDay(option.value)}
                  className={`h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer transition-colors ${on ? 'bg-blue-50 text-[#1D4ED8] ring-1 ring-[#2563EB]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Friends on Chillwaa first (owner 2026-11-12: our chat leads); LINE and other apps for everyone else, below */}
      {friends === null ? (
        <div className="py-8 flex justify-center" role="status" aria-label="กำลังโหลดรายชื่อเพื่อน">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <p className="py-3 text-sm text-slate-600">เพื่อนที่ติดตามกันทั้งสองฝ่ายจะขึ้นที่นี่ ให้ชวนได้ในแอป</p>
      ) : (
        <>
          <p className="mb-2 text-[13px] font-semibold text-slate-500">เพื่อนใน Chillwaa · เลือกได้สูงสุด {MAX_INVITES} คน</p>
          {friends.length > 6 && (
            <label className="relative block mb-3">
              <span className="sr-only">ค้นหาเพื่อน</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาเพื่อน"
                className="w-full h-11 pl-10 pr-4 rounded-full bg-slate-100 text-base sm:text-sm text-slate-900 placeholder:text-slate-500 outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
            </label>
          )}
          <ul className="max-h-[45dvh] overflow-y-auto -mx-2 mb-4" aria-label="เพื่อนที่ชวนได้">
            {shown.map((friend) => {
              const isPicked = picked.includes(friend.id);
              const isIn = alreadyIn.has(friend.id);
              const isFull = !isPicked && picked.length >= MAX_INVITES;
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => toggle(friend.id)}
                    aria-pressed={isPicked}
                    disabled={isFull || isIn}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${isIn ? '' : 'hover:bg-slate-50 disabled:opacity-40'}`}
                  >
                    <MomentAvatar name={friend.name} src={friend.avatar} className="w-10 h-10 text-sm" />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900">{friend.name}</span>
                    {isIn ? (
                      <span className="shrink-0 text-xs text-slate-500">ชวนแล้ว</span>
                    ) : (
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPicked ? 'bg-slate-900 text-white' : 'border-2 border-slate-300'}`} aria-hidden="true">
                        {isPicked && <Check className="w-4 h-4" />}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={send} disabled={picked.length === 0 || isSending} className={`${dialogButton.primary} w-full`}>
            {isSending ? 'กำลังส่ง…' : picked.length ? `ชวน ${picked.length} คน` : 'เลือกเพื่อนที่จะชวน'}
          </button>
        </>
      )}

      <div className={friends && friends.length > 0 ? 'mt-5 pt-4 border-t border-slate-100' : 'mt-1'}>
        <p className="mb-1 text-[13px] font-semibold text-slate-500">เพื่อนที่ยังไม่อยู่ใน Chillwaa</p>
        <button type="button" onClick={viaLine} className="w-full flex items-center gap-3 py-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">
          <span className="w-10 h-10 shrink-0 rounded-full bg-[#06C755] text-white flex items-center justify-center" aria-hidden="true">
            <MessageCircle className="w-5 h-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">ชวนทาง LINE</span>
            <span className="block text-[13px] text-slate-500">ส่งให้เพื่อนในแชต LINE</span>
          </span>
        </button>
        <button type="button" onClick={() => void apps.go()} disabled={apps.busy} className="w-full flex items-center gap-3 py-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">
          <span className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center" aria-hidden="true">
            {apps.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{apps.isReady ? 'คำชวนพร้อมแล้ว แตะอีกครั้งเพื่อส่ง' : 'ชวนผ่านแอปอื่น'}</span>
            <span className="block text-[13px] text-slate-500">{APPS_INVITE_HINT}</span>
          </span>
        </button>
      </div>
      {error &&<p className="mt-3 text-sm font-medium text-rose-600" role="alert">{error}</p>}
    </DialogShell>
  );
}
