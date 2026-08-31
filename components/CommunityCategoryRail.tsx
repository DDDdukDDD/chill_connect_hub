'use client';

import React from 'react';
import { Compass, ChevronLeft, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';
import {
  MASTER_COMMUNITY_LIFESTYLE_CATEGORIES,
  MasterCommunityLifestyleCategory,
} from '@/data/masterHub';

export type CommunityLifestyleCategory = MasterCommunityLifestyleCategory;
export const COMMUNITY_LIFESTYLE_CATEGORIES = MASTER_COMMUNITY_LIFESTYLE_CATEGORIES;

interface CommunityCategoryRailProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  eventCounts?: Record<string, number>;
  variant?: 'rail' | 'grid';
}

export const CommunityCategoryRail: React.FC<CommunityCategoryRailProps> = ({
  selectedCategoryId,
  onSelectCategory,
  eventCounts = {},
  variant = 'rail',
}) => {
  if (variant === 'grid') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#F26430]" />
            <span>ค้นหาตามหมวดความสนใจ (Explore by Category)</span>
          </h3>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-[#F26430] hover:underline cursor-pointer"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        {/* Responsive Grid for all devices */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategoryId === cat.id;
            const count = eventCounts[cat.id] ?? 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between gap-2.5 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-emerald-50/90 border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-[#4A7C59] text-white shadow-xs'
                        : `${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-200/70 text-[#2D5A3C]' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isSelected ? 'text-[#4A7C59]' : 'text-slate-300 group-hover:text-slate-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-0.5 w-full">
                  <span className={`font-bold text-xs sm:text-sm truncate block leading-snug ${
                    isSelected ? 'text-[#2D5A3C]' : 'text-slate-900'
                  }`}>
                    {cat.name}
                  </span>
                  <p className={`text-[11px] font-medium truncate leading-normal ${
                    isSelected ? 'text-[#4A7C59]' : 'text-slate-400'
                  }`}>
                    {cat.nameEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant = 'rail' (Meetup + Luma Horizontal Flow Carousel with Smooth Scroll Buttons)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  React.useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/rail w-full">
      {/* Left Scroll Arrow (Desktop/Tablet) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="เลื่อนซ้าย"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer hidden sm:flex hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Right Scroll Arrow (Desktop/Tablet) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="เลื่อนขวา"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer hidden sm:flex hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Right Gradient Fade Indicator for Overflow Cue */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 sm:hidden rounded-r-2xl" />
      )}

      {/* Scrollable Container with Smooth Touch Scroll */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-0.5"
      >
        {/* All Button Tile */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 2xl:flex-1 h-[82px] min-w-[105px] sm:min-w-[110px] 2xl:min-w-0 p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none active:scale-98 ${
            selectedCategoryId === null
              ? 'bg-[#EBF3ED] border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              selectedCategoryId === null ? 'bg-[#4A7C59] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left leading-tight">
            <span className={`block text-xs font-bold ${
              selectedCategoryId === null ? 'text-[#2D5A3C]' : 'text-slate-900'
            }`}>
              ทั้งหมด
            </span>
            <span className={`block text-[10px] font-medium ${
              selectedCategoryId === null ? 'text-[#4A7C59]' : 'text-slate-400'
            }`}>
              All Events
            </span>
          </div>
        </button>

        {/* 8 Modern Minimalist Category Cards */}
        {COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategoryId === cat.id;
          const count = eventCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`shrink-0 2xl:flex-1 h-[82px] min-w-[145px] sm:min-w-[155px] 2xl:min-w-0 p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative select-none active:scale-98 ${
                isSelected
                  ? 'bg-[#EBF3ED] border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-xs'
                  : 'bg-white hover:bg-slate-50/90 text-slate-800 border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected
                      ? 'bg-[#4A7C59] text-white shadow-xs'
                      : `${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-emerald-200/70 text-[#2D5A3C]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left w-full pr-1 space-y-0.5">
                <span className={`block text-xs font-bold truncate leading-snug ${
                  isSelected ? 'text-[#2D5A3C]' : 'text-slate-900'
                }`}>
                  {cat.name}
                </span>
                <span
                  className={`block text-[10px] font-medium truncate leading-normal ${
                    isSelected ? 'text-[#4A7C59]' : 'text-slate-400'
                  }`}
                >
                  {cat.nameEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
