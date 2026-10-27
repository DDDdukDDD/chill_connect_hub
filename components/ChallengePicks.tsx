'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ScrollRow } from '@/components/ScrollRow';
import { ChallengeTile, assignReasons } from '@/components/ChallengeTile';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward } from '@/lib/questDisplay';
import type { QuestProgress } from '@/lib/useMyRewards';

const PICK_LIMIT = 6;

// Running before starting soon; within each, a shop reward and more people first
const score = (q: ChallengeQuest) =>
  (getQuestBrandReward(q).type === 'brand_partner' ? 300 : 0) +
  Math.min(q.participantsCount ?? 0, 500) / 2 +
  (q.daysRemaining !== undefined && q.daysRemaining <= 7 ? 100 : 0);

/**
 * "ชาเลนจ์สนุก แนะนำสำหรับคุณ" on the homepage: a playful row of small, tilted photos with an XP sticker,
 * the title, and one friendly reason to try it (`ChallengeTile`, the same tile as the /challenges grid). No card frames.
 * Members do not see challenges they joined, except on the signed-in home (`progress` given): there the ones they are
 * doing come first with a progress bar.
 */
export function ChallengePicks({ quests, joinedIds, isLoaded, progress }: { quests: ChallengeQuest[]; joinedIds: string[]; isLoaded: boolean; progress?: QuestProgress[] }) {
  // Challenges the member is doing and that are still open, closing soonest first
  const mine = useMemo(() => {
    if (!progress) return new Map<string, QuestProgress>();
    const doing = quests
      .filter((q) => joinedIds.includes(q.id) && q.status !== 'ended' && !(q.daysRemaining !== undefined && q.daysRemaining <= 0))
      .flatMap((q) => {
        const entry = progress.find((p) => p.questId === q.id);
        return entry && !entry.completed ? [[q, entry] as const] : [];
      })
      .sort(([a], [b]) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
      .slice(0, 3);
    return new Map(doing.map(([q, entry]) => [q.id, entry]));
  }, [quests, joinedIds, progress]);

  // Running challenges first, with the last place kept for one that starts soon (when there is one)
  const picks = useMemo(() => {
    const open = quests
      .filter((q) => q.status !== 'ended' && !(q.daysRemaining !== undefined && q.daysRemaining <= 0))
      .filter((q) => !joinedIds.includes(q.id))
      .sort((a, b) => score(b) - score(a));
    const running = open.filter((q) => !q.startsInDays);
    const soon = open.filter((q) => q.startsInDays).sort((a, b) => (a.startsInDays ?? 0) - (b.startsInDays ?? 0));
    const runningSlots = soon.length > 0 ? PICK_LIMIT - 1 : PICK_LIMIT;
    const suggested = [...running.slice(0, runningSlots), ...soon].slice(0, PICK_LIMIT - mine.size);
    return [...quests.filter((q) => mine.has(q.id)).sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)), ...suggested];
  }, [quests, joinedIds, mine]);
  const reasons = useMemo(() => assignReasons(picks.filter((q) => !mine.has(q.id))), [picks, mine]);

  const itemWidth = 'w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)]';

  if (!isLoaded) {
    return (
      <div className="flex gap-4 sm:gap-6 overflow-hidden pt-3" aria-hidden="true">
        {Array.from({ length: PICK_LIMIT }).map((_, i) => (
          <div key={i} className={`${itemWidth} shrink-0 aspect-square rounded-3xl bg-slate-100`} />
        ))}
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <p className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 text-sm font-medium text-slate-600">
        {joinedIds.length > 0 ? 'คุณร่วมทุกชาเลนจ์ที่เปิดอยู่แล้ว เก่งมาก! ' : 'ยังไม่มีชาเลนจ์ที่เปิดอยู่ตอนนี้ '}
        <Link href="/challenges" className="font-bold text-[#2563EB] hover:underline">ดูชาเลนจ์ทั้งหมด</Link>
      </p>
    );
  }

  return (
    // The row scrolls, so it clips whatever leaves its box: the padding gives tilted photos and XP stickers room,
    // and the matching negative margin keeps the photos lined up with the section heading
    <ScrollRow as="ul" className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:-mx-3 sm:px-3 sm:scroll-px-3 pt-4 pb-3">
      {picks.map((quest, i) => {
        const doing = mine.get(quest.id);
        return (
          <li key={quest.id} className={`${itemWidth} shrink-0 snap-start`}>
            <ChallengeTile quest={quest} index={i} reason={reasons.get(quest.id)} mine={doing} />
          </li>
        );
      })}
    </ScrollRow>
  );
}
