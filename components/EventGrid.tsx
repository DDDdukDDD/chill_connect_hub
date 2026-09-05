'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, CheckCircle2, Sparkles, Building2, Tag, RotateCcw, ExternalLink, Search, Globe, Repeat } from 'lucide-react';
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
  responsiveLimit?: { mobile: number; desktop: number };
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
  responsiveLimit,
}) => {
  if (events.length === 0) {
    return (
      <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
              {isFavoritesOnly ? 'ยังไม่มีรายการโปรดที่บันทึกไว้' : 'ยังไม่พบกิจกรรมที่ตรงกับเงื่อนไขนี้'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isFavoritesOnly
                ? 'กดปุ่มหัวใจ ❤️ ที่การ์ดเพื่อบันทึกกิจกรรมที่คุณสนใจ'
                : 'ลองปรับคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูกิจกรรมที่เปิดรับทั้งหมด'}
            </p>
          </div>
        </div>

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>ดูทั้งหมด</span>
          </button>
        )}
      </div>
    );
  }

  // Determine items to display based on responsiveLimit
  const displayedEvents = responsiveLimit
    ? events.slice(0, responsiveLimit.desktop)
    : events;

  return (
    <div className="space-y-4">
      {/* GRID VIEW: Responsive 5-Column Grid Layout on Desktop/Wide Screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
        {displayedEvents.map((event, idx) => {
          const isFav = favorites.includes(event.id);
          const isJoined = joinedEventIds.includes(event.id);
          const isEnded = isEventEnded(event);
          const fillRatio = event.participantsCount / event.maxParticipants;
          const isAlmostFull = fillRatio >= 0.8;
          const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;
          const isHiddenOnMobile = responsiveLimit && idx >= responsiveLimit.mobile;

          const detailHref = event.eventType === 'public_venue'
            ? `/fairs/${encodeURIComponent(event.id)}`
            : `/community/${encodeURIComponent(event.id)}`;

          return (
            <motion.div
              key={event.id}
              id={`event-${event.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx, 10) * 0.04 }}
              className={isHiddenOnMobile ? 'hidden sm:block' : 'block'}
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

                  {/* Top-Left Badges: NEW tag & Distance */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    {event.isNew && (
                      <span className="text-[10px] font-black bg-gradient-to-r from-emerald-500 to-[#4A7C59] text-white px-2.5 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>NEW</span>
                      </span>
                    )}
                    {event.distanceKm !== undefined && (
                      <span className="text-[10px] font-semibold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full shadow-xs">
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
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer ${
                        isFav
                          ? 'bg-[#F26430] text-white shadow-md shadow-orange-500/30 ring-1 ring-white/30'
                          : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-[#F26430]'
                      }`}
                      title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-white text-white' : ''
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
                    <h3 
                      className="font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] group-hover:text-[#4A7C59] transition-colors leading-[1.3] tracking-tight"
                      title={event.title}
                    >
                      {event.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {event.scheduleType === 'recurring' ? (
                          <Repeat className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {event.scheduleType === 'recurring' && event.recurrence?.customSummary
                            ? `${event.recurrence.customSummary} • ${event.time}`
                            : `${event.date} • ${event.time}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        {event.province === 'ออนไลน์' ? (
                          <>
                            <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate text-sky-700 font-medium">ออนไลน์ • {event.location}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {event.province ? `${event.province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : event.province.replace('จังหวัด', '')} • ` : ''}
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats: Only for Community meetups (Buddies/Slots) or past events */}
                  {event.eventType !== 'public_venue' ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.participantsCount || 0}/{event.maxParticipants || 10} คน</span>
                      </div>

                      {isEnded ? (
                        <span className="text-[11px] font-medium text-slate-400">จบกิจกรรมแล้ว</span>
                      ) : isAlmostFull ? (
                        <span className="text-[11px] font-semibold text-[#F26430]">ใกล้เต็มแล้ว</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#4A7C59]">เปิดรับสมัคร</span>
                      )}
                    </div>
                  ) : isEnded ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
                      <span className="text-[11px] font-medium text-slate-400">จัดเสร็จสิ้นแล้ว</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
