'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

type SendResult = { ok: boolean; message?: string; invited?: number; link?: string };

/** POST /api/invites: friends picked get a notice; the link is the same invitation for LINE */
export async function sendInvites(target: InviteTarget, to: string[] = []): Promise<SendResult> {
  try {
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, to }) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message, invited: json?.invited, link: json?.share || json?.link };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

/**
 * The words LINE opens with (owner 2026-11-11): the invitation on its own line, then the short link on the next, so the
 * chat reads like a friend asking and LINE's preview card (the /i/<code> page) carries the picture.
 */
export const inviteWords = (place: string, isTee = false) =>
  place ? (isTee ? `ไปตี้ "${place}" ด้วยกันไหม? กดดูแล้วตอบได้เลย` : `ไป${place}กันไหม? กดดูแล้วตอบได้เลย`) : 'ไปด้วยกันไหม? กดดูแล้วตอบได้เลย';
export const inviteLineText = (place: string, link: string, isTee = false) => `${inviteWords(place, isTee)}
${window.location.origin}${link}`;

/**
 * "ชวนไป" (owner 2026-11-10; every section and up to 15 friends, 2026-11-11). Friends who follow each other are listed
 * to pick, several at once; LINE reaches the ones not on Chillwaa yet. Everyone who answers "ไปกัน" lands in one group
 * plan and its chat; a ตี้ invitation leads to the ตี้'s own sign-up instead.
 */
export function InviteSheet({ target, place, onClose, onDone }: { target: InviteTarget; place: string; onClose: () => void; onDone: (message: string) => void }) {
  const [friends, setFriends] = useState<TagFriend[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const isTee = target.type === 'community';

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
    const result = await sendInvites(target, picked);
    setIsSending(false);
    if (!result.ok) return setError(result.message || 'ส่งคำชวนไม่สำเร็จ ลองอีกครั้งนะ');
    onDone(picked.length === 1 ? 'ส่งคำชวนให้เพื่อนแล้ว' : `ส่งคำชวนให้เพื่อน ${picked.length} คนแล้ว`);
  };

  const apps = useAppsInvite(target, place, (how) => (how === 'copied' ? onDone(appsInviteCopied) : onClose()), setError);

  const viaLine = async () => {
    setError('');
    const result = await sendInvites(target);
    if (!result.ok || !result.link) return setError(result.message || 'ทำลิงก์ชวนไม่สำเร็จ ลองอีกครั้งนะ');
    openLineShare(inviteLineText(place, result.link, isTee));
  };

  return (
    <DialogShell onClose={onClose} title="ชวนไป" subtitle={place ? (isTee ? `ชวนเพื่อนมาตี้ ${place}` : `ชวนเพื่อนไป ${place} ด้วยกัน`) : 'ชวนเพื่อนไปด้วยกัน'} size="sm">
      <button type="button" onClick={viaLine} className="w-full flex items-center gap-3 py-2 mb-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer">
        <span className="w-10 h-10 shrink-0 rounded-full bg-[#06C755] text-white flex items-center justify-center" aria-hidden="true">
          <MessageCircle className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">ชวนทาง LINE</span>
          <span className="block text-[13px] text-slate-500">ส่งลิงก์ให้เพื่อนที่ยังไม่ได้อยู่ใน Chillwaa</span>
        </span>
      </button>
      <button type="button" onClick={() => void apps.go()} disabled={apps.busy} className="w-full flex items-center gap-3 py-2 mb-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer">
        <span className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center" aria-hidden="true">
          {apps.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{apps.isReady ? 'คำชวนพร้อมแล้ว แตะอีกครั้งเพื่อส่ง' : 'ชวนผ่านแอปอื่น'}</span>
          <span className="block text-[13px] text-slate-500">{APPS_INVITE_HINT}</span>
        </span>
      </button>

      {friends === null ? (
        <div className="py-8 flex justify-center" role="status" aria-label="กำลังโหลดรายชื่อเพื่อน">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <p className="py-4 text-center text-sm font-medium text-slate-600">เพื่อนที่ติดตามกันทั้งสองฝ่ายจะขึ้นที่นี่ ให้ชวนได้ในแอป</p>
      ) : (
        <>
          <p className="mt-1 mb-2 text-[13px] font-semibold text-slate-500">เพื่อนใน Chillwaa · เลือกได้สูงสุด {MAX_INVITES} คน</p>
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
              const isFull = !isPicked && picked.length >= MAX_INVITES;
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => toggle(friend.id)}
                    aria-pressed={isPicked}
                    disabled={isFull}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MomentAvatar name={friend.name} src={friend.avatar} className="w-10 h-10 text-sm" />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900">{friend.name}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPicked ? 'bg-slate-900 text-white' : 'border-2 border-slate-300'}`} aria-hidden="true">
                      {isPicked && <Check className="w-4 h-4" />}
                    </span>
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
      {error && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{error}</p>}
    </DialogShell>
  );
}
