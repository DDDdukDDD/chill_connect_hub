'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, Calendar, MapPin, Users, Heart, ArrowRight } from 'lucide-react';
import { EventItem } from '@/data/mockData';

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
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll Effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Select top 6 trending events
  const trendingEvents = events.slice(0, 6);

  return (
    <section className="space-y-2.5">
      {/* Header (100% Responsive on Mobile) */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
          <h2 className="text-xs sm:text-base font-extrabold text-[#1E293B] truncate">
            กิจกรรมไฮไลต์ยอดฮิตสัปดาห์นี้
          </h2>
          <span className="text-[9px] sm:text-[10px] font-extrabold bg-rose-500 text-white px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
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

      {/* Auto-Slide Carousel Bar */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {trendingEvents.map((event) => {
          const isFav = favorites.includes(event.id);
          const isPublicVenue = event.eventType === 'public_venue';

          return (
            <div
              key={`trending-${event.id}`}
              onClick={() => onSelectEvent(event)}
              className="min-w-[260px] sm:min-w-[290px] max-w-[290px] bg-white rounded-2xl overflow-hidden border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col shrink-0 relative"
            >
              {/* Image Banner */}
              <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(event.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors shadow-sm z-10"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* Card Content */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                <div className="space-y-2">
                  
                  {/* Host & Price Row */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {event.hostName}
                    </span>
                    {event.price && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                        event.price.includes('ฟรี')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-orange-50 text-[#F26430] border-orange-200'
                      }`}>
                        {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-xs sm:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#F26430] transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-1 text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3 h-3 text-[#4A7C59] shrink-0" />
                      <span className="truncate">{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Event Type (Left) + View Detail / Ended (Right) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="relative group/tooltip">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 cursor-help transition-all ${
                      isPublicVenue
                        ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}>
                      {isPublicVenue ? '🏛️ อีเวนต์สาธารณะ' : '🏡 กิจกรรมชุมชน'}
                    </span>

                    {/* Tooltip Popup */}
                    <div className="absolute bottom-full left-0 mb-2 w-52 p-2.5 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none z-30 leading-relaxed backdrop-blur-md">
                      {isPublicVenue ? (
                        <>
                          <strong className="block text-sky-300 font-bold mb-0.5">🏛️ อีเวนต์สาธารณะ:</strong>
                          งานนิทรรศการ / มหกรรมสเกลใหญ่ หาเพื่อนร่วมเดินงานด้วยกันได้
                        </>
                      ) : (
                        <>
                          <strong className="block text-emerald-300 font-bold mb-0.5">🏡 กิจกรรมชุมชน:</strong>
                          กลุ่มย่อยอบอุ่น จัดโดยสมาชิก มีโฮสต์คอยต้อนรับ ไปคนเดียวไม่เกร็ง
                        </>
                      )}
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                    </div>
                  </div>

                  {event.status === 'ended' ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      🏁 สิ้นสุดแล้ว
                    </span>
                  ) : (
                    <span className="text-[#4A7C59] font-bold text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>ดูรายละเอียด</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
