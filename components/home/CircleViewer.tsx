'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Loader2, Trophy, Users, X } from 'lucide-react';
import type { AchievementCircle, CircleItem } from '@/lib/social/circles';
import { GroupCircleBody, plainTeeTitle } from '@/components/home/GroupCircleView';
import type { CircleAction, CircleDetail } from '@/lib/social/circleActions';

/** A name without its bracket, as the Circle row shows it */
const shortName = (name: string) => name.replace(/\s*\(.*$/, '') || name;
import { useDialogBehavior, dialogButton } from '@/components/auth/DialogShell';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { FriendsDoingLine } from '@/components/social/FriendsDoingLine';
import { Toast } from '@/components/Toast';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';

/**
 * A Circle opened (Circles round A, owner 2026-11-16): the friend, what they did, who else is doing it, and one button
 * that turns seeing into doing. Full screen on phones, a dialog on computers. Swipe or ‹ › to the next Circle; no timer,
 * nothing disappears: these are not stories (owner 2026-11-10).
 */
export function CircleViewer({ items, start, onClose, onOpenMoment }: { items: CircleItem[]; start: number; onClose: () => void; onOpenMoment?: (momentId: string) => void }) {
  const [index, setIndex] = useState(start);
  const [details, setDetails] = useState<Record<string, CircleDetail | 'error'>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose, { focusField: false });

  const item = items[index];
  const detail = details[item.id];

  useEffect(() => {
    // A group Circle comes whole with the row (round B); only achievement Circles ask for more
    if (item.kind === 'group' || details[item.id]) return;
    let active = true;
    fetch(`/api/circles/${encodeURIComponent(item.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setDetails((all) => ({ ...all, [item.id]: json?.success ? (json.detail as CircleDetail) : 'error' })))
      .catch(() => active && setDetails((all) => ({ ...all, [item.id]: 'error' })));
    return () => {
      active = false;
    };
  }, [item.id, item.kind, details]);

  const go = useCallback((step: 1 | -1) => setIndex((i) => Math.min(items.length - 1, Math.max(0, i + step))), [items.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inviteOpen) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, inviteOpen]);

  // Swipe sideways on phones; a mostly vertical drag is left to scrolling
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const act = async (action: CircleAction) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${encodeURIComponent(item.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
      setDetails((all) => ({ ...all, [item.id]: json.detail as CircleDetail }));
      showToast(json.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  };

  if (typeof document === 'undefined') return null;
  const arrow = 'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg hover:bg-white cursor-pointer';

  return createPortal(
    <div className="fixed inset-0 z-[100002] flex items-center justify-center bg-black/80 backdrop-blur-xs sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {index > 0 && (
        <button type="button" onClick={() => go(-1)} aria-label="Circle ก่อนหน้า" className={`${arrow} left-4 lg:left-[calc(50%-300px)]`}>
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
      )}
      {index < items.length - 1 && (
        <button type="button" onClick={() => go(1)} aria-label="Circle ถัดไป" className={`${arrow} right-4 lg:right-[calc(50%-300px)]`}>
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        </button>
      )}
      <div
        ref={panelRef}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-label={item.kind === 'group' ? `Circle ตี้ ${plainTeeTitle(item.tee.title)}` : `Circle ของ${item.isMe ? 'คุณ' : shortName(item.person.name)}`}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] bg-white sm:rounded-[32px] overflow-y-auto flex flex-col focus:outline-hidden"
      >
        {/* Which Circle of how many: thin bars like a row of pages, never a countdown */}
        {items.length > 1 && (
          <div className="flex gap-1 px-4 pt-3" aria-hidden="true">
            {items.map((other, i) => (
              <span key={other.id} className={`h-1 flex-1 rounded-full ${i === index ? 'bg-slate-900' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}
        {item.kind === 'group' ? (
          <GroupCircleBody item={item} onClose={onClose} onOpenMoment={onOpenMoment} />
        ) : (
          <AchievementBody item={item} detail={detail} busy={busy} onAct={act} onInvite={() => setInviteOpen(true)} onClose={onClose} onOpenMoment={onOpenMoment} />
        )}
      </div>
      <Toast message={toast} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100003]" />
      {inviteOpen && detail && detail !== 'error' && (
        <InviteSheet target={{ type: 'quest', id: detail.quest.id }} place={detail.quest.title} onClose={() => setInviteOpen(false)} onDone={(message) => { setInviteOpen(false); showToast(message); }} />
      )}
    </div>,
    document.body
  );
}

/** An achievement Circle opened (round A): the friend, what they did, who else is doing it, one button */
function AchievementBody({ item, detail, busy, onAct, onInvite, onClose, onOpenMoment }: { item: AchievementCircle; detail: CircleDetail | 'error' | undefined; busy: boolean; onAct: (action: CircleAction) => void; onInvite: () => void; onClose: () => void; onOpenMoment?: (momentId: string) => void }) {
  const done = item.kind === 'finish';
  const name = item.isMe ? 'คุณ' : shortName(item.person.name);
  const picture = detail && detail !== 'error' ? detail.image : item.quest.image;
  return (
    <>
    <header className="flex items-center gap-3 px-4 pt-3 pb-3">
      {item.person.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
        <img src={avatarImage(item.person.avatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
      ) : (
        <span className="w-10 h-10 rounded-full bg-slate-200 text-sm font-bold text-slate-700 flex items-center justify-center">{nameInitial(item.person.name)}</span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-slate-900 truncate">{name}</span>
        <span className="block text-xs text-slate-500">{item.kind === 'doing' ? 'รับชาเลนจ์ไว้แล้ว' : item.timeAgo}</span>
      </span>
      <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </header>

    <div className="px-4">
      <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-3xl overflow-hidden bg-slate-100">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- post photos and challenge covers come from many hosts
          <img src={optimizedImage(picture, 828)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            <Trophy className="w-16 h-16 text-slate-300" aria-hidden="true" />
          </span>
        )}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-bold ${done ? 'bg-[#F59E0B] text-white' : item.kind === 'doing' ? 'bg-[#2563EB] text-white' : 'bg-[#7C3AED] text-white'}`}>
          {done ? <><Trophy className="w-3.5 h-3.5" aria-hidden="true" />ทำครบแล้ว</> : item.kind === 'doing' ? 'กำลังทำ' : `${item.current}/${item.total}`}
        </span>
      </div>
    </div>

    <div className="px-5 pt-4 pb-6 flex-1 flex flex-col gap-4">
      <div>
        <p className="text-lg font-bold text-slate-900 leading-snug">{item.quest.title}</p>
        <p className="mt-1 text-sm text-slate-600">
          {done ? `${name}ทำชาเลนจ์นี้ครบแล้ว` : item.kind === 'doing' ? 'คุณรับชาเลนจ์นี้ไว้ ยังไม่ได้โพสต์' : `${name}ทำไปแล้ว ${item.current} จาก ${item.total} ขั้น`}
        </p>
        {item.total && item.total > 1 && (
          <span className="mt-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: item.total }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < (item.current ?? 0) ? (done ? 'bg-[#F59E0B]' : 'bg-[#7C3AED]') : 'bg-slate-200'}`} />
            ))}
          </span>
        )}
      </div>

      {detail === undefined && (
        <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          กำลังโหลด…
        </p>
      )}
      {detail === 'error' && <p className="text-sm text-slate-500">เปิด Circle นี้ไม่ได้ตอนนี้ ลองใหม่อีกครั้งนะ</p>}
      {detail && detail !== 'error' && (
        <>
          {detail.doing && <FriendsDoingLine doing={detail.doing} />}
          <div className="mt-auto flex flex-col gap-2.5">
            <MainButton detail={detail} busy={busy} onAct={onAct} onInvite={onInvite} />
            <Link
              href={detail.momentId ? `/moments/${encodeURIComponent(detail.momentId)}` : `/challenges/${encodeURIComponent(detail.quest.id)}`}
              onClick={() => detail.momentId && onOpenMoment?.(detail.momentId)}
              className="self-center text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
            >
              {detail.momentId ? 'ดูโพสต์' : 'ดูชาเลนจ์'}
            </Link>
          </div>
        </>
      )}
    </div>
    </>
  );
}

/** The one button, or a calm line when there is nothing left to do here */
function MainButton({ detail, busy, onAct, onInvite }: { detail: CircleDetail; busy: boolean; onAct: (action: CircleAction) => void; onInvite: () => void }) {
  const full = `${dialogButton.primary} w-full`;
  const spinner = busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null;
  if (detail.cta === 'together') return <button type="button" disabled={busy} onClick={() => onAct('together')} className={full}>{spinner || <Users className="w-4 h-4" aria-hidden="true" />}ทำด้วยกัน</button>;
  if (detail.cta === 'try') return <button type="button" disabled={busy} onClick={() => onAct('try')} className={full}>{spinner}ลองทำบ้าง</button>;
  if (detail.cta === 'invite') return <button type="button" disabled={busy} onClick={() => onAct('invite')} className={full}>{spinner || <Users className="w-4 h-4" aria-hidden="true" />}ชวน{shortName(detail.person.name)}ทำด้วยกัน</button>;
  if (detail.cta === 'share_invite') return <button type="button" onClick={onInvite} className={full}><Users className="w-4 h-4" aria-hidden="true" />ชวนเพื่อนมาทำด้วย</button>;
  const line = !detail.quest.open
    ? 'ชาเลนจ์นี้จบแล้ว'
    : detail.invite === 'going'
      ? `${shortName(detail.person.name)}ทำด้วยกันกับคุณ`
      : detail.invite === 'asked'
        ? `ชวน${shortName(detail.person.name)}แล้ว รอคำตอบอยู่`
        : detail.finished
          ? 'คุณทำชาเลนจ์นี้ครบแล้ว'
          : 'คุณทำชาเลนจ์นี้อยู่ด้วย';
  return (
    <p className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      {line}
    </p>
  );
}
