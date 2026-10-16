'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Zap } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward } from '@/lib/questDisplay';
import type { QuestProgress } from '@/lib/useMyRewards';

/**
 * The challenge card, as on /challenges. Used there and in My Hub ("ชาเลนจ์ของฉัน") so a challenge looks the same everywhere.
 * `mine` is the member's progress when they joined it and it is still running.
 */
export function ChallengeCard({ quest, isJoined, mine }: { quest: ChallengeQuest; isJoined: boolean; mine?: QuestProgress }) {
  const router = useRouter();
  const isEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
  // Not started yet: visits do not count before startDate, so the card says when it starts instead of the days left
  const startsInDays = !isEnded ? quest.startsInDays : undefined;
  const isUrgent = !isEnded && !startsInDays && quest.daysRemaining !== undefined && quest.daysRemaining <= 5;
  const brandReward = getQuestBrandReward(quest);
  const isPartner = brandReward.type === 'brand_partner';

  return (
      <article
        onClick={() => router.push(`/challenges/${encodeURIComponent(quest.id)}`)}
        className={`group/card relative flex flex-col gap-2 rounded-2xl border p-3.5 sm:p-4 overflow-hidden cursor-pointer transition-all duration-200 ${
          isEnded
            ? 'bg-slate-50 border-slate-200'
            : isJoined
              ? 'bg-white border-[#7C3AED] hover:shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className={`absolute top-0 inset-x-0 h-1 ${isEnded ? 'bg-slate-300' : 'bg-[#7C3AED]'}`} aria-hidden="true" />
  
        {/* Who runs it (quiet), and the XP it gives (the one loud thing on the card) */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            title={isPartner ? brandReward.partnerName : 'Chill & Connect Hub'}
            className="inline-flex items-center gap-1.5 min-w-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEnded ? 'bg-slate-400' : isPartner ? 'bg-amber-500' : 'bg-[#7C3AED]'}`} aria-hidden="true" />
            <span className="truncate">{isPartner ? brandReward.partnerName : 'Chill & Connect Hub'}</span>
          </span>
          {isEnded ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-200 text-xs font-bold text-slate-600 whitespace-nowrap shrink-0">จบแล้ว</span>
          ) : quest.rule ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7C3AED] text-xs font-bold text-white whitespace-nowrap shrink-0 tabular-nums">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              +{(quest.rewardPoints ?? 0).toLocaleString()} XP
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 whitespace-nowrap shrink-0">บันทึกเอง</span>
          )}
        </div>
  
        {/* The photo carries what you get, as a strip on its lower edge: every challenge has a reward, so every card has the strip */}
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
            alt=""
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${isEnded ? 'grayscale opacity-80' : 'group-hover/card:scale-105'}`}
          />
          <p
            title={brandReward.title}
            className={`absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold min-w-0 ${
              isEnded ? 'bg-slate-100 text-slate-600' : isPartner ? 'bg-amber-100 text-amber-900' : 'bg-[#F5F3FF] text-[#5B21B6]'
            }`}
          >
            {isPartner && <Ticket className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span className="truncate">{brandReward.title}</span>
          </p>
        </div>
  
        {/* Title, then what to do in one line */}
        <div className="space-y-1.5">
          <h3 title={quest.title} className={`text-sm sm:text-base font-bold leading-snug line-clamp-2 sm:min-h-[2.75rem] ${isEnded ? 'text-slate-700' : 'text-slate-900'}`}>
            {quest.title}
          </h3>
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
  
        {/* One bottom row: how long is left and how many joined, beside the one action. The dates are on the challenge page.
            The buttons look 36px tall to keep the card short; a hidden edge keeps the 40px touch target */}
        <div className="mt-auto">
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 truncate min-w-0 tabular-nums">
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
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {isEnded ? (
                <span className="inline-flex items-center min-h-9 px-4 rounded-full bg-slate-100 text-slate-700 text-sm font-bold whitespace-nowrap">ดูย้อนหลัง</span>
              ) : mine?.completed ? (
                // Finished: the one thing left is the reward, so there is nothing to leave
                <Link
                  href={`/challenges/${encodeURIComponent(quest.id)}`}
                  className="relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] inline-flex items-center min-h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  ดูรางวัล
                </Link>
              ) : isJoined ? (
                  <Link
                    href={`/challenges/${encodeURIComponent(quest.id)}`}
                    className="relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] inline-flex items-center min-h-9 px-4 rounded-full bg-[#F5F3FF] hover:bg-purple-100 border border-purple-200 text-[#5B21B6] text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                  >
                    กำลังทำอยู่
                  </Link>
              ) : (
                <Link
                  href={`/challenges/${encodeURIComponent(quest.id)}`}
                  className="relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] inline-flex items-center justify-center min-h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  ดูชาเลนจ์
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
  );
}
