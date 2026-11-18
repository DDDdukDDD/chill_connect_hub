'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, HandHeart, Loader2, Trophy, Users, X } from 'lucide-react';
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
  const first = shortName(item.people[0].person.name);
  return `${first} และเพื่อนอีก ${item.people.length - 1} คน ทำชาเลนจ์ ${item.quest.title} · ${item.timeAgo}`;
}

export function ChallengeRowCircle({ item, onOpen, seen = false }: { item: ChallengeCircle; onOpen: () => void; seen?: boolean }) {
  const meaning = challengeMeaning(item);
  const faces = item.people.slice(0, 2);
  return (
    <li className="shrink-0 w-[80px]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={meaning}
        title={meaning}
        className="group w-full flex flex-col items-center gap-1.5 rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      >
        <span className={`relative rounded-full p-[3px] ${seen ? 'bg-slate-200' : 'bg-linear-to-tr from-[#7C3AED] via-[#C084FC] to-[#FBBF24]'}`}>
          <span className="block rounded-full bg-white p-[2px]">
            {item.quest.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- challenge covers come from many hosts
              <img src={optimizedImage(item.quest.image, 128)} alt="" className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-[#7C3AED]" aria-hidden="true" />
              </span>
            )}
          </span>
          {/* Two friends' faces on the picture's corner: the Circle is about them, the picture says which challenge */}
          <span className="absolute -top-1 -right-2 flex -space-x-2" aria-hidden="true">
            {faces.map((face) => <Face key={face.id} circle={face} size="w-6 h-6 text-[10px]" />)}
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white bg-[#7C3AED] text-white text-[11px] font-bold tabular-nums whitespace-nowrap" aria-hidden="true">
            <Users className="w-3 h-3" />
            {item.people.length}
          </span>
        </span>
        <span className={`w-full truncate text-center text-xs font-medium ${seen ? 'text-slate-500' : 'text-slate-700'}`} aria-hidden="true">
          เพื่อน {item.people.length} คน
        </span>
      </button>
    </li>
  );
}

function Face({ circle, size }: { circle: AchievementCircle; size: string }) {
  return circle.person.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
    <img src={avatarImage(circle.person.avatar)} alt="" className={`${size} rounded-full object-cover border-2 border-white bg-slate-100`} />
  ) : (
    <span className={`${size} rounded-full border-2 border-white bg-slate-200 font-bold text-slate-700 flex items-center justify-center`}>{nameInitial(circle.person.name)}</span>
  );
}

type Act = (circleId: string, action: 'cheer' | 'try') => Promise<boolean>;

export function ChallengeCircleBody({ item, onClose, onAct, onOpenMoment }: { item: ChallengeCircle; onClose: () => void; onAct: Act; onOpenMoment?: (momentId: string) => void }) {
  const [detail, setDetail] = useState<ChallengeCircleDetail | 'error' | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    fetch(`/api/circles/${encodeURIComponent(item.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setDetail(json?.success ? (json.detail as ChallengeCircleDetail) : 'error'))
      .catch(() => setDetail('error'));
  }, [item.id]);
  useEffect(load, [load]);
  const retry = () => {
    setDetail(undefined);
    load();
  };
  const ready = detail && detail !== 'error' ? detail : undefined;

  const run = async (circleId: string, action: 'cheer' | 'try') => {
    if (busy) return;
    setBusy(`${action}:${circleId}`);
    const ok = await onAct(circleId, action);
    setBusy(null);
    if (!ok || !ready) return;
    setDetail(action === 'cheer' ? { ...ready, cheered: [...ready.cheered, circleId] } : { ...ready, joined: true });
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

  return (
    <>
      <header className="flex items-center gap-3 px-4 pt-3 pb-3">
        <span className="flex -space-x-3 shrink-0" aria-hidden="true">
          {item.people.slice(0, 3).map((circle) => <Face key={circle.id} circle={circle} size="w-9 h-9 text-xs" />)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-slate-900 truncate">เพื่อน {item.people.length} คน</span>
          <span className="block text-xs text-slate-500">{item.timeAgo}</span>
        </span>
        <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="px-4">
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-slate-100">
          {item.quest.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- challenge covers come from many hosts
            <img src={optimizedImage(item.quest.image, 828)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-violet-50">
              <Trophy className="w-14 h-14 text-[#7C3AED]/40" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex-1 flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900 leading-snug">{item.quest.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            เพื่อน {item.people.length} คนทำชาเลนจ์นี้{item.finished > 0 ? ` ครบแล้ว ${item.finished} คน` : ''}
          </p>
        </div>

        <ul className="flex flex-col divide-y divide-slate-100">
          {item.people.map((circle) => {
            const cheered = ready?.cheered.includes(circle.id) ?? false;
            const name = shortName(circle.person.name);
            return (
              <li key={circle.id} className="flex items-center gap-3 py-2.5">
                <Face circle={circle} size="w-10 h-10 text-sm" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-slate-900 truncate">{name}</span>
                  {circle.momentId ? (
                    <Link href={`/moments/${encodeURIComponent(circle.momentId)}`} onClick={() => onOpenMoment?.(circle.momentId!)} className="block text-xs text-slate-500 hover:text-[#2563EB] hover:underline truncate">
                      {status(circle)} · {circle.timeAgo}
                    </Link>
                  ) : (
                    <span className="block text-xs text-slate-500 truncate">{status(circle)} · {circle.timeAgo}</span>
                  )}
                </span>
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
            <button type="button" onClick={retry} className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer">ลองใหม่</button>
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
