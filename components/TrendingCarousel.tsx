'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame, Calendar, MapPin, Users, Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';

interface TrendingCarouselProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({
  events,
  onSelectEvent,
  favorites,
  toggleFavorite,
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

  // Smart Trending Algorithm (คัดเฉพาะ 8 กิจกรรมระดับท็อปที่ยังไม่จบ: มหกรรมใหญ่ + กิจกรรมกระแสแรง)
  const trendingEvents = React.useMemo(() => {
    // 1. กรองเฉพาะงานที่ยังไม่จบ 100%
    const activeEvents = events.filter((e) => !isEventEnded(e));
    const pool = activeEvents.length >= 6 ? activeEvents : events;

    const scored = pool.map((event) => {
      let score = 0;

      // 1. งานอีเวนต์ใหญ่ / มหกรรมสาธารณะระดับชาติ (QSNCC, BITEC, IMPACT, Stadium)
      if (event.eventType === 'public_venue') {
        score += 60;
      }

      // 2. ความใกล้ของวันจัดงาน (งานในเดือน ส.ค. - ก.ย. ได้คะแนนพิเศษ)
      const d = event.date || '';
      if (d.includes('ส.ค.') || d.includes('22') || d.includes('23') || d.includes('25')) {
        score += 40;
      } else if (d.includes('ก.ย.') || d.includes('ต.ค.')) {
        score += 25;
      }

      // 3. อัตราส่วนที่นั่ง / ความจุคน
      const fillRatio = event.maxParticipants > 0 ? event.participantsCount / event.maxParticipants : 0.5;
      if (fillRatio >= 0.8) score += 30;
      else if (fillRatio >= 0.5) score += 15;

      // 4. ได้รับการบันทึกเป็นรายการโปรด
      if (favorites.includes(event.id)) {
        score += 35;
      }

      // 5. คะแนนรีวิวความน่าเชื่อถือ
      score += (event.rating || 4.8) * 5;

      return { event, score };
    });

    // เรียงลำดับจากคะแนนสูงสุดลงมา แล้วเลือก 8 อันดับแรก
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((item) => item.event);
  }, [events, favorites]);

  return (
    <section className="space-y-2.5">
      {/* Header (Clean & Minimal) */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
          <h2 className="text-xs sm:text-base font-extrabold text-[#1E293B] truncate">
            กิจกรรมไฮไลต์ยอดฮิตสัปดาห์นี้
          </h2>
          <span className="text-[9px] sm:text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full shadow-xs shrink-0 tracking-wider">
            HOT
          </span>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-[11px] sm:text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
        >
          <span>ดูกิจกรรมทั้งหมด ➔</span>
        </button>
      </div>

      {/* Carousel Container with Floating Left & Right Arrow Buttons */}
      <div className="relative group/carousel">

        {/* Floating Left Arrow Button (Vertically Centered) */}
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-[#4A7C59] border border-slate-200/90 shadow-xl items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer opacity-90 hover:opacity-100"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700 hover:text-[#4A7C59]" />
        </button>

        {/* Floating Right Arrow Button (Vertically Centered) */}
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-[#4A7C59] border border-slate-200/90 shadow-xl items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer opacity-90 hover:opacity-100"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-5 h-5 text-slate-700 hover:text-[#4A7C59]" />
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
          className={`flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
        >
          {trendingEvents.map((event) => {
            const isFav = favorites.includes(event.id);
            const isPublicVenue = event.eventType === 'public_venue';

            return (
              <div
                key={`trending-${event.id}`}
                onClick={() => {
                  if (!hasMoved) {
                    const targetPath = event.eventType === 'public_venue'
                      ? `/fairs/${encodeURIComponent(event.id)}`
                      : `/community/${encodeURIComponent(event.id)}`;
                    router.push(targetPath);
                    onSelectEvent(event);
                  }
                }}
                className="min-w-[260px] sm:min-w-[290px] max-w-[290px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col shrink-0 relative"
              >
                {/* Image Banner */}
                <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Top-Left Activity Type Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 px-2.5 py-0.5 rounded-full shadow-xs">
                      {isPublicVenue ? 'งานแฟร์ & อีเวนต์' : 'กิจกรรมชุมชน'}
                    </span>
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(event.id);
                    }}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs z-10 cursor-pointer hover:scale-110 active:scale-95 ${
                      isFav
                        ? 'bg-[#F26430] text-white shadow-md shadow-orange-500/30 ring-1 ring-white/30'
                        : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-[#F26430]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white text-white' : ''}`} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5">

                    {/* Host & Price Row */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 truncate">
                        {event.hostName}
                      </span>
                      {event.price && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            event.price.includes('ฟรี')
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
                      {event.title}
                    </h3>

                    {/* Date & Location */}
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
