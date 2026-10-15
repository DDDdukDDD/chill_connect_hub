'use client';

import React from 'react';
import Link from 'next/link';
import { Search, X, Zap } from 'lucide-react';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { QuestProgress } from '@/lib/useMyRewards';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

// "พฤ. 29 ต.ค. · 06:00 · อีก 14 วัน"
function whenLine(event: EventItem, now: number) {
  const ts = parseEventDateToTimestamp(event.date);
  const start = new Date(now);
  const days = Math.round((ts - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / DAY_MS);
  const time = event.time.split('-')[0].trim().replace(/\s*น\.$/, '');
  const away = days <= 0 ? 'วันนี้' : days === 1 ? 'พรุ่งนี้' : `อีก ${days} วัน`;
  return `${WEEKDAYS[new Date(ts).getDay()]} ${event.date.replace(/\s*\d{4}$/, '')} · ${time} · ${away}`;
}

export interface MemberHomeTopProps {
  name: string;
  now: number;
  xp: number;
  badges: number;
  /** Shop rewards the member can afford and has not redeemed yet */
  redeemable: number;
  nextEvent: EventItem | null;
  /** The challenge in progress that closes first */
  challenge: { quest: ChallengeQuest; progress: QuestProgress } | null;
  /** Community category ids picked at onboarding, for the empty state */
  likedCategories: string[];
  isLoaded: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

/**
 * The top of the home page for a signed-in member, in place of the hero: a greeting, points in one line,
 * and "ถัดไปของคุณ" with at most the next meetup and one challenge. The full schedule stays on My Hub.
 */
export function MemberHomeTop({ name, now, xp, badges, redeemable, nextEvent, challenge, likedCategories, isLoaded, searchQuery, setSearchQuery }: MemberHomeTopProps) {
  const liked = COMMUNITY_LIFESTYLE_CATEGORIES.filter((cat) => likedCategories.includes(cat.id));
  const isEmpty = isLoaded && !nextEvent && !challenge;

  return (
    <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-8">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[28px] font-black text-slate-900 tracking-tight truncate">สวัสดี {name}</h1>
          <Link href="/rewards" className="mt-1 inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] sm:text-sm font-bold text-slate-700 hover:underline">
            <span className="inline-flex items-center gap-1 text-[#7C3AED] tabular-nums">
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {xp.toLocaleString()} XP
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>{badges > 0 ? `${badges} เหรียญ` : 'ยังไม่มีเหรียญ'}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-[#2563EB]">{redeemable > 0 ? `แลกของรางวัลได้ ${redeemable} อย่าง` : 'ดูของรางวัล'} →</span>
          </Link>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById('journey-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="md:w-[420px] shrink-0 flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 p-1 pl-4"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตี้ ที่เที่ยว หรือจังหวัด"
            aria-label="ค้นหา"
            className="flex-1 min-w-0 h-9 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-hidden [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="ล้างคำค้นหา" className="w-8 h-8 shrink-0 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      <div className="mt-6 sm:mt-8">
        <div className="flex items-end justify-between gap-3 mb-2 sm:mb-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">ถัดไปของคุณ</h2>
          <Link href="/myhub" className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูตารางทั้งหมด</Link>
        </div>

        {!isLoaded ? (
          <div className="grid md:grid-cols-2 gap-3 md:gap-10" aria-hidden="true">
            <div className="h-[72px] md:h-[90px] rounded-2xl bg-slate-100" />
            <div className="h-[72px] md:h-[90px] rounded-2xl bg-slate-100" />
          </div>
        ) : isEmpty ? (
          <div className="py-3 text-center md:text-left md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <p className="text-base sm:text-lg font-black text-slate-900">ยังว่างอยู่เลย ลองหาตี้แรกกัน</p>
              {liked.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-[13px] font-medium text-slate-500">สายที่คุณเลือกไว้:</span>
                  {liked.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/community?category=${cat.id}`}
                      className={`h-8 px-3 inline-flex items-center rounded-full text-[13px] font-bold ${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor} hover:opacity-80`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/community" className="mt-4 md:mt-0 flex md:inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-extrabold whitespace-nowrap transition-colors">
              หาตี้แรกของคุณ
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 md:gap-10 divide-y divide-slate-100 md:divide-y-0">
            {nextEvent && (
              <Link href={`/${nextEvent.eventType === 'public_venue' ? 'fairs' : 'community'}/${encodeURIComponent(nextEvent.id)}`} className="group flex items-center gap-3 md:gap-4 py-2.5 md:py-0 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nextEvent.image || FALLBACK_IMAGE} alt="" className="w-[72px] h-[72px] md:w-[120px] md:h-[90px] shrink-0 rounded-2xl object-cover bg-slate-100" />
                <span className="min-w-0">
                  <span className="block text-xs md:text-[13px] font-bold text-[#F26430]">{whenLine(nextEvent, now)}</span>
                  <span className="block text-[15px] md:text-[17px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{nextEvent.title}</span>
                  <span className="block text-xs md:text-[13px] font-medium text-slate-500 truncate">
                    {nextEvent.location}
                    {/* Fairs never show an attendee count (AGENTS.md) */}
                    {nextEvent.eventType === 'community' && ` · ไปด้วยกัน ${nextEvent.participantsCount} คน`}
                  </span>
                </span>
              </Link>
            )}
            {challenge && (
              <Link href={`/challenges/${encodeURIComponent(challenge.quest.id)}`} className="group flex items-center gap-3 md:gap-4 py-2.5 md:py-0 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={challenge.quest.image || challenge.quest.badgeCoverImg || FALLBACK_IMAGE} alt="" className="w-[72px] h-[72px] md:w-[120px] md:h-[90px] shrink-0 rounded-2xl object-cover bg-slate-100" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs md:text-[13px] font-bold text-[#7C3AED]">
                    ชาเลนจ์ที่ทำอยู่ · +{challenge.progress.rewardPoints.toLocaleString()} XP
                  </span>
                  <span className="block text-[15px] md:text-[17px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{challenge.quest.title}</span>
                  <span className="mt-1.5 flex items-center gap-2 max-w-sm">
                    <span
                      className="h-1.5 md:h-2 flex-1 rounded-full bg-violet-100 overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={challenge.progress.total}
                      aria-valuenow={challenge.progress.current}
                    >
                      <span className="block h-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (challenge.progress.current / Math.max(1, challenge.progress.total)) * 100)}%` }} />
                    </span>
                    <span className="text-xs font-bold text-slate-600 tabular-nums">{challenge.progress.current}/{challenge.progress.total}</span>
                  </span>
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
