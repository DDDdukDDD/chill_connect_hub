'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';

export interface TopVenueItem {
  id: string;
  nameEn: string;
  nameTh: string;
  subtitle: string;
  venueKey: string;
  imageUrl: string;
  keywords: string[];
}

export const TOP_VENUES: TopVenueItem[] = [
  {
    id: 'qsncc',
    nameEn: 'QSNCC',
    nameTh: 'ศูนย์ฯ สิริกิติ์',
    subtitle: 'สุขุมวิท • คลองเตย (MRT)',
    venueKey: 'qsncc',
    imageUrl: '/images/venues/qsncc.jpg',
    keywords: ['สิริกิติ์', 'qsncc'],
  },
  {
    id: 'bitec',
    nameEn: 'BITEC Bangna',
    nameTh: 'ไบเทค บางนา',
    subtitle: 'บางนา • สมุทรปราการ (BTS)',
    venueKey: 'bitec',
    imageUrl: '/images/venues/bitec.jpg',
    keywords: ['ไบเทค', 'bitec'],
  },
  {
    id: 'impact',
    nameEn: 'IMPACT Muang Thong',
    nameTh: 'อิมแพ็ค เมืองทองธานี',
    subtitle: 'ชาเลนเจอร์ & อารีนา (MRT)',
    venueKey: 'impact',
    imageUrl: '/images/venues/impact.jpg',
    keywords: ['อิมแพ็ค', 'impact', 'เมืองทอง'],
  },
  {
    id: 'paragon',
    nameEn: 'Paragon & ICONSIAM',
    nameTh: 'พารากอน & ไอคอนสยาม',
    subtitle: 'รอยัล พารากอน & ทรู ไอคอน',
    venueKey: 'paragon',
    imageUrl: '/images/venues/paragon.jpg',
    keywords: ['paragon', 'พารากอน', 'iconsiam', 'ไอคอนสยาม', 'สยาม'],
  },
  {
    id: 'bacc',
    nameEn: 'BACC & Art Spaces',
    nameTh: 'หอศิลป์ BACC & ย่านอาร์ต',
    subtitle: 'ปทุมวัน • เจริญกรุง • พระนคร',
    venueKey: 'bacc',
    imageUrl: '/images/venues/bacc.jpg',
    keywords: ['bacc', 'หอศิลป', 'เจริญกรุง', 'ปทุมวัน'],
  },
  {
    id: 'park',
    nameEn: 'Parks & Open-Air',
    nameTh: 'สวนสาธารณะ & ลานเมือง',
    subtitle: 'สวนเบญจกิติ • ลุมพินี • รถไฟ',
    venueKey: 'park',
    imageUrl: '/images/venues/benjakitti.jpg',
    keywords: ['สวน', 'park', 'สนามหลวง'],
  },
  {
    id: 'regional',
    nameEn: 'Regional Mega Centers',
    nameTh: 'ศูนย์ประชุมภูมิภาค',
    subtitle: 'KICE ขอนแก่น • CMECC เชียงใหม่',
    venueKey: 'regional',
    imageUrl: '/images/venues/kice.webp',
    keywords: ['kice', 'ขอนแก่น', 'cmecc', 'เชียงใหม่', 'สงขลา', 'ภูเก็ต'],
  },
];

interface TopVenuesRailProps {
  selectedVenue: string | null;
  onSelectVenue: (venueKey: string | null) => void;
  eventsList?: EventItem[];
  className?: string;
}

export const TopVenuesRail: React.FC<TopVenuesRailProps> = ({
  selectedVenue,
  onSelectVenue,
  eventsList = MOCK_EVENTS,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Compute actual counts for active public venue events
  const { countsMap, totalAllFairs } = useMemo(() => {
    const counts: Record<string, number> = {};
    const activePublic = eventsList.filter((e) => e.eventType === 'public_venue' && !isEventEnded(e));

    TOP_VENUES.forEach((v) => {
      const matchCount = activePublic.filter((ev) => {
        const vTag = (ev.venueTag || '').toLowerCase();
        const loc = (ev.location || '').toLowerCase();
        const title = (ev.title || '').toLowerCase();
        const text = `${vTag} ${loc} ${title}`;
        return v.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).length;
      counts[v.venueKey] = matchCount;
    });

    return {
      countsMap: counts,
      totalAllFairs: activePublic.length,
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
    const distance = 240;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const isCurrentActive = (venueKey: string) => {
    if (!selectedVenue || selectedVenue === 'all') return false;
    return selectedVenue.toLowerCase() === venueKey.toLowerCase();
  };

  return (
    <div className={`relative space-y-2 sm:space-y-2.5 ${className}`}>
      {/* Header Row: Title & Quick Reset Pill */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <span>ศูนย์การประชุมและแลนด์มาร์กยอดนิยม</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 font-sans uppercase tracking-wider hidden sm:inline">
              Top Exhibition Venues & Hubs
            </span>
          </h3>
        </div>

        {/* Quick Reset Pill when a venue is active */}
        {selectedVenue && selectedVenue !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectVenue(null)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] sm:text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 group/clear"
            title="คลิกเพื่อล้างตัวกรองและแสดงงานมหกรรมทั้งหมด"
          >
            <X className="w-3 h-3 text-slate-300 group-hover/clear:text-white transition-colors" />
            <span>ล้างตัวกรอง (ดูทั้งหมด {totalAllFairs})</span>
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
            className="absolute -left-2.5 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนซ้าย"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Right Arrow Button (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute -right-2.5 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนขวา"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none scroll-smooth pt-1.5 pb-2 px-1 select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TOP_VENUES.map((venue) => {
            const active = isCurrentActive(venue.venueKey);
            const fairCount = countsMap[venue.venueKey] || 0;

            return (
              <button
                key={venue.id}
                type="button"
                onClick={() => {
                  if (active) {
                    onSelectVenue(null); // Toggle off back to all
                  } else {
                    onSelectVenue(venue.venueKey);
                  }
                }}
                className="group flex flex-col items-center text-center shrink-0 w-[94px] sm:w-[108px] md:w-[118px] cursor-pointer focus:outline-none transition-all duration-200"
              >
                {/* Image Container with Rounded Luxury Shape (Slate Blue Accent) */}
                <div
                  className={`relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-xs transition-all duration-300 ${
                    active
                      ? 'ring-2 sm:ring-3 ring-[#2B527A] ring-offset-1 sm:ring-offset-2 scale-[1.02] shadow-md'
                      : 'group-hover:shadow-md group-hover:scale-[1.02] border border-slate-200/80'
                  }`}
                >
                  <img
                    src={venue.imageUrl}
                    alt={venue.nameTh}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[1.02] saturate-[1.05]"
                    loading="lazy"
                  />

                  {/* Scrim for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-65 group-hover:opacity-45 transition-opacity" />

                  {/* Active Checked Badge (Slate Blue Theme) */}
                  {active && (
                    <div className="absolute top-1.5 right-1.5 bg-[#2B527A] text-white p-0.5 sm:p-1 rounded-full shadow-md animate-fade-in">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Fair Count Pill on Image (Bottom Left) */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[9px] sm:text-[10px] font-bold text-white tracking-tight">
                    {fairCount > 0 ? `${fairCount} งาน` : 'เร็วๆ นี้'}
                  </div>
                </div>

                {/* Venue Name & Subtitle below image */}
                <div className="mt-1.5 w-full px-0.5 text-center">
                  <p
                    className={`text-[11px] sm:text-xs font-extrabold truncate transition-colors leading-tight ${
                      active ? 'text-[#2B527A]' : 'text-slate-900 group-hover:text-[#2B527A]'
                    }`}
                  >
                    {venue.nameEn}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 truncate mt-0.5">
                    {venue.nameTh}
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
