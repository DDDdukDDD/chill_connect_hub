'use client';

import React, { useState } from 'react';
import { BADGE_HOT, RING_FRIENDS, RING_HOT } from '@/components/home/circleLook';
import ImgOr from '@/components/ImgOr';
import Link from 'next/link';
import { Check, Flame, HandHeart, Loader2, Trophy, UserPlus, Users, X } from 'lucide-react';
import type { AchievementCircle, ChallengeCircle, ChallengeCircleDetail } from '@/lib/social/circles';
import { dialogButton } from '@/components/auth/DialogShell';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';

/**
 * Friends on one challenge (Circles at scale, owner 2026-11-18): when two or more friends are on the same challenge,
 * the row shows one Circle "เพื่อน N คน" instead of N faces. Opened: the challenge, each friend with where they are and
 * a "ชื่นชม" of their own, and one button to join. Cheer and join act on each friend's own Circle id (circleActions.ts).
 */

const shortName = (name: string) => name.replace(/\s*\(.*$/, '') || name;

export function challengeMeaning(item: ChallengeCircle) {
  if (item.suggested) return `ชาเลนจ์กำลังฮิต ${item.quest.title} · ${item.suggested.total.toLocaleString()} คนกำลังทำ`;
  const first = shortName(item.people[0].person.name);
  return `${first} และเพื่อนอีก ${item.people.length - 1} คน ทำชาเลนจ์ ${item.quest.title} · ${item.timeAgo}`;
}

export function ChallengeRowCircle({ item, onOpen, seen = false }: { item: ChallengeCircle; onOpen: () => void; seen?: boolean }) {
  const meaning = challengeMeaning(item);
  // A hot challenge shows only its picture: strangers' faces in the row read as people the reader follows
  const hot = Boolean(item.suggested);
  // The newest one first, then the closest (owner 2026-11-20): a friend just followed has no closeness yet, so by
  // closeness alone their face never reached the corner and the Circle looked like the same old people
  const newest = item.people.reduce((a, b) => (b.at > a.at ? b : a), item.people[0]);
  const faces = hot || !newest ? [] : [newest, ...item.people.filter((p) => p.id !== newest.id)].slice(0, 2);
  // Orange is for my own Circles and blue for friends (circleLook.ts), so a hot challenge from strangers is violet
  const ring = seen ? 'bg-slate-200' : `bg-linear-to-tr ${hot ? RING_HOT : RING_FRIENDS}`;
  const rowFallback = (
    <span className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
      <Trophy className="w-7 h-7 text-[#7C3AED]" aria-hidden="true" />
    </span>
  );
  return (
    <li className="shrink-0 w-[80px]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={meaning}
        title={meaning}
        className="group w-full flex flex-col items-center gap-1.5 rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      >
        <span className={`relative rounded-full p-[3px] ${ring}`}>
          <span className="block rounded-full bg-white p-[2px]">
            {item.quest.image ? (
              <ImgOr src={optimizedImage(item.quest.image, 128)} fallback={rowFallback} className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
            ) : (
              rowFallback
            )}
          </span>
          {/* Two friends' faces on the picture's corner: the Circle is about them, the picture says which challenge */}
          <span className="absolute -top-1 -right-2 flex -space-x-2" aria-hidden="true">
            {faces.map((face) => <Face key={face.id} circle={face} size="w-6 h-6 text-[11px]" />)}
          </span>
          <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-white text-[11px] font-bold tabular-nums whitespace-nowrap ${hot ? BADGE_HOT : 'bg-[#1D4ED8]'}`} aria-hidden="true">
            {hot ? <Flame className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {hot ? compactCount(item.suggested!.total) : item.people.length}
          </span>
        </span>
        <span className={`w-full truncate text-center text-xs font-medium ${seen ? 'text-slate-500' : 'text-slate-700'}`} aria-hidden="true">
          {hot ? 'กำลังฮิต' : `เพื่อน ${item.people.length} คน`}
        </span>
      </button>
    </li>
  );
}

function FollowButton({ name, done, busy, disabled, onFollow }: { name: string; done: boolean; busy: boolean; disabled: boolean; onFollow: () => void }) {
  if (done) {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-100 text-sm font-bold text-slate-600">
        <Check className="w-4 h-4" aria-hidden="true" />
        ติดตามแล้ว
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onFollow}
      aria-label={`ติดตาม${name}`}
      className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-sm font-bold text-white cursor-pointer disabled:cursor-default focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
      ติดตาม
    </button>
  );
}

/** "1.2k" past 999, so the badge fits under an 80px circle */
const compactCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));

function Face({ circle, size }: { circle: AchievementCircle; size: string }) {
  const initials = <span className={`${size} rounded-full border-2 border-white bg-slate-200 font-bold text-slate-700 flex items-center justify-center`}>{nameInitial(circle.person.name)}</span>;
  return circle.person.avatar ? <ImgOr src={avatarImage(circle.person.avatar)} fallback={initials} className={`${size} rounded-full object-cover border-2 border-white bg-slate-100`} /> : initials;
}

type Act = (circleId: string, action: 'cheer' | 'try') => Promise<boolean>;

/**
 * The opened Circle. Its detail is loaded by CircleViewer, ahead of a swipe like every other Circle (TR-026);
 * `onDetail` keeps a cheer or a join there, so swiping away and back still shows it.
 */
export function ChallengeCircleBody({ item, detail, onDetail, onRetry, onClose, onAct, onFollow, onOpenMoment }: { item: ChallengeCircle; detail: ChallengeCircleDetail | 'error' | undefined; onDetail: (detail: ChallengeCircleDetail) => void; onRetry: () => void; onClose: () => void; onAct: Act; onFollow: (memberId: string, name: string) => Promise<boolean>; onOpenMoment?: (momentId: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  // A hot challenge: its people are not followed yet, so each gets ติดตาม instead of ชื่นชม
  const hot = item.suggested;
  const [followed, setFollowed] = useState<string[]>([]);
  const follow = async (memberId: string, name: string) => {
    if (busy) return;
    setBusy(`follow:${memberId}`);
    const ok = await onFollow(memberId, name);
    setBusy(null);
    if (ok) setFollowed((ids) => [...ids, memberId]);
  };
  const ready = detail && detail !== 'error' ? detail : undefined;

  const run = async (circleId: string, action: 'cheer' | 'try') => {
    if (busy) return;
    setBusy(`${action}:${circleId}`);
    const ok = await onAct(circleId, action);
    setBusy(null);
    if (!ok || !ready) return;
    onDetail(action === 'cheer' ? { ...ready, cheered: [...ready.cheered, circleId] } : { ...ready, joined: true });
  };

  const status = (circle: AchievementCircle) => (circle.kind === 'finish' ? 'ทำครบแล้ว' : `ทำไปแล้ว ${circle.current} จาก ${circle.total} ขั้น`);
  const main = !ready
    ? null
    : !ready.open
      ? 'ชาเลนจ์นี้จบแล้ว'
      : ready.finished
        ? 'คุณทำชาเลนจ์นี้ครบแล้ว'
        : ready.joined
          ? 'คุณทำชาเลนจ์นี้อยู่ด้วย'
          : null;
  const coverFallback = (
    <span className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-violet-50">
      <Trophy className="w-14 h-14 text-[#7C3AED]/40" aria-hidden="true" />
    </span>
  );

  return (
    <>
      <header className="flex items-center gap-3 px-4 pt-3 pb-3">
        <span className="flex -space-x-3 shrink-0" aria-hidden="true">
          {item.people.slice(0, 3).map((circle) => <Face key={circle.id} circle={circle} size="w-9 h-9 text-xs" />)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-slate-900 truncate">{hot ? 'ชาเลนจ์กำลังฮิต' : `เพื่อน ${item.people.length} คน`}</span>
          <span className="block text-xs text-slate-500">{hot ? `${hot.total.toLocaleString()} คนกำลังทำ` : item.timeAgo}</span>
        </span>
        <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="px-4">
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-slate-100">
          {item.quest.image ? (
            <ImgOr src={optimizedImage(item.quest.image, 828)} fallback={coverFallback} className="w-full h-full object-cover" />
          ) : (
            coverFallback
          )}
        </div>
      </div>

      <div className="px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex-1 flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900 leading-snug">{item.quest.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {hot
              ? `คนที่ทำชาเลนจ์นี้ล่าสุด ติดตามไว้ แล้วจะเห็นเขาใน Circles ของคุณ`
              : `เพื่อน ${item.people.length} คนทำชาเลนจ์นี้${item.finished > 0 ? ` ครบแล้ว ${item.finished} คน` : ''}`}
          </p>
        </div>

        <ul className="flex flex-col divide-y divide-slate-100">
          {item.people.map((circle) => {
            const cheered = ready?.cheered.includes(circle.id) ?? false;
            const name = shortName(circle.person.name);
            // A friend's face and name open their profile, as on the feed (TR-025)
            const profile = circle.isMe ? null : `/profile?id=${encodeURIComponent(circle.person.id)}`;
            return (
              <li key={circle.id} className="flex items-center gap-3 py-2.5">
                {profile ? (
                  <Link href={profile} aria-label={`ดูโปรไฟล์${name}`} className="shrink-0 rounded-full hover:brightness-95">
                    <Face circle={circle} size="w-10 h-10 text-sm" />
                  </Link>
                ) : (
                  <Face circle={circle} size="w-10 h-10 text-sm" />
                )}
                <span className="flex-1 min-w-0">
                  {profile ? (
                    <Link href={profile} className="block text-sm font-bold text-slate-900 truncate hover:underline">{name}</Link>
                  ) : (
                    <span className="block text-sm font-bold text-slate-900 truncate">{name}</span>
                  )}
                  {circle.momentId ? (
                    <Link href={`/moments/${encodeURIComponent(circle.momentId)}`} onClick={() => onOpenMoment?.(circle.momentId!)} className="block text-xs text-slate-500 hover:text-[#2563EB] hover:underline truncate">
                      {status(circle)} · {circle.timeAgo}
                    </Link>
                  ) : (
                    <span className="block text-xs text-slate-500 truncate">{status(circle)} · {circle.timeAgo}</span>
                  )}
                </span>
                {hot ? (
                  <FollowButton name={name} done={followed.includes(circle.person.id)} busy={busy === `follow:${circle.person.id}`} disabled={busy !== null} onFollow={() => follow(circle.person.id, name)} />
                ) : (
                <button
                  type="button"
                  disabled={!ready || cheered || busy !== null}
                  onClick={() => run(circle.id, 'cheer')}
                  aria-pressed={cheered}
                  aria-label={cheered ? `ชื่นชม${name}แล้ว` : `ชื่นชม${name}`}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-bold transition-colors cursor-pointer disabled:cursor-default focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E11D48]/40 ${cheered ? 'bg-[#FFF1F2] text-[#BE123C]' : 'bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#BE123C] disabled:opacity-60'}`}
                >
                  {busy === `cheer:${circle.id}` ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : cheered ? <Check className="w-4 h-4" aria-hidden="true" /> : <HandHeart className="w-4 h-4" aria-hidden="true" />}
                  {cheered ? 'ชื่นชมแล้ว' : 'ชื่นชม'}
                </button>
                )}
              </li>
            );
          })}
        </ul>

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
          <div className="mt-auto flex flex-col gap-2.5">
            {main ? (
              <p className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                {main}
              </p>
            ) : (
              <button type="button" disabled={busy !== null} onClick={() => run(item.people[0].id, 'try')} className={`${dialogButton.primary} w-full`}>
                {busy?.startsWith('try:') ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Users className="w-4 h-4" aria-hidden="true" />}
                ลองทำบ้าง
              </button>
            )}
            <Link href={item.href} className="self-center py-1 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">ดูชาเลนจ์</Link>
          </div>
        )}
      </div>
    </>
  );
}
