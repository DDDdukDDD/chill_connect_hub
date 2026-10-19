'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Medal, Ticket, Zap } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward, questPrizeLabel } from '@/lib/questDisplay';
import type { QuestProgress } from '@/lib/useMyRewards';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

// The landing's playful look: photos lean a little like prints on a wall, the XP is a sticker; hover straightens them.
// Text never tilts. Neighbours lean opposite ways.
const TILTS = ['-rotate-1', 'rotate-1', 'rotate-[0.5deg]', '-rotate-[0.5deg]'];
const STICKER_TILTS = ['rotate-6', '-rotate-3', 'rotate-3', '-rotate-6'];

// Half-circle notches on both short sides of the prize ticket
const TICKET_NOTCH = 'transparent 5px, #000 5.5px';
const TICKET_MASK: React.CSSProperties = {
  WebkitMask: `radial-gradient(circle at left, ${TICKET_NOTCH}) left / 51% 100% no-repeat, radial-gradient(circle at right, ${TICKET_NOTCH}) right / 51% 100% no-repeat`,
  mask: `radial-gradient(circle at left, ${TICKET_NOTCH}) left / 51% 100% no-repeat, radial-gradient(circle at right, ${TICKET_NOTCH}) right / 51% 100% no-repeat`,
};
const TICKET_TONES = {
  // The body is near-white with dark text so the label reads crisply on any photo
  partner: { stub: 'bg-amber-400 text-amber-950', body: 'bg-[#FFFBF0] text-amber-950', tear: 'border-amber-400' },
  medal: { stub: 'bg-[#7C3AED] text-white', body: 'bg-[#FAF8FF] text-[#4C1D95]', tear: 'border-purple-400' },
  ended: { stub: 'bg-slate-300 text-slate-700', body: 'bg-slate-50 text-slate-700', tear: 'border-slate-300' },
};

/**
 * The challenge card on /challenges: frameless, a tilted photo print with an XP sticker, the prize only when there is a real one
 * (a shop gift or a named medal), title, what to do, and when. The whole card is one link.
 * `mine` is the member's progress when they joined it and it is still running; `index` picks the tilt.
 */
export function ChallengeCard({ quest, isJoined, mine, index = 0 }: { quest: ChallengeQuest; isJoined: boolean; mine?: QuestProgress; index?: number }) {
  const isEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
  // Not started yet: visits do not count before startDate, so the card says when it starts instead of the days left
  const startsInDays = !isEnded ? quest.startsInDays : undefined;
  const isUrgent = !isEnded && !startsInDays && quest.daysRemaining !== undefined && quest.daysRemaining <= 5;
  const brandReward = getQuestBrandReward(quest);
  const isPartner = brandReward.type === 'brand_partner';
  // The host's short label (empty when the challenge gives XP only, which the sticker already says); the full prize is on the challenge page
  const prize = questPrizeLabel(quest);
  const ticket = TICKET_TONES[isEnded ? 'ended' : isPartner ? 'partner' : 'medal'];
  const href = `/challenges/${encodeURIComponent(quest.id)}`;
  const action = isEnded ? 'ดูย้อนหลัง' : mine?.completed ? 'ดูรางวัล' : isJoined ? 'กำลังทำอยู่' : 'ดูชาเลนจ์';

  return (
    <article className="group/card relative flex flex-col gap-2.5">
      {/* The photo print, with the XP sticker on its corner */}
      {/* The bottom margin keeps room for the prize ticket hanging off the photo (on every card, so rows line up) */}
      <div
        className={`relative mb-3 transition-transform duration-300 ${
          isEnded ? '' : `${TILTS[index % TILTS.length]} group-hover/card:rotate-0 group-hover/card:-translate-y-1`
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={quest.image || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          className={`w-full aspect-[16/9] object-cover rounded-2xl bg-slate-100 border-4 border-white shadow-md ${isEnded ? 'grayscale opacity-80' : ''} ${
            isJoined && !isEnded ? 'ring-2 ring-[#7C3AED]' : ''
          }`}
        />
        <span
          className={`absolute -top-2.5 -right-1.5 ${STICKER_TILTS[index % STICKER_TILTS.length]} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-md whitespace-nowrap tabular-nums ${
            isEnded ? 'bg-slate-200 text-slate-700' : quest.rule ? 'bg-[#7C3AED] text-white' : 'bg-white text-slate-700'
          }`}
        >
          {isEnded ? (
            'จบแล้ว'
          ) : quest.rule ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />+{(quest.rewardPoints ?? 0).toLocaleString()} XP
            </>
          ) : (
            'บันทึกเอง'
          )}
        </span>
        {/* The prize as a raffle ticket stuck over the photo's lower edge: notched sides, a coloured stub, a dashed tear line.
            Only when there is one worth naming. It leans only with its photo and has no filter shadow:
            a second tilt plus a filter made the browser paint the small text as a smeared picture */}
        {prize && (
          <p title={brandReward.title} className="absolute left-3 -bottom-3.5 max-w-[calc(100%-1.5rem)]">
            <span className={`flex items-stretch min-w-0 rounded-md antialiased ${ticket.body}`} style={TICKET_MASK}>
              <span className={`flex items-center pl-3 pr-2 ${ticket.stub}`}>
                {isPartner ? <Ticket className="w-4 h-4" aria-hidden="true" /> : <Medal className="w-4 h-4" aria-hidden="true" />}
              </span>
              <span className={`min-w-0 truncate border-l-2 border-dashed pl-2 pr-3.5 py-1.5 text-xs font-bold ${ticket.tear}`}>{prize}</span>
            </span>
          </p>
        )}
      </div>

      {/* Title (the card's link), who runs it when it is a partner, then what to do */}
      <div className="space-y-1">
        <h3 title={quest.title} className={`text-[13px] sm:text-sm font-bold leading-[1.3] tracking-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${isEnded ? 'text-slate-700' : 'text-slate-900'}`}>
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] group-hover/card:underline">
            {quest.title}
          </Link>
        </h3>
        {isPartner && <p className="text-xs font-medium text-slate-500 truncate">โดย {brandReward.partnerName}</p>}
        <p title={quest.targetGoal} className="text-xs sm:text-sm font-medium text-slate-600 leading-snug line-clamp-1">
          {quest.targetGoal}
        </p>
      </div>

      {/* The member's own progress, from the account */}
      {isJoined && !isEnded && (
        mine ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#5B21B6]">
              <span>{mine.completed ? 'ทำครบแล้ว เก่งมาก' : 'ความคืบหน้าของคุณ'}</span>
              <span className="tabular-nums">{mine.current}/{mine.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F5F3FF] overflow-hidden">
              <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${Math.round((mine.current / mine.total) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-xs font-bold text-[#5B21B6]">ร่วมอยู่ บันทึกความคืบหน้าเองได้</p>
        )
      )}

      {/* When, how many, and a quiet "go" on the right. The dates are on the challenge page */}
      <div className="mt-auto flex items-center justify-between gap-2 text-xs font-medium text-slate-500 tabular-nums">
        <span className="truncate min-w-0">
          {isEnded ? (
            `จบเมื่อ ${quest.endDate}`
          ) : (
            <>
              {startsInDays ? (
                <span className="font-bold text-[#5B21B6]">เริ่มในอีก {startsInDays} วัน</span>
              ) : (
                <span className={isUrgent ? 'font-bold text-rose-700' : ''}>เหลือ {quest.daysRemaining} วัน</span>
              )}
              {quest.participantsCount ? ` · ${quest.participantsCount.toLocaleString()} คนร่วมทำ` : ''}
            </>
          )}
        </span>
        <span
          className={`shrink-0 inline-flex items-center gap-0.5 text-sm font-bold whitespace-nowrap ${
            isEnded ? 'text-slate-600' : isJoined && !mine?.completed ? 'text-[#5B21B6]' : 'text-slate-900'
          }`}
          aria-hidden="true"
        >
          {action}
          <ArrowRight className="w-4 h-4 transition-transform group-hover/card:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
