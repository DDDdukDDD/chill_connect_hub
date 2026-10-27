'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarClock, CalendarDays, Clock, Flame, Footprints, Gift, Medal, Zap } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward, questDateRange, questPrizeLabel } from '@/lib/questDisplay';
import { optimizedImage } from '@/lib/optimizedImage';
import type { QuestProgress } from '@/lib/useMyRewards';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

// Each photo leans a little, like snaps stuck on a wall; hover straightens it
const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1'];
const XP_TILTS = ['-rotate-6', 'rotate-3', '-rotate-3', 'rotate-6', '-rotate-6', 'rotate-3'];

export type ChallengeReason = { kind: string; text: string; Icon: typeof Zap; tone: string };

const stopsOf = (quest: ChallengeQuest) => Math.max(1, quest.rule?.count ?? (parseInt(quest.total, 10) || 1));

// Why it is fun to try, in a friend's voice, from facts on the challenge only
function reasonsFor(quest: ChallengeQuest): ChallengeReason[] {
  const reward = getQuestBrandReward(quest);
  const people = quest.participantsCount ?? 0;
  const stops = stopsOf(quest);
  const list: ChallengeReason[] = [];
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

/**
 * One reason per challenge, each kind used once where possible, so a row does not repeat itself.
 * Each pick depends only on the ones before it, so a list that grows ("แสดงเพิ่มเติม") keeps the reasons it showed.
 */
export function assignReasons(quests: ChallengeQuest[]): Map<string, ChallengeReason> {
  const used = new Set<string>();
  const out = new Map<string, ChallengeReason>();
  for (const quest of quests) {
    const options = reasonsFor(quest);
    const reason = options.find((r) => !used.has(r.kind)) ?? options[0];
    used.add(reason.kind);
    out.set(quest.id, reason);
  }
  return out;
}

/** The tile's one line on /challenges: the prize the host named (admin "ข้อความสั้นบนการ์ด"), otherwise a friendly reason as on the landing */
export function prizeReasons(quests: ChallengeQuest[]): Map<string, ChallengeReason> {
  const reasons = assignReasons(quests);
  for (const quest of quests) {
    const prize = questPrizeLabel(quest);
    if (!prize) continue;
    const isPartner = getQuestBrandReward(quest).type === 'brand_partner';
    reasons.set(quest.id, { kind: 'prize', text: prize, Icon: isPartner ? Gift : Medal, tone: isPartner ? 'text-amber-700' : 'text-violet-700' });
  }
  return reasons;
}

const isEndedQuest = (quest: ChallengeQuest) => quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);

/**
 * A challenge as the landing shows it ("ชาเลนจ์สนุก ลองทำดูไหม?") and /challenges lists it, so both pages feel the same:
 * a tilted square photo with an XP sticker, the title, and one line under it: the member's progress when they are
 * doing it, otherwise one friendly reason to try. No frame; the whole tile is one link.
 * `showDates` adds the period under that line (on /challenges, where the dates decide whether to join).
 */
export function ChallengeTile({ quest, index, reason, mine, isJoined = false, showDates = false }: {
  quest: ChallengeQuest;
  index: number;
  reason?: ChallengeReason;
  /** The member's progress, when they joined it: shown in place of the reason */
  mine?: QuestProgress;
  /** Rings the photo and says "ร่วมอยู่" when there is no progress to show (the /challenges grid) */
  isJoined?: boolean;
  showDates?: boolean;
}) {
  const isEnded = isEndedQuest(quest);
  const range = showDates ? questDateRange(quest) : '';
  return (
    <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group block">
      <span
        className={`relative block transition-transform duration-300 ${isEnded ? '' : `${TILTS[index % TILTS.length]} group-hover:rotate-0 group-hover:-translate-y-1`}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-row-photo
          src={optimizedImage(quest.image || quest.badgeCoverImg, 384) || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          className={`w-full aspect-square object-cover rounded-3xl bg-slate-100 shadow-md ${isEnded ? 'grayscale opacity-80' : ''} ${
            isJoined && !isEnded ? 'ring-2 ring-[#7C3AED] ring-offset-2' : ''
          }`}
        />
        {isEnded ? (
          <span className="absolute -top-2.5 -left-1.5 inline-flex items-center rounded-full bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-bold shadow-md">จบแล้ว</span>
        ) : (
          quest.rule && (
            <span className={`absolute -top-2.5 -left-1.5 ${XP_TILTS[index % XP_TILTS.length]} inline-flex items-center gap-0.5 rounded-full bg-[#7C3AED] text-white px-2.5 py-1 text-xs font-bold shadow-md tabular-nums`}>
              <Zap className="w-3 h-3 fill-current" aria-hidden="true" />+{(quest.rewardPoints ?? 0).toLocaleString()}
            </span>
          )
        )}
      </span>
      <span className={`mt-3 text-sm font-bold leading-snug line-clamp-2 group-hover:underline ${isEnded ? 'text-slate-700' : 'text-slate-900'}`} title={quest.title}>
        {quest.title}
      </span>
      {/* Joined but not started: when it starts, not an empty bar (owner 2026-10-27) */}
      {!isEnded && (mine || isJoined) && quest.startsInDays ? (
        <span className="mt-1 block text-xs font-bold text-[#5B21B6] truncate">ร่วมแล้ว · อีก {quest.startsInDays} วันเริ่ม</span>
      ) : !isEnded && mine ? (
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-1.5 flex-1 rounded-full bg-violet-100 overflow-hidden" role="progressbar" aria-label="ความคืบหน้า" aria-valuemin={0} aria-valuemax={mine.total} aria-valuenow={mine.current}>
            <span className="block h-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (mine.current / Math.max(1, mine.total)) * 100)}%` }} />
          </span>
          <span className="text-xs font-bold text-slate-600 tabular-nums">{mine.completed ? 'ครบแล้ว' : `${mine.current}/${mine.total}`}</span>
        </span>
      ) : isJoined && !isEnded ? (
        <span className="mt-1 block text-xs font-bold text-[#5B21B6]">ร่วมอยู่</span>
      ) : (
        !isEnded &&
        reason && (
          <span className={`mt-1 flex items-center gap-1 text-xs font-bold ${reason.tone}`}>
            <reason.Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{reason.text}</span>
          </span>
        )
      )}
      {range && (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 tabular-nums">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{range}</span>
        </span>
      )}
    </Link>
  );
}
