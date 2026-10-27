'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward, questDateRange } from '@/lib/questDisplay';
import { parseQuestDate } from '@/lib/questLifecycle';
import { optimizedImage } from '@/lib/optimizedImage';
import type { QuestProgress } from '@/lib/useMyRewards';
import { ChallengeTile, prizeReasons } from '@/components/ChallengeTile';

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';


const isEndedQuest = (quest: ChallengeQuest) => quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
const endTs = (quest: ChallengeQuest) => parseQuestDate(quest.endDate, true) ?? Number.MAX_SAFE_INTEGER;
const startTs = (quest: ChallengeQuest) => parseQuestDate(quest.startDate, false) ?? 0;

interface RowProps {
  quest: ChallengeQuest;
  /** The day the row stands on: the start of a challenge that has not started, otherwise its end */
  on: 'start' | 'end';
  isJoined: boolean;
  mine?: QuestProgress;
}

function ChallengeRow({ quest, on, isJoined, mine }: RowProps) {
  const isEnded = isEndedQuest(quest);
  const reward = getQuestBrandReward(quest);
  const isPartner = reward.type === 'brand_partner';
  const isUrgent = !isEnded && on === 'end' && quest.daysRemaining !== undefined && quest.daysRemaining <= 5;
  const range = questDateRange(quest);
  const when = isEnded
    ? 'จบแล้ว'
    : quest.startsInDays
      ? `เริ่มในอีก ${quest.startsInDays} วัน`
      : quest.daysRemaining !== undefined ? `เหลือ ${quest.daysRemaining} วัน` : 'ไม่มีวันปิด';

  return (
    <Link
      href={`/challenges/${encodeURIComponent(quest.id)}`}
      className="group -mx-2 px-2 py-3 rounded-xl flex flex-wrap items-center gap-x-3 gap-y-2 hover:bg-slate-50 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedImage(quest.image || quest.badgeCoverImg, 384) || FALLBACK_IMAGE}
        alt=""
        loading="lazy"
        className={`w-[72px] h-[72px] sm:w-44 sm:h-[99px] rounded-xl sm:rounded-2xl object-cover bg-slate-100 shrink-0 ${isEnded ? 'grayscale opacity-80' : ''}`}
      />
      <div className="min-w-0 flex-1 basis-[150px] sm:basis-48">
        <p className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEnded ? 'bg-slate-400' : isPartner ? 'bg-amber-500' : 'bg-[#7C3AED]'}`} aria-hidden="true" />
          <span className="truncate">{isPartner ? reward.partnerName : 'Chill & Connect Hub'}</span>
        </p>
        <h3 className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 sm:line-clamp-1 group-hover:underline" title={quest.title}>{quest.title}</h3>
        <p className="text-xs text-slate-600 truncate" title={quest.targetGoal}>{quest.targetGoal}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs min-w-0">
          {quest.rule ? (
            <span className="shrink-0 px-2 py-px rounded-full bg-[#7C3AED] text-white font-bold tabular-nums">+{(quest.rewardPoints ?? 0).toLocaleString()} XP</span>
          ) : (
            <span className="shrink-0 px-2 py-px rounded-full bg-slate-100 text-slate-600 font-bold">บันทึกเอง</span>
          )}
          <span className={`truncate font-semibold ${isPartner ? 'text-amber-900' : 'text-[#5B21B6]'}`} title={reward.title}>{reward.title}</span>
        </p>
      </div>
      {/* When it runs comes first and reads clearly: the dates decide whether a member can take part.
          Then the time left and who joined, then the member's own progress. On a phone it sits under the row, in line with the text */}
      <div className="w-full pl-[84px] sm:pl-0 sm:w-52 shrink-0 flex flex-wrap sm:flex-col items-center sm:items-end gap-x-2.5 gap-y-1 text-xs text-slate-500">
        {range && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">
            <CalendarDays className="w-4 h-4 text-slate-500" aria-hidden="true" />
            {range}
          </span>
        )}
        <span className="tabular-nums whitespace-nowrap">
          <span className={isUrgent ? 'font-bold text-rose-700' : quest.startsInDays ? 'font-bold text-[#5B21B6]' : 'font-semibold text-slate-700'}>{when}</span>
          {!isEnded && quest.participantsCount ? ` · ${quest.participantsCount.toLocaleString()} คนร่วมทำ` : ''}
        </span>
        {isJoined && !isEnded && (
          <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-purple-200 text-[#5B21B6] font-bold whitespace-nowrap tabular-nums">
            {mine?.completed ? 'ทำครบแล้ว' : 'กำลังทำอยู่'}{mine ? ` ${mine.current}/${mine.total}` : ''}
          </span>
        )}
        {isJoined && !isEnded && mine && (
          <span className="w-28 h-1.5 rounded-full bg-[#F5F3FF] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={mine.total} aria-valuenow={mine.current}>
            <span className="block h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.round((mine.current / Math.max(1, mine.total)) * 100)}%` }} />
          </span>
        )}
      </div>
    </Link>
  );
}

function MonthRows({ quests, on, monthWord, joinedIds, progress }: { quests: ChallengeQuest[]; on: (q: ChallengeQuest) => 'start' | 'end'; monthWord: string; joinedIds: string[]; progress: QuestProgress[] }) {
  // Each row's day and month; a month is named once, above its first row, with what happens in it ("ปิดเดือน…"),
  // since the row shows the whole period and may start in the month before
  const rows = quests.map((quest) => {
    const side = on(quest);
    const ts = side === 'start' ? startTs(quest) : parseQuestDate(quest.endDate, true);
    const month = ts ? `${monthWord}เดือน${THAI_MONTHS[new Date(ts).getMonth()]} ${new Date(ts).getFullYear() + 543}` : 'ไม่มีวันปิด';
    return { quest, side, month };
  });
  return (
    <div>
      {rows.map(({ quest, side, month }, index) => {
        const label = index === 0 || rows[index - 1].month !== month ? month : '';
        const isJoined = joinedIds.includes(quest.id);
        const mine = isJoined ? progress.find((p) => p.questId === quest.id) : undefined;
        return (
          <React.Fragment key={quest.id}>
            {label && <p className="pt-3 pb-1 text-xs font-bold text-slate-500 first:pt-1">{label}</p>}
            <div className={label ? '' : 'border-t border-slate-100'}>
              <ChallengeRow quest={quest} on={side} isJoined={isJoined} mine={mine} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const groupBox = 'bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs';

/**
 * Challenges that start soon, as one row of small cards that scrolls sideways. It sits above the long list so a new
 * challenge is seen before its start, not after ten running ones.
 */
function StartingSoonStrip({ quests, joinedIds, progress, onBrowseAll }: { quests: ChallengeQuest[]; joinedIds: string[]; progress: QuestProgress[]; onBrowseAll?: () => void }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const reasons = useMemo(() => prizeReasons(quests), [quests]);
  return (
    <section aria-label="เริ่มเร็วๆ นี้" className={groupBox}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            เริ่มเร็วๆ นี้ <span className="text-xs font-bold text-slate-500 tabular-nums">{quests.length}</span>
          </h2>
          <p className="text-xs text-slate-500">ร่วมล่วงหน้าได้ แต่จะนับตั้งแต่วันเริ่ม</p>
        </div>
        {onBrowseAll && (
          <button type="button" onClick={onBrowseAll} className="shrink-0 py-2 -my-2 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
            ดูทั้งหมด
          </button>
        )}
      </div>
      <div className="relative">
      {/* The same tiles as the card view and the landing (owner 2026-10-27); the padding leaves room for the tilt and the XP sticker */}
      <div ref={stripRef} className="mt-1 -mx-2 px-3 pt-4 pb-2 flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x scroll-px-3">
        {quests.map((quest, index) => {
          const isJoined = joinedIds.includes(quest.id);
          return (
            <div key={quest.id} className="snap-start shrink-0 w-40 sm:w-44 lg:w-48">
              <ChallengeTile quest={quest} index={index} reason={reasons.get(quest.id)} mine={isJoined ? progress.find((p) => p.questId === quest.id) : undefined} isJoined={isJoined} showDates />
            </div>
          );
        })}
      </div>
      {/* On a wide screen an arrow scrolls the strip, as on the topic row */}
      <button
        type="button"
        onClick={() => stripRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
        aria-label="ชาเลนจ์ถัดไป"
        className="hidden sm:grid absolute -right-2 top-[30%] w-9 h-9 place-items-center rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 text-slate-900" aria-hidden="true" />
      </button>
      </div>
    </section>
  );
}

/**
 * Challenges as a dated list, like the schedule in My Hub. Those starting soon come first, as a strip of small cards
 * ("เริ่มเร็วๆ นี้", by starting day); then "ทำได้เลยตอนนี้", by closing day (soonest first). Empty groups are left out.
 * Ended challenges are one group, latest first. Used on /challenges and in My Hub ("ชาเลนจ์ของฉัน").
 */
export function ChallengeList({ quests, joinedIds, progress, onBrowseAllSoon, pageSize }: {
  quests: ChallengeQuest[];
  joinedIds: string[];
  progress: QuestProgress[];
  onBrowseAllSoon?: () => void;
  /** Rows shown at first and per "ดูเพิ่ม", across the groups in order; leave out to show every row */
  pageSize?: number;
}) {
  const [shown, setShown] = useState(pageSize ?? Infinity);
  const ended = quests.filter(isEndedQuest).sort((a, b) => endTs(b) - endTs(a));
  const open = quests.filter((q) => !isEndedQuest(q));
  const upcoming = open.filter((q) => q.startsInDays).sort((a, b) => startTs(a) - startTs(b));
  const running = open.filter((q) => !q.startsInDays).sort((a, b) => endTs(a) - endTs(b));
  const groups = [
    { key: 'running', title: 'ทำได้เลยตอนนี้', note: 'เรียงตามวันปิด อันที่ใกล้ปิดอยู่บนสุด', items: running, on: () => 'end' as const, monthWord: 'ปิด' },
    // Shown as a full list only when nothing else runs, such as after "ดูทั้งหมด"; otherwise they are the strip on top
    { key: 'upcoming', title: 'เริ่มเร็วๆ นี้', note: 'เรียงตามวันเริ่ม ร่วมล่วงหน้าได้ แต่จะนับตั้งแต่วันเริ่ม', items: running.length === 0 ? upcoming : [], on: () => 'start' as const, monthWord: 'เริ่ม' },
    { key: 'ended', title: 'จบไปแล้ว', note: 'ล่าสุดอยู่บนสุด', items: ended, on: () => 'end' as const, monthWord: 'จบ' },
  ].filter((group) => group.items.length > 0);
  // Each group shows what is left of the budget, like the ค้นพบ lists
  const total = groups.reduce((n, group) => n + group.items.length, 0);
  const visibleGroups = groups
    .map((group, i) => ({ ...group, visible: group.items.slice(0, Math.max(0, shown - groups.slice(0, i).reduce((n, g) => n + g.items.length, 0))) }))
    .filter((group) => group.visible.length > 0);

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && running.length > 0 && <StartingSoonStrip quests={upcoming} joinedIds={joinedIds} progress={progress} onBrowseAll={onBrowseAllSoon} />}
      {visibleGroups.map((group) => (
        <section key={group.key} aria-label={group.title} className={groupBox}>
          <h2 className="text-base font-bold text-slate-900">
            {group.title} <span className="text-xs font-bold text-slate-500 tabular-nums">{group.items.length}</span>
          </h2>
          <p className="text-xs text-slate-500">{group.note}</p>
          <div className="mt-1">
            <MonthRows quests={group.visible} on={group.on} monthWord={group.monthWord} joinedIds={joinedIds} progress={progress} />
          </div>
        </section>
      ))}
      {pageSize && shown < total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + pageSize)}
            className="h-10 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer transition-colors"
          >
            ดูเพิ่ม ({(total - shown).toLocaleString()})
          </button>
        </div>
      )}
    </div>
  );
}
