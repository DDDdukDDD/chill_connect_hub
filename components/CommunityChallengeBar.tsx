'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Sparkles,
  Award,
  Zap,
  Coffee,
  Footprints,
  Flame,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  ArrowRight,
  Target,
  Ticket,
  Gift
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useAuth } from '@/lib/useAuth';
import { useMyRewards } from '@/lib/useMyRewards';

interface CommunityChallengeBarProps {
  onOpenCreateModal?: () => void;
  minimalHeader?: boolean;
  /** Heading text in the minimal header */
  title?: string;
}

export const CommunityChallengeBar: React.FC<CommunityChallengeBarProps> = ({
  onOpenCreateModal,
  minimalHeader = false,
  title = 'ชาเลนจ์ชวนออกไปใช้ชีวิต',
}) => {
  // Joined challenges and their progress come from the account (GET /api/rewards)
  const { isLoggedIn } = useAuth();
  const myRewards = useMyRewards(isLoggedIn);
  const joinedIds = myRewards.joinedQuestIds;
  const progressOf = (questId: string) => myRewards.quests.find((progress) => progress.questId === questId);
  const router = useRouter();
  // Every challenge in the row comes from the catalog (GET /api/quests); nothing is typed into this file
  const [questItems, setQuestItems] = useState<(ChallengeQuest & { image?: string })[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'hub_central' | 'brand_partner'>('all');

  const activeQuests = questItems.filter((q) => {
    const isEnded = (q as any).status === 'ended' || ((q as any).daysRemaining !== undefined && (q as any).daysRemaining <= 0);
    return !isEnded;
  });

  const hubCount = activeQuests.filter((q) => getQuestBrandReward(q).type === 'hub_central').length;
  const partnerCount = activeQuests.filter((q) => getQuestBrandReward(q).type === 'brand_partner').length;

  const displayQuests = activeQuests.filter((q) => {
    if (filterType === 'all') return true;
    return getQuestBrandReward(q).type === filterType;
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), questItems.length - 1));
    }
  };

  // Reset scroll when filter changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveIndex(0);
      setTimeout(checkScrollability, 250);
    }
  }, [filterType]);

  useEffect(() => {
    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (!isActive) return;
        setQuestItems(quests.map((quest) => ({ ...quest, image: quest.badgeCoverImg || quest.image })));
      })
      .catch((error) => console.warn('Could not load challenges:', error))
      .finally(() => {
        if (isActive) setIsLoadingQuests(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [questItems.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      // Scroll by 1 card step for smooth, granular exploration of all 7 cards
      const scrollAmount = cardWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 350);
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 350);
    }
  };

  const handleOpenDetailModal = (quest: ChallengeQuest) => {
    router.push(`/challenges/${encodeURIComponent(quest.id)}`);
  };

  const getCategoryLabel = (catId?: string) => {
    switch (catId) {
      case 'move':
        return 'Move';
      case 'heal':
        return 'Heal';
      case 'learn':
        return 'Learn';
      case 'chill':
      default:
        return 'Chill';
    }
  };

  return (
    <section id="community-quests-section" className="space-y-4 relative scroll-mt-20">
      
      {/* Header Strip: Editorial Banner or Minimal Unboxed Header */}
      {minimalHeader ? (
        <div className="flex items-center justify-between gap-4 pb-1 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 min-h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full whitespace-nowrap text-xs font-bold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer active:scale-95 leading-none"
          >
            <span>ดูชาเลนจ์ทั้งหมด ({activeQuests.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-[#F5F3FF] p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>ชาเลนจ์ชวนออกไปใช้ชีวิต</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ออกไปเที่ยว ไปทำกิจกรรมให้ครบ แล้วรับ XP กับของรางวัลกลับมา
            </p>
          </div>

          {/* Right Actions: Clean Glassmorphic Pill Link */}
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <span>ดูชาเลนจ์ทั้งหมด ({activeQuests.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Quick Filter: Quest Type Chips (Official Central vs Brand Partner) - Hidden in minimal mode */}
      {!minimalHeader && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider mr-0.5">
            ตัวกรองด่วน:
          </span>

          {/* 1. All */}
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
              filterType === 'all'
                ? 'bg-[#F5F3FF] border border-[#7C3AED] text-[#5B21B6]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${filterType === 'all' ? 'bg-white text-[#5B21B6]' : 'bg-slate-100 text-slate-600'}`}>
              {questItems.length}
            </span>
          </button>

          {/* 2. Official • Chillwaa */}
          <button
            type="button"
            onClick={() => setFilterType(filterType === 'hub_central' ? 'all' : 'hub_central')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs border ${
              filterType === 'hub_central'
                ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
          >
            <span>Official • Chillwaa</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${filterType === 'hub_central' ? 'bg-white text-[#5B21B6]' : 'bg-slate-100 text-slate-600'}`}>
              {hubCount}
            </span>
          </button>

          {/* 3. Brand Partner */}
          <button
            type="button"
            onClick={() => setFilterType(filterType === 'brand_partner' ? 'all' : 'brand_partner')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs border ${
              filterType === 'brand_partner'
                ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
          >
            <span>แบรนด์พาร์ทเนอร์</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${filterType === 'brand_partner' ? 'bg-white text-[#5B21B6]' : 'bg-slate-100 text-slate-600'}`}>
              {partnerCount}
            </span>
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Carousel (Manual Swipe / Scroll / Floating Center Arrows, No Auto Slide) */}
      <div className="relative group/carousel">
        
        {/* Floating Left Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          className={`absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          title="เลื่อนไปทางซ้าย"
          aria-label="Previous challenge"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          className={`absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          title="เลื่อนไปทางขวา"
          aria-label="Next challenge"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-3 sm:gap-3.5 pb-2 pt-0.5 px-0.5 no-scrollbar overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoadingQuests &&
            Array.from({ length: 5 }, (_, index) => (
              <div
                key={`quest-loading-${index}`}
                className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 aspect-[4/5] rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          {!isLoadingQuests && displayQuests.length === 0 && (
            <p className="w-full py-8 text-center text-sm font-medium text-slate-500">
              ชาเลนจ์ใหม่กำลังจะมาเร็วๆ นี้ แวะมาดูกันอีกทีนะ
            </p>
          )}
          {displayQuests.map((quest) => {
            const isJoined = joinedIds.includes(quest.id);
            const realProgress = progressOf(quest.id);
            const isDone = isJoined && Boolean(realProgress?.completed);
            const targetTotal = realProgress?.total ?? (parseInt(quest.total || '3', 10) || 3);
            const currentProg = realProgress?.current ?? 0;
            const brandReward = getQuestBrandReward(quest);

            if (minimalHeader) {
              return (
                <div
                  key={quest.id}
                  onClick={() => handleOpenDetailModal(quest)}
                  className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start"
                >
                  <div className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer w-full select-none">
                    {/* Full-bleed Photo */}
                    <img
                      src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                      alt={quest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Subtle Top Shadow for Badges */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                    {/* Deep Bottom Shadow for Typography */}
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none" />

                    {/* Top Badges Row */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 gap-1.5">
                      {/* Left: Medal Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/95 bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 truncate max-w-[calc(100%-68px)]">
                        <Award className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        <span className="truncate">เหรียญ {quest.badgeLabel}</span>
                      </span>

                      {/* Right: XP Reward Pill */}
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-300 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shrink-0">
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-300" />
                        <span>{quest.rule ? `+${quest.rewardPoints ?? 0} XP` : 'บันทึกเอง'}</span>
                      </span>
                    </div>

                    {/* Bottom Overlaid Details (Pure Moments Style) */}
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex flex-col justify-end space-y-1.5 z-10">
                      {/* Host / Partner Tag */}
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300 drop-shadow-sm truncate">
                        {brandReward.type === 'brand_partner' ? brandReward.partnerName : 'Official • Chillwaa'}
                      </div>

                      {/* Title */}
                      <h3 className="text-white text-sm sm:text-base font-bold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-amber-200 transition-colors">
                        {quest.title}
                      </h3>

                      {/* Footer Meta Row with Top Divider */}
                      <div className="pt-1.5 flex items-center justify-between text-white/90 border-t border-white/15 text-[11px]">
                        {/* Left: Reward Title */}
                        <div className="flex items-center gap-1 min-w-0">
                          {brandReward.type === 'brand_partner' ? (
                            <Ticket className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : (
                            <Gift className="w-3 h-3 text-purple-400 shrink-0" />
                          )}
                          <span className="truncate text-white/85 font-medium text-[11px]">
                            {brandReward.title || quest.badgeLabel}
                          </span>
                        </div>

                        {/* Right: Status or Participants */}
                        <div className="shrink-0 font-bold flex items-center gap-1">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-200 bg-purple-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-purple-400/40">
                              <Trophy className="w-2.5 h-2.5 text-purple-300" />
                              <span>พิชิตแล้ว</span>
                            </span>
                          ) : isJoined ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200 bg-emerald-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-emerald-400/40">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                              <span>{currentProg}/{targetTotal}</span>
                            </span>
                          ) : (
                            <span className="text-white/85 text-[11px] font-medium flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 text-white/70" />
                              <span>{quest.participantsCount} คน</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={quest.id}
                onClick={() => handleOpenDetailModal(quest)}
                className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs hover:shadow-lg hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-2 relative overflow-hidden group/card cursor-pointer"
              >
                {/* Official Quest Top Accent Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${brandReward.type === 'brand_partner' ? 'bg-[#7C3AED]' : 'bg-[#7C3AED]'}`} />

                {/* 1. Top Badges Row: Brand Partner vs Central Hub Badge */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {brandReward.type === 'brand_partner' ? (
                    <span
                      title={`ชาเลนจ์พาร์ทเนอร์ทางการ: ${brandReward.partnerName}`}
                      className="text-[11px] font-bold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300/80 truncate max-w-[calc(100%-70px)]"
                    >
                      <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500 shrink-0" />
                      <span className="truncate">Official • {brandReward.partnerName}</span>
                    </span>
                  ) : (
                    <span
                      title="ชาเลนจ์กิจกรรมกลางของ Chillwaa (สะสม XP แลกรางวัลอิสระ)"
                      className="text-[11px] font-bold text-purple-900 bg-purple-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-300/80 truncate max-w-[calc(100%-70px)]"
                    >
                      <Crown className="w-2.5 h-2.5 text-purple-700 fill-purple-500 shrink-0" />
                      <span className="truncate">Official • Chillwaa</span>
                    </span>
                  )}

                  <span className="text-[11px] font-bold text-purple-800 bg-[#F5F3FF] border border-purple-200/90 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 shadow-2xs">
                    <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                    <span>{quest.rule ? `+${quest.rewardPoints ?? 0} XP` : 'บันทึกเอง'}</span>
                  </span>
                </div>

                {/* 2. Full Inner Image Banner with Floating Glass Badge */}
                <div className="relative h-28 sm:h-32 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group-hover/card:border-[#4A7C59]/40 transition-colors">
                  <img
                    src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                    alt={quest.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Ambient Dark Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Bottom-Left Floating Glass Medal Badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-md truncate max-w-full">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">เหรียญ {quest.badgeLabel}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Title & Target Description */}
                <div className="space-y-1.5 flex-1">
                  <h3
                    title={quest.title}
                    className="font-bold text-sm sm:text-base text-slate-900 group-hover/card:text-purple-700 transition-colors leading-snug line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem]"
                  >
                    {quest.title}
                  </h3>
                  <p
                    title={quest.targetGoal}
                    className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium min-h-[2rem]"
                  >
                    {quest.targetGoal}
                  </p>

                  {/* Reward Privilege Pill: Brand Exclusive vs Hub Universal Points */}
                  {brandReward.type === 'brand_partner' ? (
                    <div 
                      title={`สิทธิพิเศษเฉพาะแบรนด์ ${brandReward.partnerName}: ${brandReward.title}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-950 text-[11px] font-bold shadow-2xs"
                    >
                      <Ticket className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{brandReward.title}</span>
                    </div>
                  ) : (
                    <div 
                      title="รับแต้มสะสมพิเศษเพื่อนำไปเลือกแลกของรางวัลในศูนย์กลาง (/rewards)"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/90 border border-purple-200/90 text-purple-950 text-[11px] font-bold shadow-2xs"
                    >
                      <Gift className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="truncate">แต้มสะสมอิสระ แลกของรางวัลใน Hub Rewards</span>
                    </div>
                  )}
                </div>

                {/* 4. Meta Row: Partner & Participant count + Status Indicator (Clean, No Button) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="min-w-0 flex-1 truncate" title={brandReward.type === 'brand_partner' ? `พาร์ทเนอร์ทางการ: ${brandReward.partnerName}` : 'กิจกรรมกลางของ Hub'}>
                    <span className="truncate text-slate-600 font-semibold text-[11px]">
                      โดย {brandReward.type === 'brand_partner' ? brandReward.partnerName : 'Chillwaa'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/80">
                        <Trophy className="w-3 h-3 text-purple-600" />
                        <span>พิชิตแล้ว</span>
                      </span>
                    ) : isJoined ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{currentProg}/{targetTotal}</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-500 text-[11px]">
                        {quest.participantsCount} คนร่วมทำ
                      </span>
                    )}

                    <div className="w-6 h-6 rounded-full bg-slate-50 group-hover/card:bg-purple-600 flex items-center justify-center text-slate-500 group-hover/card:text-white transition-colors shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Pagination Dots Indicator - Hidden in minimal mode */}
        {!minimalHeader && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {displayQuests.map((quest, idx) => (
              <button
                key={quest.id}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeIndex
                    ? 'w-6 bg-purple-600'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`ไปยังชาเลนจ์ที่ ${idx + 1}: ${quest.title}`}
                aria-label={`Go to quest ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>


    </section>
  );
};
