'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Users, Sparkles, ShieldCheck, X } from 'lucide-react';
import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';

export interface TopCommunityClubItem {
  id: string;
  nameEn: string;
  nameTh: string;
  subtitle: string;
  clubKey: string;
  imageUrl: string;
  membersCount: string;
  badgeLabel: string;
  keywords: string[];
}

export const TOP_COMMUNITY_CLUBS: TopCommunityClubItem[] = [
  {
    id: 'ai_tech',
    nameEn: 'Bangkok AI & Tech',
    nameTh: 'กลุ่ม AI & เทค บิลเดอร์',
    subtitle: 'สยาม • สามย่าน • AI, Tech & Coding',
    clubKey: 'ai_tech',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    membersCount: '850+ สมาชิก',
    badgeLabel: 'AI & Tech',
    keywords: ['ai', 'tech', 'coding', 'developer', 'startup', 'เทคโนโลยี', 'agent'],
  },
  {
    id: 'sport_fitness',
    nameEn: 'Urban Sport & Fitness',
    nameTh: 'ก๊วนออกกำลังกาย & ฟิตเนส',
    subtitle: 'ทองหล่อ • พร้อมพงษ์ • HYROX & Workout',
    clubKey: 'sport_fitness',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    membersCount: '620+ สมาชิก',
    badgeLabel: 'Sport & Fitness',
    keywords: ['fitness', 'hyrox', 'ฟิตเนส', 'ออกกำลังกาย', 'bootcamp', 'weight', 'crossfit'],
  },
  {
    id: 'running',
    nameEn: 'Benjakitti Runners',
    nameTh: 'ชมรมวิ่งสวนเบญฯ & ลุมพินี',
    subtitle: 'สวนเบญจกิติ • ลุมพินี • Pace 6.5-7.0',
    clubKey: 'running',
    imageUrl: '/images/venues/benjakitti.jpg',
    membersCount: '1.2k+ สมาชิก',
    badgeLabel: 'Running Crew',
    keywords: ['วิ่ง', 'running', 'marathon', 'จ็อกกิ้ง', 'เบญจกิติ', 'ลุมพินี'],
  },
  {
    id: 'climbing',
    nameEn: 'BKK Bouldering Club',
    nameTh: 'ก๊วนปีนผาจำลองคนเมือง',
    subtitle: 'สุขุมวิท 49 • Bouldering & Wall',
    clubKey: 'climbing',
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
    membersCount: '480+ สมาชิก',
    badgeLabel: 'Bouldering',
    keywords: ['climbing', 'ปีนผา', 'bouldering', 'ผาจำลอง'],
  },
  {
    id: 'boardgames',
    nameEn: 'Bangkok Board Games',
    nameTh: 'สมาคมบอร์ดเกม & ปาร์ตี้',
    subtitle: 'สยาม • อุดมสุข • Catan & Strategy',
    clubKey: 'boardgames',
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
    membersCount: '1.5k+ สมาชิก',
    badgeLabel: 'Board Games',
    keywords: ['board game', 'boardgame', 'บอร์ดเกม', 'catan', 'เกม'],
  },
  {
    id: 'coffee',
    nameEn: 'Slow Bar & Coffee',
    nameTh: 'ตี้สโลว์บาร์ & กาแฟดริป',
    subtitle: 'อารีย์ • เจริญกรุง • Drip & Cupping',
    clubKey: 'coffee',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    membersCount: '980+ สมาชิก',
    badgeLabel: 'Slow Bar',
    keywords: ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'ดริป'],
  },
  {
    id: 'wellness',
    nameEn: 'Mindful Sound Bath',
    nameTh: 'วงฮีลใจ นั่งสมาธิ & เสียงบำบัด',
    subtitle: 'พร้อมพงษ์ • สาทร • Sound Bath & Yoga',
    clubKey: 'wellness',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    membersCount: '740+ สมาชิก',
    badgeLabel: 'Sound Healing',
    keywords: ['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ'],
  },
  {
    id: 'craft',
    nameEn: 'Clay & Pottery Club',
    nameTh: 'ชมรมปั้นเซรามิก & งานคราฟต์',
    subtitle: 'เอกมัย • พระโขนง • Workshop & Art',
    clubKey: 'craft',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
    membersCount: '530+ สมาชิก',
    badgeLabel: 'Pottery & Craft',
    keywords: ['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน'],
  },
];

interface TopCommunityRailProps {
  selectedClub: string | null;
  onSelectClub: (clubKey: string | null) => void;
  eventsList?: EventItem[];
  className?: string;
}

export const TopCommunityRail: React.FC<TopCommunityRailProps> = ({
  selectedClub,
  onSelectClub,
  eventsList = MOCK_EVENTS,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Compute live counts for active community events matching each club
  const { countsMap, totalAllCommunity } = useMemo(() => {
    const counts: Record<string, number> = {};
    const activeCommunity = eventsList.filter(
      (e) => (e.eventType || 'community') === 'community' && !isEventEnded(e)
    );

    TOP_COMMUNITY_CLUBS.forEach((c) => {
      const matchCount = activeCommunity.filter((ev) => {
        const text = `${ev.title} ${ev.description} ${ev.tag || ''} ${ev.location} ${ev.hostName || ''} ${ev.category || ''}`.toLowerCase();
        return c.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).length;
      counts[c.clubKey] = matchCount;
    });

    return {
      countsMap: counts,
      totalAllCommunity: activeCommunity.length,
    };
  }, [eventsList]);

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const isCurrentActive = (clubKey: string) => {
    if (!selectedClub || selectedClub === 'all') return false;
    return selectedClub.toLowerCase() === clubKey.toLowerCase();
  };

  return (
    <div className={`relative space-y-3 ${className}`}>
      {/* Header Row: Title & Quick Reset Pill */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>ชมรมและคลับคอมมูนิตี้ยอดนิยม</span>
            <span className="text-[11px] font-bold text-slate-400 font-sans uppercase tracking-wider hidden sm:inline">
              Top Community Circles & Clubs
            </span>
          </h3>
        </div>

        {/* Quick Reset Pill when a club is active */}
        {selectedClub && selectedClub !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectClub(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 group/clear"
            title="คลิกเพื่อล้างตัวกรองและแสดงกิจกรรมทั้งหมด"
          >
            <X className="w-3.5 h-3.5 text-slate-300 group-hover/clear:text-white transition-colors" />
            <span>ล้างตัวกรอง (ดูทั้งหมด {totalAllCommunity})</span>
          </button>
        )}
      </div>

      {/* Rail Outer Wrapper with Floating Scroll Buttons */}
      <div className="relative group/rail">
        {/* Left Arrow Button (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนซ้าย"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Arrow Button (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนขวา"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth pt-3 pb-2.5 px-1.5 select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TOP_COMMUNITY_CLUBS.map((club) => {
            const active = isCurrentActive(club.clubKey);
            const eventCount = countsMap[club.clubKey] || 0;

            return (
              <button
                key={club.id}
                type="button"
                onClick={() => {
                  if (active) {
                    onSelectClub(null); // Toggle off back to all
                  } else {
                    onSelectClub(club.clubKey);
                  }
                }}
                className="group flex flex-col items-center text-center shrink-0 w-[128px] sm:w-[148px] md:w-[164px] cursor-pointer focus:outline-none transition-all duration-200"
                title={`${club.nameTh} (${club.subtitle})`}
              >
                {/* Image Container with Rounded Luxury Shape (Sunset Amber Accent) */}
                <div
                  className={`relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all duration-300 ${
                    active
                      ? 'ring-3 ring-[#F26430] ring-offset-2 scale-[1.02] shadow-md'
                      : 'group-hover:shadow-md group-hover:scale-[1.02] border border-slate-200/80'
                  }`}
                >
                  <img
                    src={club.imageUrl}
                    alt={club.nameTh}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[1.02] saturate-[1.05]"
                    loading="lazy"
                  />

                  {/* Scrim for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-75 group-hover:opacity-55 transition-opacity" />

                  {/* Active Checked Badge (Sunset Amber Theme) */}
                  {active && (
                    <div className="absolute top-2 right-2 bg-[#F26430] text-white p-1 rounded-full shadow-md animate-fade-in">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Bottom Info inside Image: Live Active Meetups Count / Members */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-white tracking-tight flex items-center gap-1.5 pointer-events-none">
                    {eventCount > 0 ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{eventCount} ตี้กิจกรรม</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 text-orange-300" />
                        <span>{club.membersCount}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Club Name & Subtitle below image (Identical 2-line centered format to TopVenuesRail & TopDestinationsRail) */}
                <div className="mt-2 w-full px-1 text-center">
                  <p
                    className={`text-xs sm:text-sm font-extrabold truncate transition-colors leading-tight ${
                      active ? 'text-[#F26430]' : 'text-slate-900 group-hover:text-[#F26430]'
                    }`}
                  >
                    {club.nameEn}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {club.nameTh}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
