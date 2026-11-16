'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, X } from 'lucide-react';
import type { GroupCircle } from '@/lib/social/groupCircles';
import { dialogButton } from '@/components/auth/DialogShell';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';

/**
 * Group Circles (Circles round B, owner 2026-11-16): a ตี้ that just ended, with proof that at least two people went
 * (lib/social/groupCircles.ts). In the row: a green ring, the group's photo, the head count. Opened: the photos, who
 * went, and one button: for those who went, review and pick who to meet again; for friends, the next ตี้ to join.
 */

/** A name without its bracket, as the Circle row shows it */
const shortName = (name: string) => name.replace(/\s*\(.*$/, '') || name;
/** Test-login ตี้ carry a "[ตัวอย่าง]" tag in the title (as MeetupTile) */
export const plainTeeTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

/** "คุณแนน คุณวิน" or "คุณแนน คุณวิน และอีก 3 คน" */
function namesLine(people: GroupCircle['people'], others: number) {
  const named = people.slice(0, 2).map((p) => shortName(p.name)).join(' ');
  return others > 0 ? `${named} และอีก ${others} คน` : named;
}

/** What the group did, in one line for the row's label and the opened Circle */
export function groupMeaning(item: GroupCircle) {
  const title = plainTeeTitle(item.tee.title);
  if (item.wasThere) return `คุณไปตี้ ${title} กับเพื่อนอีก ${item.count - 1} คน · ${item.timeAgo}`;
  const named = item.people.slice(0, 2);
  return `${namesLine(named, Math.max(0, item.count - named.length))} ไปตี้ ${title} ด้วยกัน · ${item.timeAgo}`;
}

/** The group's picture: the newest post from the ตี้, else its cover */
const coverOf = (item: GroupCircle) => item.photos[0]?.url || item.tee.image;

export function GroupRowCircle({ item, onOpen }: { item: GroupCircle; onOpen: () => void }) {
  const picture = coverOf(item);
  const meaning = groupMeaning(item);
  return (
    <li className="shrink-0 w-[80px]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={meaning}
        title={meaning}
        className="group w-full flex flex-col items-center gap-1.5 rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      >
        <span className="relative rounded-full p-[3px] bg-linear-to-tr from-[#059669] to-[#6EE7B7]">
          <span className="block rounded-full bg-white p-[2px]">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element -- post photos and ตี้ covers come from many hosts
              <img src={optimizedImage(picture, 128)} alt="" className="w-16 h-16 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <Users className="w-7 h-7 text-emerald-600" aria-hidden="true" />
              </span>
            )}
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap bg-[#059669] text-white" aria-hidden="true">
            <Users className="w-3 h-3" />
            {item.count}
          </span>
        </span>
        <span className="w-full truncate text-center text-xs font-medium text-slate-700" aria-hidden="true">
          {plainTeeTitle(item.tee.title)}
        </span>
      </button>
    </li>
  );
}

function Face({ person, size }: { person: GroupCircle['people'][number]; size: string }) {
  return person.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
    <img src={avatarImage(person.avatar)} alt="" className={`${size} rounded-full object-cover bg-slate-100 border-2 border-white`} />
  ) : (
    <span className={`${size} rounded-full bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center border-2 border-white`}>{nameInitial(person.name)}</span>
  );
}

/** The opened group Circle: header, photos, who went, one button */
export function GroupCircleBody({ item, onClose, onOpenMoment }: { item: GroupCircle; onClose: () => void; onOpenMoment?: (momentId: string) => void }) {
  const [shown, setShown] = useState(0);
  const photo = item.photos[shown] ?? item.photos[0];
  const picture = photo?.url || item.tee.image;
  const title = plainTeeTitle(item.tee.title);
  const others = Math.max(0, item.count - item.people.length - (item.wasThere ? 1 : 0));
  const who = item.wasThere ? (item.people.length ? `คุณกับ${namesLine(item.people, others)}` : `คุณกับเพื่อนอีก ${item.count - 1} คน`) : namesLine(item.people, others);
  const main = item.wasThere
    ? { href: item.tee.href, label: 'รีวิวและเลือกคนที่อยากเจออีก' }
    : { href: item.next.href, label: item.next.title ? 'ไปตี้ถัดไปของคนจัด' : 'หาตี้แบบนี้' };

  return (
    <>
      <header className="flex items-center gap-3 px-4 pt-3 pb-3">
        <span className="flex -space-x-3 shrink-0" aria-hidden="true">
          {item.people.slice(0, 3).map((person) => <Face key={person.id} person={person} size="w-10 h-10" />)}
          {item.people.length === 0 && (
            <span className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </span>
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-slate-900 truncate">{item.wasThere ? 'ตี้ที่คุณเพิ่งไป' : 'เพื่อนๆ เพิ่งไปตี้ด้วยกัน'}</span>
          <span className="block text-xs text-slate-500">{`จบไป ${item.timeAgo}`}</span>
        </span>
        <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="px-4">
        <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-3xl overflow-hidden bg-slate-100">
          {picture ? (
            // eslint-disable-next-line @next/next/no-img-element -- post photos and ตี้ covers come from many hosts
            <img src={optimizedImage(picture, 828)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center">
              <Users className="w-16 h-16 text-slate-300" aria-hidden="true" />
            </span>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-bold bg-[#059669] text-white">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            {`ไปกัน ${item.count} คน`}
          </span>
        </div>
        {/* More posts from the group: a thumbnail row, a tap shows that one */}
        {item.photos.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {item.photos.map((p, i) => (
              <button
                key={p.momentId}
                type="button"
                onClick={() => setShown(i)}
                aria-label={`ดูรูปที่ ${i + 1}`}
                aria-pressed={i === shown}
                className={`shrink-0 rounded-xl overflow-hidden cursor-pointer ring-2 ${i === shown ? 'ring-[#059669]' : 'ring-transparent'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- post photos come from uploads */}
                <img src={optimizedImage(p.url, 128)} alt="" className="w-14 h-14 object-cover bg-slate-100" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-6 flex-1 flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900 leading-snug">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{`${who} ไปตี้นี้ด้วยกัน`}</p>
          {/* The header shows up to three faces; the rest of the group only when there are more */}
          {item.people.length > 3 && (
            <span className="mt-3 flex -space-x-2" aria-hidden="true">
              {item.people.map((person) => <Face key={person.id} person={person} size="w-8 h-8" />)}
            </span>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2.5">
          {item.next.title && !item.wasThere && <p className="text-sm text-slate-600 text-center">{`ตี้ถัดไป: ${plainTeeTitle(item.next.title)}`}</p>}
          <Link href={main.href} className={`${dialogButton.primary} w-full`}>
            {!item.wasThere && <Users className="w-4 h-4" aria-hidden="true" />}
            {main.label}
          </Link>
          {photo ? (
            <Link
              href={`/moments/${encodeURIComponent(photo.momentId)}`}
              onClick={() => onOpenMoment?.(photo.momentId)}
              className="self-center text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
            >
              ดูโพสต์
            </Link>
          ) : (
            !item.wasThere && (
              <Link href={item.tee.href} className="self-center text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                ดูตี้นี้
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
}
