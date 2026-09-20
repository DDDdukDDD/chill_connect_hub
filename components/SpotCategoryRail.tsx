'use client';

import React from 'react';
import { Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { MASTER_SPOT_CATEGORIES, MasterSpotCategory, SpotVibeId } from '@/data/masterHub';

export type SpotVibeCategory = MasterSpotCategory;
export const NATIONWIDE_SPOT_CATEGORIES = MASTER_SPOT_CATEGORIES;

interface SpotCategoryRailProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  spotCounts?: Record<string, number>;
}

export const SpotCategoryRail: React.FC<SpotCategoryRailProps> = ({
  selectedCategoryId,
  onSelectCategory,
  spotCounts = {},
}) => {
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
      {/* Left Scroll Arrow */}
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

      {/* Right Scroll Arrow */}
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

      {/* Mobile Overflow Fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 sm:hidden rounded-r-2xl" />
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-0.5"
      >
        {/* All Spots Tile */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 2xl:flex-1 h-[82px] min-w-[105px] sm:min-w-[110px] 2xl:min-w-0 p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none active:scale-98 ${
            selectedCategoryId === null || selectedCategoryId === 'all'
              ? 'bg-[#EBF3ED] border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              selectedCategoryId === null || selectedCategoryId === 'all' ? 'bg-[#4A7C59] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
            {spotCounts['all'] !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  selectedCategoryId === null || selectedCategoryId === 'all' ? 'bg-emerald-200/70 text-[#2D5A3C]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {spotCounts['all']}
              </span>
            )}
          </div>
          <div className="text-left leading-tight">
            <span className={`block text-xs font-bold ${
              selectedCategoryId === null || selectedCategoryId === 'all' ? 'text-[#2D5A3C]' : 'text-slate-900'
            }`}>
              ทั้งหมด
            </span>
            <span className={`block text-[10px] font-medium ${
              selectedCategoryId === null || selectedCategoryId === 'all' ? 'text-[#4A7C59]' : 'text-slate-400'
            }`}>
              All
            </span>
          </div>
        </button>

        {/* 7 Nationwide Vibe Categories */}
        {NATIONWIDE_SPOT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategoryId === cat.id;
          const count = spotCounts[cat.id] ?? 0;
          const isDisabled = count === 0;

          return (
            <button
              key={cat.id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return;
                onSelectCategory(isSelected ? null : cat.id);
              }}
              title={isDisabled ? `${cat.name} (ยังไม่มีพิกัดในหมวดนี้)` : `${cat.name} (${count} จุดฮีลใจ)`}
              className={`shrink-0 2xl:flex-1 h-[82px] min-w-[145px] sm:min-w-[160px] 2xl:min-w-0 p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none ${
                isDisabled
                  ? 'opacity-40 bg-slate-50/70 border-slate-200/50 text-slate-400 cursor-not-allowed shadow-none hover:bg-slate-50/70 hover:border-slate-200/50'
                  : isSelected
                  ? 'bg-[#EBF3ED] border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-xs cursor-pointer active:scale-98'
                  : 'bg-white hover:bg-slate-50/90 text-slate-800 border-slate-200/80 hover:border-slate-300 shadow-2xs cursor-pointer active:scale-98'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform ${
                    isDisabled
                      ? 'bg-slate-100 text-slate-400'
                      : isSelected
                      ? 'bg-[#4A7C59] text-white shadow-xs'
                      : `${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor} group-hover:scale-105`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  {count > 0 ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-emerald-200/70 text-[#2D5A3C]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100/80 text-slate-400">
                      0
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left w-full pr-1 space-y-0.5">
                <span className={`block text-xs font-bold truncate leading-snug ${
                  isDisabled ? 'text-slate-400' : isSelected ? 'text-[#2D5A3C]' : 'text-slate-900'
                }`}>
                  {cat.name}
                </span>
                <span
                  className={`block text-[10px] font-medium truncate leading-normal ${
                    isDisabled ? 'text-slate-400/80' : isSelected ? 'text-[#4A7C59]' : 'text-slate-400'
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
