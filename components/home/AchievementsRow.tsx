'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { AchievementItem } from '@/lib/social/achievementsRow';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';
import { recall, remember } from '@/lib/clientMemory';

const MEMORY_KEY = 'achievements-row';

/**
 * "เพื่อนๆ กำลังออกไปใช้ชีวิต" above the feed, in the place other apps give stories (owner 2026-11-10: no stories; show who
 * achieved what). A gold ring and a trophy for a finished challenge, a violet ring and "2/3" for a step on the way.
 * A tap opens the post or the challenge. Nothing shows until someone has achieved something.
 */
export function AchievementsRow({ initial, onOpenMoment }: { initial?: AchievementItem[]; /** A circle that opens a post: the feed keeps its place, so that post's back link returns here */ onOpenMoment?: (momentId: string) => void }) {
  // From the server with the page (app/page.tsx), so the row never pops in above posts already on screen
  const [items, setItems] = useState<AchievementItem[]>(() => initial ?? recall<AchievementItem[]>(MEMORY_KEY) ?? []);
  useEffect(() => {
    if (initial) {
      remember(MEMORY_KEY, initial);
      return;
    }
    let active = true;
    fetch('/api/achievements', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active || !Array.isArray(json?.items)) return;
        remember(MEMORY_KEY, json.items);
        setItems(json.items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initial]);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="achievements-heading" className="mt-4">
      <h3 id="achievements-heading" className="text-[13px] font-semibold text-slate-500">เพื่อนๆ กำลังออกไปใช้ชีวิต</h3>
      <ul className="mt-2 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {items.map((item) => {
          const done = item.kind === 'finish';
          const name = item.isMe ? 'คุณ' : item.person.name;
          return (
            <li key={item.id} className="shrink-0 w-[72px]">
              <Link
                href={item.href}
                onClick={() => item.momentId && onOpenMoment?.(item.momentId)}
                aria-label={`${name} ${done ? 'พิชิตชาเลนจ์' : 'กำลังพิชิตชาเลนจ์'} ${item.quest.title}${done ? '' : ` ${item.current}/${item.total}`} · ${item.timeAgo}`}
                className="group flex flex-col items-center gap-1.5 rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <span className={`relative rounded-full p-[3px] ${done ? 'bg-linear-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FDE68A]' : 'bg-linear-to-tr from-[#7C3AED] to-[#C4B5FD]'}`}>
                  <span className="block rounded-full bg-white p-[2px]">
                    {item.person.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
                      <img src={avatarImage(item.person.avatar)} alt="" className="w-14 h-14 rounded-full object-cover bg-slate-100 group-hover:brightness-95 transition-[filter]" />
                    ) : (
                      <span className="w-14 h-14 rounded-full bg-slate-200 text-base font-bold text-slate-700 flex items-center justify-center">{nameInitial(item.person.name)}</span>
                    )}
                  </span>
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full border-2 border-white text-[11px] font-bold tabular-nums whitespace-nowrap ${done ? 'bg-[#F59E0B] text-white' : 'bg-[#7C3AED] text-white'}`}
                    aria-hidden="true"
                  >
                    {done ? <Trophy className="w-3 h-3" /> : `${item.current}/${item.total}`}
                  </span>
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-slate-700" aria-hidden="true">
                  {/* Under a 72px circle only the name before a bracket fits ("คุณปอนด์ (Pond)" → "คุณปอนด์"); the link's label keeps it whole */}
                  {name.replace(/\s*\(.*$/, '') || name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
