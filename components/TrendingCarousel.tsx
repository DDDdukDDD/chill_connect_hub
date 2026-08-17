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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold shadow-2xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] flex items-center gap-1.5">
              <span>กิจกรรมไฮไลต์ยอดฮิตสัปดาห์นี้</span>
              <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                HOT 🔥
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
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

                {/* Urgency Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#F26430] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">
                  <span>⚡ เหลืออีก {Math.floor(Math.random() * 3) + 1} วัน</span>
                </div>

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(event.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors shadow-sm"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Bottom Tag Badge inside Image */}
                <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                  {event.tag}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
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

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#F26430] text-xs">
                    {event.price}
                  </span>
                  <span className="text-[11px] font-bold text-[#4A7C59] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>ดูรายละเอียด</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
