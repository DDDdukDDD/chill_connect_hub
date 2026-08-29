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
      {/* GRID VIEW: Responsive Grid Layout (Clean and Compact on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5 sm:gap-4">
        {events.map((event, idx) => {
          const isFav = favorites.includes(event.id);
          const isJoined = joinedEventIds.includes(event.id);
          const isEnded = isEventEnded(event);
          const fillRatio = event.participantsCount / event.maxParticipants;
          const isAlmostFull = fillRatio >= 0.8;
          const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;

          return (
            <motion.div
              key={event.id}
              id={`event-${event.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Link
                href={`/events/${encodeURIComponent(event.id)}`}
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

                  {/* Top-Left Badges: Category Type + Distance (Safe spacing from right heart button) */}
                  <div className="absolute top-2 left-2 right-11 flex items-center gap-1.5 flex-wrap z-20 pointer-events-none">
                    {/* Activity Type Badge */}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border border-white/25 flex items-center gap-1 text-white truncate max-w-full pointer-events-auto ${
                      event.eventType === 'public_venue'
                        ? 'bg-slate-900/85 text-sky-200'
                        : 'bg-[#4A7C59]/90 text-white'
                    }`}>
                      {event.eventType === 'public_venue' ? (
                        <span>🏛️ อีเวนต์ & งานแฟร์</span>
                      ) : (
                        <>
                          <span className="inline sm:hidden">🌿 Chill & Connect</span>
                          <span className="hidden sm:inline">🌿 Chill & Connect Community</span>
                        </>
                      )}
                    </span>

                    {/* Distance Badge when searching near me */}
                    {event.distanceKm !== undefined && (
                      <span className="text-[10px] font-black bg-slate-900/90 backdrop-blur-md text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/20 shrink-0 pointer-events-auto">
                        <MapPin className="w-2.5 h-2.5 text-[#F26430]" />
                        <span>{event.distanceKm.toFixed(1)} กม.</span>
                      </span>
                    )}
                  </div>

                  {!isEnded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                      title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                          }`}
                      />
                    </button>
                  )}
                </div>

                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div className="space-y-1.5">
                    {/* Top Row: Host Info (Left) + Clean Price Chip (Right) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={event.hostName}
                          className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">
                          {event.hostName}
                        </span>
                      </div>

                      {/* Clean Price Chip */}
                      {event.price && (
                        <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${event.price.includes('ฟรี')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-orange-50 text-[#F26430] border-orange-200'
                          }`}>
                          {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectEvent(event)}
                      className="font-bold text-xs sm:text-sm lg:text-[13px] xl:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59] cursor-pointer transition-colors"
                    >
                      {event.title}
                    </h3>

                    {/* Meta Information (Compact 2 Rows) */}
                    <div className="space-y-1 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{event.date} • {event.time}</span>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span className="truncate" title={event.location}>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar (Only for Active Community Events) */}
                  {event.eventType !== 'public_venue' && !isEnded && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#4A7C59]" />
                          <span>ที่นั่ง {event.participantsCount}/{event.maxParticipants}</span>
                        </span>
                        {isAlmostFull ? (
                          <span className="text-amber-600 font-semibold text-[10px] animate-pulse">
                            ใกล้เต็มแล้ว!
                          </span>
                        ) : (
                          <span className="text-[#4A7C59] font-medium text-[10px]">
                            เปิดรับสมัคร
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isAlmostFull
                              ? 'bg-gradient-to-r from-amber-400 to-[#F26430]'
                              : 'bg-[#4A7C59]'
                            }`}
                          style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
