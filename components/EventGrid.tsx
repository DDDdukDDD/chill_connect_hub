'use client';

import React from 'react';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, Flame } from 'lucide-react';

interface EventGridProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
}

export const EventGrid: React.FC<EventGridProps> = ({
  events,
  onSelectEvent,
  favorites,
  toggleFavorite,
}) => {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D8] shadow-sm my-6">
        <div className="w-16 h-16 bg-[#EBF3ED] text-[#4A7C59] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🔍
        </div>
        <h3 className="text-xl font-bold text-[#1E293B]">ไม่พบกิจกรรมที่คุณกำลังค้นหา</h3>
        <p className="text-[#64748B] text-sm mt-1">
          ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
      {events.map((event) => {
        const isFav = favorites.includes(event.id);

        return (
          <div
            key={event.id}
            className="group bg-white rounded-2xl border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1"
          >
            {/* Image Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

              {/* Optional Top-Left Status Badge (Trending / New) */}
              {event.badgeText && (
                <div className="absolute top-3 left-3 bg-[#F26430] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  <span>{event.badgeText}</span>
                </div>
              )}

              {/* Floating Favorite Heart Icon (Top Right) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(event.id);
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all"
                title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                  }`}
                />
              </button>

              {/* Floating Tag Badge (Bottom Right inside Image) */}
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-xs font-semibold text-[#1E293B] shadow-sm">
                {event.tag}
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
              
              <div className="space-y-3">
                {/* Title */}
                <h3 
                  onClick={() => onSelectEvent(event)}
                  className="font-bold text-base sm:text-lg text-[#1E293B] line-clamp-2 leading-snug group-hover:text-[#4A7C59] cursor-pointer transition-colors"
                >
                  {event.title}
                </h3>

                {/* Meta Information */}
                <div className="space-y-1.5 text-xs sm:text-sm text-[#64748B]">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0" />
                    <span>{event.date}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F26430] shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-[#64748B] font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>{event.participantsCount}/{event.maxParticipants}</span>
                  </span>
                  
                  {event.rating && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{event.rating}</span>
                    </span>
                  )}
                </div>

                {/* Coral Join Button */}
                <button
                  onClick={() => onSelectEvent(event)}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md shadow-[#F26430]/20 active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>Join</span>
                </button>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};
