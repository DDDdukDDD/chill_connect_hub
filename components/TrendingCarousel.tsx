'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame, Calendar, MapPin, Users, Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { pickHighlights } from '@/lib/highlights';
import { formatEventBadgePrice, hasKnownPrice, isPriceFree } from '@/lib/priceUtils';

const PILLAR_COLORS = { community: '#F26430', fairs: '#2B527A', spots: '#4A7C59' };

interface TrendingCarouselProps {
  events: EventItem[];
  spots: LifestyleSpotItem[];
  /** Items already at the top of the sections below; they are picked last so the row does not repeat them */
  excludeIds?: string[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  favoriteSpots: string[];
  toggleFavoriteSpot: (id: string) => void;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  mode?: 'all' | 'community' | 'fairs' | 'spots';
}

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({
  events,
  spots,
  excludeIds,
  onSelectEvent,
  favorites,
  toggleFavorite,
  favoriteSpots,
  toggleFavoriteSpot,
  title = 'ไฮไลต์สัปดาห์นี้',
  subtitle = 'คัดสรรกิจกรรมและงานอีเวนต์ที่มีผู้ให้ความสนใจสูงสุดประจำสัปดาห์นี้',
  badgeText = 'ยอดนิยม',
  badgeColor,
  mode = 'all',
}) => {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll Effect
  useEffect(() => {
    if (isPaused || isDragging) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, isDragging]);

  // Arrow Navigation
  const handlePrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -310, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 310, behavior: 'smooth' });
    }
  };

  // Mouse Drag to Scroll (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    setHasMoved(true);
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Day counts depend on the visitor's clock, so the row is picked after the page loads in the browser
  const [todayStart, setTodayStart] = useState<number | null>(null);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setTodayStart(today.getTime());
  }, []);

  // Rule-based picks (lib/highlights.ts): each item comes with the reason it was picked
  const highlights = React.useMemo(
    () => (todayStart === null ? [] : pickHighlights({ events, spots, mode, excludeIds: excludeIds || [], todayStart })),
    [events, spots, mode, excludeIds, todayStart]
  );

  return (
    <section className="space-y-1.5 sm:space-y-2">
      {/* Header (Refined Editorial Trend Feed) */}
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#1E293B] tracking-tight truncate">
              {title}
            </h2>
            <span className={`text-[9px] sm:text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-2xs shrink-0 tracking-wider ${
              badgeColor || 'bg-rose-50 text-rose-600 border border-rose-200/80'
            }`}>
              {badgeText}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate hidden sm:block">
            {subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-[11px] sm:text-xs font-bold text-[#4A7C59] hover:text-[#2D5A3C] hover:underline flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
        >
          <span>สำรวจทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Carousel Container with Floating Left & Right Arrow Buttons */}
      <div className="relative group/carousel">

        {/* Floating Left Arrow Button (Vertically Centered) */}
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-[#4A7C59] border border-slate-200/90 shadow-md items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer opacity-90 hover:opacity-100"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700 hover:text-[#4A7C59]" />
        </button>

        {/* Floating Right Arrow Button (Vertically Centered) */}
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-[#4A7C59] border border-slate-200/90 shadow-md items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer opacity-90 hover:opacity-100"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-4 h-4 text-slate-700 hover:text-[#4A7C59]" />
        </button>

        {/* Auto-Slide & Drag-to-Scroll Carousel Bar */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            setIsDragging(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className={`flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar py-1.5 px-0.5 scroll-smooth select-none snap-x snap-mandatory ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
        >
          {highlights.map(({ event, reason, pillar }) => {
            const isSpot = pillar === 'spots';
            const isFav = isSpot ? favoriteSpots.includes(event.id) : favorites.includes(event.id);

            return (
              <div
                key={`trending-${event.id}`}
                onClick={() => {
                  if (!hasMoved) {
                    const targetPath = (event.eventType as any) === 'spots'
                      ? `/spots/${encodeURIComponent(event.id)}`
                      : event.eventType === 'public_venue'
                      ? `/fairs/${encodeURIComponent(event.id)}`
                      : `/community/${encodeURIComponent(event.id)}`;
                    router.push(targetPath);
                    onSelectEvent(event);
                  }
                }}
                className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col shrink-0 snap-start relative border border-slate-100"
              >
                {/* Image Banner */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60" />

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSpot) toggleFavoriteSpot(event.id);
                      else toggleFavorite(event.id);
                    }}
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-xs z-10 cursor-pointer hover:scale-110 active:scale-95 ${
                      isFav
                        ? 'bg-[#F26430] text-white shadow-md shadow-orange-500/30 ring-1 ring-white/30'
                        : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-[#F26430]'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFav ? 'fill-white text-white' : ''}`} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
                  <div className="space-y-1">

                    {/* Host & Price Row */}
                    <div className="flex items-center justify-between gap-1.5">
                      {reason ? (
                        // Why this item is in the row, in the pillar color
                        <span className="text-[11px] font-bold truncate tabular-nums" style={{ color: PILLAR_COLORS[pillar] }}>
                          {reason}
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[10.5px] font-medium text-slate-500 truncate">
                          {event.hostName}
                        </span>
                      )}
                      {hasKnownPrice(event.price) && (
                        <span
                          className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 max-w-[110px] sm:max-w-[125px] truncate ${
                            isPriceFree(event.price)
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                          title={event.price}
                        >
                          {formatEventBadgePrice(event.price, 'ฟรี')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 line-clamp-1 group-hover:text-[#F26430] transition-colors leading-snug">
                      {event.title}
                    </h3>

                    {/* Date & Location */}
                    <div className="space-y-0.5 text-[10.5px] sm:text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
