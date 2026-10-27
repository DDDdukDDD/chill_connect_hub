'use client';

import React from 'react';
import { ScrollRow } from '@/components/ScrollRow';
import { Plus } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { MeetupTile } from '@/components/MeetupTile';

// Same widths as ChallengePicks, so the homepage photo rows line up
const TILE = 'w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start';

/**
 * "ตี้แนะนำ เปิดรับอยู่" on the homepage: a row of `MeetupTile`s the size of the challenge picks.
 * With `onCreate`, a last tile invites the member to start their own. `reasons` (signed-in home) puts why a meetup is
 * suggested, such as "เพราะคุณชอบสายคาเฟ่", in place of the place.
 * `onToggleSave` adds a heart on each photo (`savedIds` are the saved meetups).
 */
export function OpenMeetupTiles({
  events,
  isLoaded,
  onCreate,
  reasons,
  savedIds,
  onToggleSave,
}: {
  events: EventItem[];
  isLoaded: boolean;
  onCreate?: () => void;
  reasons?: Record<string, string>;
  savedIds?: string[];
  onToggleSave?: (eventId: string) => void;
}) {
  const row = 'flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-1 sm:scroll-px-1 pt-1 pb-2';

  if (!isLoaded) {
    return (
      <div className={row}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${TILE} aspect-square rounded-3xl bg-slate-100`} />
        ))}
      </div>
    );
  }

  const now = new Date();

  return (
    <ScrollRow className={row}>
      {events.map((event) => (
        <MeetupTile
          key={event.id}
          event={event}
          now={now}
          reason={reasons?.[event.id]}
          isSaved={savedIds?.includes(event.id) ?? false}
          onToggleSave={onToggleSave}
          className={TILE}
        />
      ))}
      {onCreate && (
      <button
        type="button"
        onClick={onCreate}
        className={`${TILE} group self-start aspect-square rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#F26430] hover:bg-orange-50/60 flex flex-col items-center justify-center gap-2.5 p-3 text-center cursor-pointer transition-colors`}
      >
        <span className="w-11 h-11 rounded-full bg-[#F26430] text-white flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform">
          <Plus className="w-5 h-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">ไม่เจอที่ใช่?</span>
          <span className="block mt-0.5 text-xs font-bold text-slate-600">ตั้งตี้เองเลย แล้วรอเพื่อนๆ มาร่วม</span>
        </span>
      </button>
      )}
    </ScrollRow>
  );
}
