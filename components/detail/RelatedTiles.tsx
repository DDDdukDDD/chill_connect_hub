'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import { MeetupTile } from '@/components/MeetupTile';
import { FairTile } from '@/components/FairTile';
import { SpotTile } from '@/components/SpotTile';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { ChallengeTile, assignReasons } from '@/components/ChallengeTile';
import { useMyActivity } from '@/lib/useMyActivity';

type SectionProps = {
  title: string;
  allHref?: string;
  allLabel?: string;
  titleClassName?: string;
  className?: string;
  /** Columns of the tile grid (a narrow column wants fewer) */
  gridClassName?: string;
};

function Section({
  title,
  allHref,
  allLabel = 'ดูทั้งหมด',
  titleClassName = 'text-lg sm:text-xl font-bold text-slate-900 tracking-tight',
  className = 'mt-12 sm:mt-16',
  // The /community and /challenges grid, so a tile is the same size on every page (owner 2026-10-27)
  gridClassName = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  children,
}: SectionProps & { children: React.ReactNode }) {
  return (
    <section className={`${className} space-y-4`} aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <h2 className={titleClassName}>{title}</h2>
        {allHref && <Link href={allHref} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0">{allLabel}</Link>}
      </div>
      <ul className={`grid ${gridClassName} gap-x-4 sm:gap-x-6 gap-y-8 pt-1`}>{children}</ul>
    </section>
  );
}

/**
 * ตี้ under a detail page, a place or a profile as the same tiles /community and the landing show (owner 2026-10-27),
 * in place of the older boxed related cards. A joined ตี้ gets its ring. `tileProps` sets a per-tile badge or link.
 */
export function RelatedMeetupTiles({
  events,
  tileProps,
  ...section
}: SectionProps & { events: EventItem[]; tileProps?: (event: EventItem) => { badge?: string; href?: string | null } }) {
  const { joinedIds } = useMyActivity();
  // "วันนี้" / "เสาร์นี้" need the browser's clock; the server HTML shows the plain day
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (events.length === 0) return null;
  return (
    <Section {...section}>
      {events.map((event) => (
        <li key={event.id}>
          <MeetupTile event={event} now={now} showHost isJoined={joinedIds.includes(event.id)} {...tileProps?.(event)} />
        </li>
      ))}
    </Section>
  );
}

/** อีเวนต์ under an อีเวนต์ page as the /events tiles, at the same grid as the ตี้ under a ตี้ page */
export function RelatedFairTiles({ events, ...section }: SectionProps & { events: EventItem[] }) {
  // "กำลังจัด" needs the browser's clock; the server HTML shows the plain dates
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (events.length === 0) return null;
  return (
    <Section {...section}>
      {events.map((event) => (
        <li key={event.id}>
          <FairTile event={event} now={now} />
        </li>
      ))}
    </Section>
  );
}

/** Places under a place page as the /spots tiles, at the same grid as the ตี้ and อีเวนต์ under theirs */
export function RelatedSpotTiles({ spots, ...section }: SectionProps & { spots: LifestyleSpotItem[] }) {
  if (spots.length === 0) return null;
  return (
    <Section {...section}>
      {spots.map((spot) => (
        <li key={spot.id}>
          <SpotTile spot={spot} />
        </li>
      ))}
    </Section>
  );
}

/** Challenges under a challenge page as the /challenges tiles (tilted photo, XP sticker, one reason line) */
export function RelatedChallengeTiles({ quests, ...section }: SectionProps & { quests: ChallengeQuest[] }) {
  if (quests.length === 0) return null;
  const reasons = assignReasons(quests);
  return (
    <Section {...section}>
      {quests.map((quest, index) => (
        <li key={quest.id}>
          <ChallengeTile quest={quest} index={index} reason={reasons.get(quest.id)} showDates />
        </li>
      ))}
    </Section>
  );
}
