'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, CheckCircle2, Sparkles, Building2, Tag, RotateCcw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { isEventEnded } from '@/lib/dateUtils';

interface EventGridProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
  joinedEventIds?: string[];
  onResetFilters?: () => void;
  isFavoritesOnly?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
  heal: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badgeBg: 'bg-emerald-600' },
  move: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badgeBg: 'bg-orange-600' },
  chill: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badgeBg: 'bg-sky-600' },
  learn: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badgeBg: 'bg-purple-600' },
};

export const EventGrid: React.FC<EventGridProps> = ({
  events,
  onSelectEvent,
  favorites,
  toggleFavorite,
  joinedEventIds = [],
  onResetFilters,
  isFavoritesOnly = false,
}) => {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8] shadow-sm max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-[#F26430] rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
          🔍
        </div>
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
            {isFavoritesOnly ? 'ยังไม่มีรายการโปรดที่บันทึกไว้' : 'ไม่พบกิจกรรมที่ตรงกับเงื่อนไข'}
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
            {isFavoritesOnly
              ? 'กดรูปหัวใจ ❤️ ที่การ์ดกิจกรรม เพื่อบันทึกงานที่คุณสนใจไว้อ่านหรือกลับมาดูภายหลังได้ง่ายๆ'
              : 'ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรองเพื่อดูกิจกรรมทั้งหมดในระบบ'}
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#4A7C59] hover:bg-[#3B6447] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#4A7C59]/20 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรองและดูทั้งหมด</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GRID VIEW: Responsive 5-Column Grid Layout on Desktop/Wide Screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
        {events.map((event, idx) => {
          const isFav = favorites.includes(event.id);
          const isJoined = joinedEventIds.includes(event.id);
          const isEnded = isEventEnded(event);
          const fillRatio = event.participantsCount / event.maxParticipants;
          const isAlmostFull = fillRatio >= 0.8;
          const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;

          const detailHref = event.eventType === 'public_venue'
            ? `/fairs/${encodeURIComponent(event.id)}`
            : `/community/${encodeURIComponent(event.id)}`;

          return (
            <motion.div
              key={event.id}
              id={`event-${event.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Link
                href={detailHref}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try {
                      sessionStorage.setItem('chill_last_viewed_event', event.id);
                      sessionStorage.setItem('chill_active_tab', event.eventType === 'public_venue' ? 'public_venue' : 'community');
                    } catch (e) {}
                  }
                  if (onSelectEvent) onSelectEvent(event);
                }}
                className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer relative h-full ${
                  isJoined
                    ? 'shadow-[0_8px_30px_rgb(74,124,89,0.15)] ring-1 ring-[#4A7C59]'
                    : 'shadow-lg hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                  {/* Top-Left Badges: Category Type + Distance */}
                  <div className="absolute top-2.5 left-2.5 right-11 flex items-center gap-1.5 flex-wrap z-10">
                    <span className="text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 px-2.5 py-0.5 rounded-full shadow-xs">
                      {event.eventType === 'public_venue' ? 'งานแฟร์ & อีเวนต์' : 'กิจกรรมชุมชน'}
                    </span>

                    {event.distanceKm !== undefined && (
                      <span className="text-[10px] font-medium bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                        {event.distanceKm.toFixed(1)} กม.
                      </span>
                    )}
                  </div>

                  {!isEnded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-xs flex items-center justify-center text-slate-400 hover:text-[#F26430] hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                      title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-[#F26430] text-[#F26430]' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                  <div className="space-y-1.5">
                    {/* Top Row: Host Info + Price */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={event.hostName}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="text-[11px] font-medium text-slate-500 truncate">
                          {event.hostName}
                        </span>
                      </div>

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

                    {/* Title */}
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#4A7C59] transition-colors leading-snug">
                      {event.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.date} • {event.time}</span>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats: Participants & Status */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{event.participantsCount}/{event.maxParticipants} คน</span>
                    </div>

                    {isEnded ? (
                      <span className="text-[11px] font-medium text-slate-400">จบกิจกรรมแล้ว</span>
                    ) : isAlmostFull ? (
                      <span className="text-[11px] font-semibold text-[#F26430]">ใกล้เต็มแล้ว</span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700">เปิดรับสมัคร</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
