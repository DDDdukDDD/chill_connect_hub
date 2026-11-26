'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { ImageDown, Link2, Loader2, MessageCircle, Play, Share2 } from 'lucide-react';
import { useTripCard } from '@/components/trips/storyCard';
import { DialogShell } from '@/components/auth/DialogShell';
import { openLineShare } from '@/components/moments/lineInvite';
import { optimizedImage } from '@/lib/optimizedImage';
import { itemPicture, thaiDateRange, tripCover, type TripView } from '@/lib/trips/story';

/**
 * Right after publishing (owner 2026-11-27): the moment the author most wants to show the trip, so the ways to send it
 * come up at once. A private trip has no one to send it to, so it only says where to change that.
 */
export function TripPublishedDialog({ trip, onPlay, onToast, onClose }: { trip: TripView; onPlay: () => void; onToast: (message: string) => void; onClose: () => void }) {
  const url = `${typeof window === 'undefined' ? '' : window.location.origin}/trips/${trip.id}`;
  const cover = tripCover(trip);
  const row = 'flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3 text-left hover:bg-slate-50';
  const done = (action: () => void | Promise<void>) => async () => {
    await action();
    onClose();
  };
  const card = useTripCard(trip, onToast);
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <DialogShell onClose={onClose} size="sm" focusField={false} labelledBy="trip-published-title">
      <div className="text-center">
        {cover && (
          <div className="mx-auto size-24 overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
            <img src={optimizedImage(itemPicture(cover), 240)} alt="" className="size-full object-cover" />
          </div>
        )}
        <h2 id="trip-published-title" className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          เผยแพร่ทริปแล้ว
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {trip.title} · {thaiDateRange(trip.startsOn, trip.endsOn)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {trip.visibility === 'private'
            ? 'ทริปนี้เห็นเฉพาะคุณ เปลี่ยนเป็นทุกคนได้ที่หน้าแก้ไขทริป'
            : trip.visibility === 'followers'
              ? 'คนที่ติดตามคุณเห็นแล้ว ส่งให้เพื่อนที่ติดตามคุณได้เลย'
              : 'ส่งให้เพื่อนดูเรื่องเล่าทริปนี้กัน'}
        </p>
      </div>

      <ul className="-mx-2 mt-4">
        {trip.visibility !== 'private' && (
          <>
            <li>
              <button type="button" onClick={() => void card.go()} disabled={card.busy} className={row}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E11D48] text-white" aria-hidden>
                  {card.busy ? <Loader2 className="size-5 animate-spin" /> : <ImageDown className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{card.ready ? 'รูปพร้อมแล้ว แตะเพื่อแชร์' : 'รูปลงสตอรี่ IG'}</span>
                  <span className="block text-xs font-medium text-slate-500">รูปแนวตั้งพร้อมปก เส้นทาง และจำนวนวัน</span>
                </span>
              </button>
            </li>
            <li>
              <button type="button" onClick={done(() => openLineShare(`${trip.title}\nเรื่องเล่าทริปของฉันใน Chillwaa\n${url}`))} className={row}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-white" aria-hidden>
                  <MessageCircle className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">ส่งทาง LINE</span>
                  <span className="block text-xs font-medium text-slate-500">ให้เพื่อนในแชตหรือกลุ่มทริป</span>
                </span>
              </button>
            </li>
            {canShare && (
              <li>
                <button type="button" onClick={done(() => navigator.share({ title: trip.title, url }).catch(() => undefined))} className={row}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-hidden>
                    <Share2 className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">แชร์ผ่านแอปอื่น</span>
                    <span className="block text-xs font-medium text-slate-500">IG, Facebook, Messenger และอื่นๆ</span>
                  </span>
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={done(async () => {
                  const copied = await navigator.clipboard?.writeText(url).then(() => true).catch(() => false);
                  onToast(copied ? 'คัดลอกลิงก์แล้ว' : url);
                })}
                className={row}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-hidden>
                  <Link2 className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">คัดลอกลิงก์</span>
                  <span className="block text-xs font-medium text-slate-500">วางที่ไหนก็ได้</span>
                </span>
              </button>
            </li>
          </>
        )}
        <li>
          <button type="button" onClick={done(onPlay)} className={row}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-hidden>
              <Play className="size-5" />
            </span>
            <span className="block text-sm font-bold text-slate-900">ดูเรื่องที่เผยแพร่</span>
          </button>
        </li>
      </ul>
    </DialogShell>
  );
}
