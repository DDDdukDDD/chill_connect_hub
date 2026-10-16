'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Zap, Gift, Clock, Flame, CalendarClock, Footprints } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward } from '@/lib/questDisplay';
import type { QuestProgress } from '@/lib/useMyRewards';

const PICK_LIMIT = 6;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

// Each photo leans a little, like snaps stuck on a wall; hover straightens it
const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1'];
const XP_TILTS = ['-rotate-6', 'rotate-3', '-rotate-3', 'rotate-6', '-rotate-6', 'rotate-3'];

type Reason = { kind: string; text: string; Icon: typeof Zap; tone: string };

const stopsOf = (quest: ChallengeQuest) => Math.max(1, quest.rule?.count ?? (parseInt(quest.total, 10) || 1));

// Why it is fun to try, in a friend's voice, from facts on the challenge only
function reasonsFor(quest: ChallengeQuest): Reason[] {
  const reward = getQuestBrandReward(quest);
  const people = quest.participantsCount ?? 0;
  const stops = stopsOf(quest);
  const list: Reason[] = [];
  if (quest.startsInDays) list.push({ kind: 'soon', text: `อีก ${quest.startsInDays} วันเริ่ม จองที่ไว้เลย`, Icon: CalendarClock, tone: 'text-sky-700' });
  if (!quest.startsInDays && quest.daysRemaining !== undefined && quest.daysRemaining <= 7) {
    list.push({ kind: 'closing', text: `เหลือ ${quest.daysRemaining} วัน รีบเลย!`, Icon: Clock, tone: 'text-rose-600' });
  }
  if (stops <= 2) list.push({ kind: 'easy', text: stops === 1 ? 'ไปที่เดียวก็ครบ ง่ายมาก' : 'ไปแค่ 2 ที่ ชิลๆ', Icon: Footprints, tone: 'text-emerald-700' });
  if (people >= 100) list.push({ kind: 'popular', text: `เพื่อนๆ ลองแล้ว ${people.toLocaleString()} คน`, Icon: Flame, tone: 'text-orange-600' });
  if (reward.type === 'brand_partner') list.push({ kind: 'reward', text: `ได้ของจาก ${reward.partnerName}`, Icon: Gift, tone: 'text-amber-700' });
  list.push({ kind: 'stops', text: `ไปให้ครบ ${stops} ที่`, Icon: Footprints, tone: 'text-violet-700' });
  return list;
}

// One reason per pick, each kind used once where possible, so the row does not repeat itself
function assignReasons(picks: ChallengeQuest[]): Map<string, Reason> {
  const used = new Set<string>();
  const out = new Map<string, Reason>();
  for (const quest of picks) {
    const options = reasonsFor(quest);
    const reason = options.find((r) => !used.has(r.kind)) ?? options[0];
    used.add(reason.kind);
    out.set(quest.id, reason);
  }
  return out;
}

// Running before starting soon; within each, a shop reward and more people first
const score = (q: ChallengeQuest) =>
  (getQuestBrandReward(q).type === 'brand_partner' ? 300 : 0) +
  Math.min(q.participantsCount ?? 0, 500) / 2 +
  (q.daysRemaining !== undefined && q.daysRemaining <= 7 ? 100 : 0);

/**
 * "ชาเลนจ์สนุก แนะนำสำหรับคุณ" on the homepage: a playful row of small, tilted photos with an XP sticker,
 * the title, and one friendly reason to try it. No card frames. Members do not see challenges they joined,
 * except on the signed-in home (`progress` given): there the ones they are doing come first with a progress bar.
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
    <ul className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-1 sm:scroll-px-1 pt-3 pb-2">
      {picks.map((quest, i) => {
        const doing = mine.get(quest.id);
        const reason = reasons.get(quest.id);
        return (
          <li key={quest.id} className={`${itemWidth} shrink-0 snap-start`}>
            <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group block">
              <span className={`relative block ${TILTS[i % TILTS.length]} group-hover:rotate-0 group-hover:-translate-y-1 transition-transform duration-300`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={quest.image || quest.badgeCoverImg || FALLBACK_IMAGE}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover rounded-3xl bg-slate-100 shadow-md"
                />
                {quest.rule && (
                  <span className={`absolute -top-2.5 -left-1.5 ${XP_TILTS[i % XP_TILTS.length]} inline-flex items-center gap-0.5 rounded-full bg-[#7C3AED] text-white px-2.5 py-1 text-xs font-bold shadow-md tabular-nums`}>
                    <Zap className="w-3 h-3 fill-current" aria-hidden="true" />+{(quest.rewardPoints ?? 0).toLocaleString()}
                  </span>
                )}
              </span>
              <span className="mt-3 text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">
                {quest.title}
              </span>
              {doing ? (
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 flex-1 rounded-full bg-violet-100 overflow-hidden" role="progressbar" aria-label="ความคืบหน้า" aria-valuemin={0} aria-valuemax={doing.total} aria-valuenow={doing.current}>
                    <span className="block h-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (doing.current / Math.max(1, doing.total)) * 100)}%` }} />
                  </span>
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{doing.current}/{doing.total}</span>
                </span>
              ) : (
                reason && (
                  <span className={`mt-1 flex items-center gap-1 text-xs font-bold ${reason.tone}`}>
                    <reason.Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{reason.text}</span>
                  </span>
                )
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
