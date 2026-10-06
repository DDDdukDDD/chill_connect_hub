'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, RotateCcw, Search, Globe, Repeat, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { isEventEnded } from '@/lib/dateUtils';
import { FloatingCarousel } from '@/components/FloatingCarousel';

interface EventGridProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
  joinedEventIds?: string[];
  onResetFilters?: () => void;
  isFavoritesOnly?: boolean;
  limit?: number;
  responsiveLimit?: { mobile: number; desktop: number };
  columns?: 4 | 5;
  dynamicResponsiveGrid?: boolean;
  layout?: 'grid' | 'carousel';
  viewMode?: 'grid' | 'list';
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
  limit,
  responsiveLimit,
  columns = 5,
  dynamicResponsiveGrid = false,
  layout = 'grid',
  viewMode = 'grid',
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>รีเซ็ตตัวกรอง</span>
          </button>
        )}
      </div>
    );
  }

  // Determine items to display based on limit or responsiveLimit
  const displayedEvents = limit
    ? events.slice(0, limit)
    : responsiveLimit
    ? events.slice(0, responsiveLimit.desktop)
    : events;

  const gridColsClass = columns === 4
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4';

  const renderCard = (event: EventItem, idx: number) => {
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
        transition={{ duration: 0.3, delay: Math.min(idx, 10) * 0.04 }}
        className="block h-full"
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
                    ? event.eventType === 'public_venue'
                      ? 'border-2 border-[#2B527A] ring-2 ring-[#2B527A]/25 shadow-md'
                      : 'border-2 border-[#F26430] ring-2 ring-[#F26430]/25 shadow-md'
                    : 'border border-slate-200/70 hover:border-slate-300 shadow-2xs hover:shadow-md'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60" />

                  {/* Top-Left Badges: Distance + Urgency Pill */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                    {event.distanceKm !== undefined && (
                      <span className="text-[10px] font-semibold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        {event.distanceKm.toFixed(1)} กม.
                      </span>
                    )}
                    {event.eventType !== 'public_venue' && isAlmostFull && !isJoined && !isEnded && (
                      <span className="text-[10px] font-bold bg-slate-900/85 backdrop-blur-md text-white px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        เหลือ {Math.max(1, event.maxParticipants - event.participantsCount)} ที่
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
                          ? event.eventType === 'public_venue'
                            ? 'bg-[#2B527A] text-white shadow-md shadow-sky-900/30 ring-1 ring-white/30'
                            : 'bg-[#F26430] text-white shadow-md shadow-orange-500/30 ring-1 ring-white/30'
                          : event.eventType === 'public_venue'
                          ? 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-[#2B527A]'
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
                        {event.eventType !== 'public_venue' && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50/90 border border-amber-200/60 px-1 py-0.2 rounded shrink-0"
                            title={`คะแนนโฮสต์ ${(event.hostRating || event.rating || 4.9).toFixed(1)} / 5`}
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{(event.hostRating || event.rating || 4.9).toFixed(1)}</span>
                          </span>
                        )}
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
                      className={`font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${
                        event.eventType === 'public_venue' ? 'group-hover:text-[#2B527A]' : 'group-hover:text-[#F26430]'
                      } transition-colors leading-[1.3] tracking-tight`}
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
                        {event.province === 'ออนไลน์' || event.locationType === 'online' ? (
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

                      {isJoined ? (
                        <span className="text-[11px] font-bold text-[#F26430] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>เข้าร่วมแล้ว</span>
                        </span>
                      ) : isEnded ? (
                        <span className="text-[11px] font-medium text-slate-400">จบกิจกรรมแล้ว</span>
                      ) : isAlmostFull ? (
                        <span className="text-[11px] font-semibold text-amber-600">ใกล้เต็มแล้ว</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700">เปิดรับสมัคร</span>
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
  };

  const renderListItem = (event: EventItem, idx: number) => {
    const isFav = favorites.includes(event.id);
    const isJoined = joinedEventIds.includes(event.id);
    const isEnded = isEventEnded(event);
    const fillRatio = event.participantsCount / event.maxParticipants;
    const isAlmostFull = fillRatio >= 0.8;

    const detailHref = event.eventType === 'public_venue'
      ? `/fairs/${encodeURIComponent(event.id)}`
      : `/community/${encodeURIComponent(event.id)}`;

    return (
      <motion.div
        key={event.id}
        id={`event-list-${event.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.03 }}
        className="block"
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
          className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-3.5 gap-3.5 sm:gap-4 relative overflow-hidden cursor-pointer ${
            isJoined
              ? event.eventType === 'public_venue'
                ? 'border-2 border-[#2B527A] ring-2 ring-[#2B527A]/25 shadow-md'
                : 'border-2 border-[#F26430] ring-2 ring-[#F26430]/25 shadow-md'
              : 'border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md'
          }`}
        >
          {/* Main Content Area (Thumbnail + Details) */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Thumbnail */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

              {/* Distance Pill */}
              {event.distanceKm !== undefined && (
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold bg-slate-900/80 backdrop-blur-md text-white px-1.5 py-0.5 rounded-full shadow-2xs">
                  {event.distanceKm.toFixed(1)} กม.
                </span>
              )}

              {/* Mobile Favorite Button */}
              {!isEnded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(event.id);
                  }}
                  className={`sm:hidden absolute top-1.5 right-1.5 w-6 h-6 rounded-full shadow-xs flex items-center justify-center transition-all z-20 cursor-pointer ${
                    isFav
                      ? event.eventType === 'public_venue'
                        ? 'bg-[#2B527A] text-white'
                        : 'bg-[#F26430] text-white'
                      : 'bg-white/90 text-slate-400'
                  }`}
                  title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                >
                  <Heart className={`w-3 h-3 ${isFav ? 'fill-white text-white' : ''}`} />
                </button>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1 space-y-1">
              {/* Metadata Row: Host / Venue + Date/Time */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={event.hostName}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[120px]">
                    {event.hostName}
                  </span>
                  {event.eventType !== 'public_venue' && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded shrink-0"
                      title={`คะแนนโฮสต์ ${(event.hostRating || event.rating || 4.9).toFixed(1)} / 5`}
                    >
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{(event.hostRating || event.rating || 4.9).toFixed(1)}</span>
                    </span>
                  )}
                </div>

                <span className="text-slate-300">•</span>

                {/* Date & Time */}
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                  {event.scheduleType === 'recurring' ? (
                    <Repeat className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {event.scheduleType === 'recurring' && event.recurrence?.customSummary
                      ? `${event.recurrence.customSummary} • ${event.time}`
                      : `${event.date} • ${event.time}`}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3
                className={`font-bold text-sm sm:text-base text-slate-900 line-clamp-1 sm:line-clamp-2 ${
                  event.eventType === 'public_venue' ? 'group-hover:text-[#2B527A]' : 'group-hover:text-[#F26430]'
                } transition-colors leading-snug tracking-tight`}
                title={event.title}
              >
                {event.title}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
                {event.province === 'ออนไลน์' || event.locationType === 'online' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate text-sky-700 font-medium">ออนไลน์ • {event.location}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] sm:text-xs">
                      {event.province ? `${event.province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : event.province.replace('จังหวัด', '')} • ` : ''}
                      {event.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Price, Status / Slots, Desktop Favorite */}
          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:pl-4 sm:border-l sm:border-slate-100/80 min-w-[130px]">
            {/* Price */}
            {event.price && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                  event.price.includes('ฟรี')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {event.price.includes('ฟรี') ? 'เข้าร่วมฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
              </span>
            )}

            {/* Slots or Fair Venue Tag */}
            {event.eventType !== 'public_venue' ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{event.participantsCount || 0}/{event.maxParticipants || 10}</span>
                </div>

                {isJoined ? (
                  <span className="text-[11px] font-bold text-[#F26430] flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>เข้าร่วมแล้ว</span>
                  </span>
                ) : isEnded ? (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">จบแล้ว</span>
                ) : isAlmostFull ? (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">ใกล้เต็ม</span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">เปิดรับ</span>
                )}
              </div>
            ) : isEnded ? (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">จัดเสร็จสิ้น</span>
            ) : null}

            {/* Desktop Favorite Button */}
            {!isEnded && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(event.id);
                  }}
                  className={`w-7 h-7 rounded-full shadow-2xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                    isFav
                      ? event.eventType === 'public_venue'
                        ? 'bg-[#2B527A] text-white shadow-sky-900/20'
                        : 'bg-[#F26430] text-white shadow-orange-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white text-white' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  };

  if (layout === 'carousel') {
    return (
      <FloatingCarousel>
        {displayedEvents.map((event, idx) => (
          <div
            key={event.id}
            className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start flex flex-col h-full"
          >
            {renderCard(event, idx)}
          </div>
        ))}
      </FloatingCarousel>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {displayedEvents.map((event, idx) => renderListItem(event, idx))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GRID VIEW */}
      <div className={`grid ${gridColsClass}`}>
        {displayedEvents.map((event, idx) => renderCard(event, idx))}
      </div>
    </div>
  );
};
