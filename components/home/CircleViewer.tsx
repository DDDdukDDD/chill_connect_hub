'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, ChevronRight, HandHeart, Loader2, Trophy, Users, X } from 'lucide-react';
import type { AchievementCircle, CircleItem } from '@/lib/social/circles';
import { GroupCircleBody, plainTeeTitle } from '@/components/home/GroupCircleView';
import { ChallengeCircleBody } from '@/components/home/ChallengeCircleView';
import type { CircleAction, CircleDetail } from '@/lib/social/circleActions';
import { useDialogBehavior, dialogButton } from '@/components/auth/DialogShell';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { FriendsDoingLine } from '@/components/social/FriendsDoingLine';
import { Toast } from '@/components/Toast';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';

/** A name without its bracket, as the Circle row shows it */
const shortName = (name: string) => name.replace(/\s*\(.*$/, '') || name;

type PostFor = (quest: { id: string; title: string; withPlace?: boolean }) => void;

/**
 * A Circle opened (Circles round A, owner 2026-11-16): the friend, what they did, who else is doing it, and one button
 * that turns seeing into doing. Full screen on phones, a dialog on computers. Swipe sideways or ‹ › to the next Circle,
 * down to close; no timer, nothing disappears: these are not stories (owner 2026-11-10).
 * `onClose(changed)`: changed is true when something here changed the row (a join), so it is asked again.
 */
export function CircleViewer({ items, start, onClose, onSeen, onOpenMoment, onPost }: { items: CircleItem[]; start: number; onClose: (changed: boolean) => void; onSeen?: (id: string) => void; onOpenMoment?: (momentId: string) => void; onPost?: PostFor }) {
  const [index, setIndex] = useState(start);
  const [details, setDetails] = useState<Record<string, CircleDetail | 'error'>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const changed = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onClose(changed.current), [onClose]);
  useDialogBehavior(panelRef, close, { focusField: false });

  const item = items[index];
  const detail = details[item.id];

  useEffect(() => onSeen?.(item.id), [item.id, onSeen]);

  // This Circle's detail, and the next one's ahead of a swipe (group Circles come whole with the row)
  const asked = useRef(new Set<string>());
  const fetchDetail = useCallback((circle: CircleItem | undefined) => {
    // Group and friends-on-one-challenge Circles load their own detail
    if (!circle || circle.kind === 'group' || circle.kind === 'challenge' || asked.current.has(circle.id)) return;
    asked.current.add(circle.id);
    fetch(`/api/circles/${encodeURIComponent(circle.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setDetails((all) => ({ ...all, [circle.id]: json?.success ? (json.detail as CircleDetail) : 'error' })))
      .catch(() => setDetails((all) => ({ ...all, [circle.id]: 'error' })));
  }, []);
  useEffect(() => {
    fetchDetail(items[index]);
    fetchDetail(items[index + 1]);
  }, [index, items, fetchDetail]);
  const retry = () => {
    asked.current.delete(item.id);
    setDetails((all) => {
      const rest = { ...all };
      delete rest[item.id];
      return rest;
    });
    fetchDetail(item);
  };

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

  // Phones: swipe sideways for the next Circle, down from the top to close; a drag that is mostly scrolling is left alone
  const touch = useRef<{ x: number; y: number; top: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, top: panelRef.current?.scrollTop ?? 0 });
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    else if (dy > 110 && dy > Math.abs(dx) * 1.5 && from.top <= 0) close();
  };

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const act = async (action: CircleAction) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${encodeURIComponent(item.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
      setDetails((all) => ({ ...all, [item.id]: json.detail as CircleDetail }));
      if (action !== 'cheer') changed.current = true;
      showToast(json.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  };

  // A friends-on-one-challenge Circle: cheer or join one friend's own Circle; true when it worked
  const actOn = async (circleId: string, action: 'cheer' | 'try'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/circles/${encodeURIComponent(circleId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
      if (action !== 'cheer') changed.current = true;
      showToast(json.message);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
      return false;
    }
  };

  if (typeof document === 'undefined') return null;
  const arrow = 'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg hover:bg-white cursor-pointer';

  return createPortal(
    <div className="fixed inset-0 z-[100002] flex items-center justify-center bg-black/80 backdrop-blur-xs sm:p-6" onClick={(e) => e.target === e.currentTarget && close()}>
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
        aria-label={item.kind === 'group' ? `Circle ตี้ ${plainTeeTitle(item.tee.title)}` : item.kind === 'challenge' ? `Circle เพื่อน ${item.people.length} คน ชาเลนจ์ ${item.quest.title}` : `Circle ของ${item.isMe ? 'คุณ' : shortName(item.person.name)}`}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative w-full h-full pt-[env(safe-area-inset-top)] sm:pt-0 sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] bg-white sm:rounded-[32px] overflow-y-auto flex flex-col focus:outline-hidden"
      >
        {/* Which Circle of how many: thin bars like a row of pages, never a countdown */}
        {/* Past 20 the bars get too thin to read ("ดูทั้งหมด" opens up to 60): a count instead */}
        {items.length > 20 && (
          <p className="px-4 pt-3 text-xs font-bold text-slate-500 tabular-nums" aria-hidden="true">{index + 1} / {items.length}</p>
        )}
        {items.length > 1 && items.length <= 20 && (
          <div className="flex gap-1 px-4 pt-3" aria-hidden="true">
            {items.map((other, i) => (
              <span key={other.id} className={`h-1 flex-1 rounded-full ${i === index ? 'bg-slate-900' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}
        {item.kind === 'group' ? (
          <GroupCircleBody item={item} onClose={close} onOpenMoment={onOpenMoment} />
        ) : item.kind === 'challenge' ? (
          <ChallengeCircleBody key={item.id} item={item} onClose={close} onAct={actOn} onOpenMoment={onOpenMoment} />
        ) : (
          <AchievementBody
            item={item}
            detail={detail}
            busy={busy}
            onAct={act}
            onRetry={retry}
            onInvite={() => setInviteOpen(true)}
            onClose={close}
            onOpenMoment={onOpenMoment}
            onPost={onPost}
          />
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

/** The few words under the title: what this Circle says happened, or for my own, where I am */
function statusLine(item: AchievementCircle, detail: CircleDetail | undefined, name: string): string {
  if (item.kind === 'finish') return `${name}ทำชาเลนจ์นี้ครบแล้ว`;
  if (item.kind === 'step') return `${name}ทำไปแล้ว ${item.current} จาก ${item.total} ขั้น`;
  const progress = detail?.progress;
  // A warm nudge, not a reminder of what is missing (owner 2026-11-18)
  if (progress && progress.current > 0) return `คุณทำไปแล้ว ${progress.current} จาก ${progress.total} ขั้น ไปต่อกันเลย`;
  return 'ชาเลนจ์ที่คุณรับไว้ เริ่มขั้นแรกกันเลย';
}

/** An achievement Circle opened (round A): the friend, what they did, who else is doing it, the buttons */
function AchievementBody({ item, detail, busy, onAct, onRetry, onInvite, onClose, onOpenMoment, onPost }: { item: AchievementCircle; detail: CircleDetail | 'error' | undefined; busy: boolean; onAct: (action: CircleAction) => void; onRetry: () => void; onInvite: () => void; onClose: () => void; onOpenMoment?: (momentId: string) => void; onPost?: PostFor }) {
  const done = item.kind === 'finish';
  const ready = detail && detail !== 'error' ? detail : undefined;
  const name = item.isMe ? 'คุณ' : shortName(item.person.name);
  const picture = ready ? ready.image : item.quest.image;
  // My own doing Circle shows how far I am, once known
  const progress = item.kind === 'doing' ? ready?.progress : item.total ? { current: item.current ?? 0, total: item.total } : undefined;
  const barColor = done ? 'bg-[#F59E0B]' : item.kind === 'doing' ? 'bg-[#2563EB]' : 'bg-[#7C3AED]';
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
          <span className="block text-xs text-slate-500">{item.kind === 'doing' ? 'ชาเลนจ์ที่ทำอยู่' : item.timeAgo}</span>
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
            <span className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-violet-50">
              <Trophy className="w-16 h-16 text-[#7C3AED]/40" aria-hidden="true" />
            </span>
          )}
          <span className={`absolute left-3 top-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-bold ${done ? 'bg-[#F59E0B] text-white' : item.kind === 'doing' ? 'bg-[#2563EB] text-white' : 'bg-[#7C3AED] text-white'}`}>
            {done ? <><Trophy className="w-3.5 h-3.5" aria-hidden="true" />ทำครบแล้ว</> : item.kind === 'doing' ? 'กำลังทำ' : `${item.current}/${item.total}`}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex-1 flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900 leading-snug">{item.quest.title}</p>
          <p className="mt-1 text-sm text-slate-600">{statusLine(item, ready, name)}</p>
          {progress && progress.total > 1 && (
            <span className="mt-3 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: progress.total }, (_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < progress.current ? barColor : 'bg-slate-200'}`} />
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
        {detail === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">เปิด Circle นี้ไม่ได้ตอนนี้</p>
            <button type="button" onClick={onRetry} className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer">ลองใหม่</button>
          </div>
        )}
        {ready && (
          <>
            {ready.cheers && ready.cheers.count > 0 && <CheersLine cheers={ready.cheers} />}
            {ready.doing && <FriendsDoingLine doing={ready.doing} />}
            <div className="mt-auto flex flex-col gap-2.5">
              <Buttons detail={ready} busy={busy} onAct={onAct} onInvite={onInvite} onPost={onPost} />
              <Link
                href={ready.momentId ? `/moments/${encodeURIComponent(ready.momentId)}` : `/challenges/${encodeURIComponent(ready.quest.id)}`}
                onClick={() => ready.momentId && onOpenMoment?.(ready.momentId)}
                className="self-center py-1 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                {ready.momentId ? 'ดูโพสต์' : 'ดูชาเลนจ์'}
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** "คุณแนน และอีก 2 คนชื่นชมคุณ" on my own step or finish (owner 2026-11-18) */
function CheersLine({ cheers }: { cheers: NonNullable<CircleDetail['cheers']> }) {
  const first = cheers.people[0];
  const others = cheers.count - (first ? 1 : 0);
  return (
    <p className="flex items-center gap-2.5 rounded-2xl bg-[#FFF1F2] px-3.5 py-2.5 text-sm text-slate-800">
      <span className="flex -space-x-2 shrink-0" aria-hidden="true">
        {cheers.people.map((person) =>
          person.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
            <img key={person.id} src={avatarImage(person.avatar)} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white bg-slate-100" />
          ) : (
            <span key={person.id} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">{nameInitial(person.name)}</span>
          )
        )}
      </span>
      <span className="min-w-0">
        <HandHeart className="inline w-4 h-4 -mt-0.5 mr-1 text-[#E11D48]" aria-hidden="true" />
        {first ? <b className="font-bold">{shortName(first.name)}</b> : null}
        {first && others > 0 ? ` และอีก ${others} คน` : !first ? `${cheers.count} คน` : ''} ชื่นชมคุณ
      </span>
    </p>
  );
}

/**
 * The buttons. My own Circle, not finished: the next step first (post right here, or go where it is done), asking friends
 * second. A friend's Circle: what to do about it (do it too, together, ask them) beside "ชื่นชม"; when there is nothing
 * left to do, "ชื่นชม" alone with a calm line.
 */
function Buttons({ detail, busy, onAct, onInvite, onPost }: { detail: CircleDetail; busy: boolean; onAct: (action: CircleAction) => void; onInvite: () => void; onPost?: PostFor }) {
  const full = `${dialogButton.primary} w-full`;
  const spinner = busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null;
  const person = shortName(detail.person.name);

  if (detail.isMe) {
    const next = detail.next;
    const invite = detail.quest.open ? (
      <button type="button" onClick={onInvite} className={`${next ? dialogButton.quiet : dialogButton.primary} w-full`}>
        <Users className="w-4 h-4" aria-hidden="true" />
        ชวนเพื่อนมาทำด้วย
      </button>
    ) : null;
    const step = !next ? null : next.kind === 'post' ? (
      onPost ? (
        <button type="button" onClick={() => onPost({ id: detail.quest.id, title: detail.quest.title, withPlace: next.withPlace })} className={full}>
          {next.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : (
        <Link href={`/?share=general:&quest=${encodeURIComponent(detail.quest.id)}&questTitle=${encodeURIComponent(detail.quest.title)}${next.withPlace ? '&withPlace=1' : ''}`} className={full}>
          {next.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )
    ) : (
      <Link href={next.href} className={full}>
        {next.label}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    );
    if (!step && !invite) return <StatusLine text={detail.finished ? 'คุณทำชาเลนจ์นี้ครบแล้ว' : 'ชาเลนจ์นี้จบแล้ว'} />;
    return (
      <>
        {step}
        {invite}
      </>
    );
  }

  const cheer = (wide: boolean) =>
    detail.canCheer ? (
      <button
        type="button"
        disabled={busy || detail.cheered}
        onClick={() => onAct('cheer')}
        aria-pressed={detail.cheered}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-default focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E11D48]/40 ${wide ? 'w-full' : 'shrink-0'} ${detail.cheered ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#BE123C]'}`}
      >
        {detail.cheered ? <Check className="w-4 h-4" aria-hidden="true" /> : <HandHeart className="w-4 h-4" aria-hidden="true" />}
        {detail.cheered ? 'ชื่นชมแล้ว' : 'ชื่นชม'}
      </button>
    ) : null;

  let main: React.ReactNode = null;
  if (detail.cta === 'together') main = <button type="button" disabled={busy} onClick={() => onAct('together')} className={`${dialogButton.primary} flex-1 min-w-0`}>{spinner || <Users className="w-4 h-4" aria-hidden="true" />}ทำด้วยกัน</button>;
  else if (detail.cta === 'try') main = <button type="button" disabled={busy} onClick={() => onAct('try')} className={`${dialogButton.primary} flex-1 min-w-0`}>{spinner}ลองทำบ้าง</button>;
  else if (detail.cta === 'invite') main = <button type="button" disabled={busy} onClick={() => onAct('invite')} className={`${dialogButton.primary} flex-1 min-w-0`}>{spinner || <Users className="w-4 h-4" aria-hidden="true" />}ชวน{person}ทำด้วยกัน</button>;

  if (main) return <div className="flex gap-2.5">{cheer(false)}{main}</div>;
  const line = !detail.quest.open
    ? 'ชาเลนจ์นี้จบแล้ว'
    : detail.invite === 'going'
      ? `${person}ทำด้วยกันกับคุณ`
      : detail.invite === 'asked'
        ? `ชวน${person}แล้ว รอคำตอบอยู่`
        : detail.finished
          ? 'คุณทำชาเลนจ์นี้ครบแล้ว'
          : 'คุณทำชาเลนจ์นี้อยู่ด้วย';
  return (
    <>
      {cheer(true)}
      <StatusLine text={line} />
    </>
  );
}

function StatusLine({ text }: { text: string }) {
  return (
    <p className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      {text}
    </p>
  );
}
