'use client';

import React from 'react';
import {
  Compass,
  Sparkles,
  Flame,
  Coffee,
  Dices,
  Palette,
  Trees,
  Laptop,
  HeartHandshake,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  LucideIcon
} from 'lucide-react';

export interface CommunityLifestyleCategory {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  icon: LucideIcon;
  colorScheme: {
    badgeBg: string;
    badgeText: string;
    borderHover: string;
    borderBottom: string;
    iconBg: string;
    iconColor: string;
    activeBg: string;
  };
  keywords: string[];
}

export const COMMUNITY_LIFESTYLE_CATEGORIES: CommunityLifestyleCategory[] = [
  {
    id: 'running_fitness',
    name: 'งานวิ่ง & ฟิตเนส',
    nameEn: 'Running & Fitness',
    desc: 'งานวิ่ง ซิตี้รัน HYROX บอดี้เวท ปีนผา',
    icon: Flame,
    colorScheme: {
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      borderHover: 'hover:border-orange-400',
      borderBottom: 'border-b-orange-500',
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-600',
      activeBg: 'bg-orange-500 text-white',
    },
    keywords: ['วิ่ง', 'running', 'marathon', 'hyrox', 'fitness', 'กีฬา', 'sport', 'climbing', 'ปีน', 'badminton'],
  },
  {
    id: 'wellness_mind',
    name: 'ฮีลใจ & สมาธิ',
    nameEn: 'Health & Wellness',
    desc: 'โยคะ Sound Bath นั่งสมาธิ ผ่อนคลายจิตใจ',
    icon: Sparkles,
    colorScheme: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderHover: 'hover:border-emerald-400',
      borderBottom: 'border-b-emerald-500',
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-600 text-white',
    },
    keywords: ['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ', 'บำบัด', 'introvert'],
  },
  {
    id: 'cafe_social',
    name: 'คาเฟ่ & พบปะชิลล์',
    nameEn: 'Social & Hangout',
    desc: 'Slow Bar จิบกาแฟ แลกเปลี่ยน สนทนา',
    icon: Coffee,
    colorScheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      borderHover: 'hover:border-amber-400',
      borderBottom: 'border-b-amber-500',
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
      activeBg: 'bg-amber-600 text-white',
    },
    keywords: ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'hangout', 'จิบกาแฟ', 'พูดคุย', 'อาหาร', 'tea', 'ชา', 'มัทฉะ'],
  },
  {
    id: 'boardgames_party',
    name: 'บอร์ดเกม & ปาร์ตี้',
    nameEn: 'Board Games & Fun',
    desc: 'ปาร์ตี้บอร์ดเกม เล่นเกมกลุ่ม หาเพื่อนใหม่',
    icon: Dices,
    colorScheme: {
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      borderHover: 'hover:border-sky-400',
      borderBottom: 'border-b-sky-500',
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-600',
      activeBg: 'bg-sky-600 text-white',
    },
    keywords: ['board game', 'boardgame', 'บอร์ดเกม', 'เกม', 'catan', 'quiz', 'party', 'เกมกลุ่ม', 'เพื่อนใหม่'],
  },
  {
    id: 'arts_crafts',
    name: 'ศิลปะ & งานคราฟต์',
    nameEn: 'Arts & Creative',
    desc: 'ปั้นดิน เซรามิก วาดภาพสีน้ำ เวิร์กช็อป',
    icon: Palette,
    colorScheme: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderHover: 'hover:border-purple-400',
      borderBottom: 'border-b-purple-500',
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-600 text-white',
    },
    keywords: ['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน', 'painting', 'สีน้ำ', 'เทียน', 'candle', 'ภาพวาด'],
  },
  {
    id: 'travel_outdoor',
    name: 'ท่องเที่ยว & เอาต์ดอร์',
    nameEn: 'Travel & Outdoor',
    desc: 'เดินป่า กางเต็นท์ พายคายัค ซับบอร์ด',
    icon: Trees,
    colorScheme: {
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      borderHover: 'hover:border-teal-400',
      borderBottom: 'border-b-teal-500',
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-600',
      activeBg: 'bg-teal-600 text-white',
    },
    keywords: ['outdoor', 'เอาต์ดอร์', 'camping', 'กางเต็นท์', 'เดินป่า', 'คายัค', 'sup board', 'ซับบอร์ด', 'ธรรมชาติ', 'photowalk', 'ถ่ายรูป'],
  },
  {
    id: 'tech_skills',
    name: 'ทักษะ & เทคโนโลยี',
    nameEn: 'Tech & Learning',
    desc: 'Tech Meetup, Coding, AI, Networking',
    icon: Laptop,
    colorScheme: {
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      borderHover: 'hover:border-indigo-400',
      borderBottom: 'border-b-indigo-500',
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-600 text-white',
    },
    keywords: ['tech', 'ai', 'coding', 'developer', 'startup', 'business', 'networking', 'หนังสือ', 'book', 'talk', 'เสวนา'],
  },
  {
    id: 'pets_family',
    name: 'สัตว์เลี้ยง & ครอบครัว',
    nameEn: 'Pets & Family',
    desc: 'พาน้องหมาน้องแมวเที่ยว สังคมคนรักสัตว์',
    icon: HeartHandshake,
    colorScheme: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderHover: 'hover:border-rose-400',
      borderBottom: 'border-b-rose-500',
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-600 text-white',
    },
    keywords: ['pet', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'dog', 'cat', 'family', 'ครอบครัว', 'เด็ก', 'kids'],
  },
];

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
