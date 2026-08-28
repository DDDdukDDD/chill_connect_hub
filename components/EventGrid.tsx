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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  href={`/events/${encodeURIComponent(event.id)}`}
                  onClick={() => onSelectEvent && onSelectEvent(event)}
                  className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer relative h-full ${
                    isJoined
                      ? 'border-2 border-[#4A7C59] ring-2 ring-[#4A7C59]/15 shadow-md'
                      : 'border border-[#E8E2D8] shadow-xs hover:shadow-lg'
                  }`}
                >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border flex items-center gap-1 ${
                      isJoined ? 'bg-[#4A7C59] text-white border-white/40' : 'bg-white/95 text-[#1E293B] border-white/50'
                    }`}>
                      {isJoined ? (event.eventType === 'public_venue' ? 'บันทึกนัดแล้ว' : 'เข้าร่วมแล้ว') : 'ดูรายละเอียด'}
                    </span>
                  </div>

                  {!isEnded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all z-10"
                      title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
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
                        <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                          event.price.includes('ฟรี')
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
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAlmostFull
                              ? 'bg-gradient-to-r from-amber-400 to-[#F26430]'
                              : 'bg-[#4A7C59]'
                          }`}
                          style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Area: Event Type (Left) + CTA Button (Right) */}
                  <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 mt-auto">
                    {/* Event Type Badge with Floating Hover Tooltip (Always Community / Public Venue) */}
                    <div className="relative group/tooltip">
                      <span className={`text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 cursor-help transition-all ${
                        event.eventType === 'public_venue'
                          ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}>
                        <span>
                          {event.eventType === 'public_venue' ? (
                            '🏛️ อีเวนต์ & งานแฟร์'
                          ) : (
                            <>
                              <span className="inline sm:hidden">🌿 Chill & Connect</span>
                              <span className="hidden sm:inline">🌿 Chill & Connect Community</span>
                            </>
                          )}
                        </span>
                      </span>

                      {/* Tooltip Popup */}
                      <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none z-30 leading-relaxed backdrop-blur-md">
                        {event.eventType === 'public_venue' ? (
                          <>
                            <strong className="block text-sky-300 font-extrabold mb-0.5">🏛️ อีเวนต์ & งานแฟร์:</strong>
                            งานคอนเสิร์ต มหกรรม นิทรรศการ หรือแมตช์กีฬาจัดโดยผู้จัดทางการ
                          </>
                        ) : (
                          <>
                            <strong className="block text-emerald-300 font-extrabold mb-0.5">🌿 Chill & Connect Community:</strong>
                            กิจกรรมนัดพบกลุ่มย่อยจากเพื่อนๆ และโฮสต์บนแพลตฟอร์ม ชวนทำกิจกรรมสนุกๆ ไปด้วยกัน
                          </>
                        )}
                        {/* Downward Arrow */}
                        <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    {/* Right Action Button or Ended Status Badge */}
                    {isEnded ? (
                      <span 
                        onClick={() => onSelectEvent(event)}
                        className="px-3 sm:px-3.5 py-1.5 rounded-full font-bold text-[11px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200/80 flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-colors"
                        title="คลิกเพื่อดูรายละเอียดและรีวิวกิจกรรม"
                      >
                        <span>สิ้นสุดแล้ว</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectEvent(event)}
                        className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-xs hover:shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                          isJoined
                            ? 'bg-[#4A7C59] text-white shadow-[#4A7C59]/20'
                            : 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-[#F26430]/20'
                        }`}
                      >
                        <span>
                          {isJoined
                            ? (event.eventType === 'public_venue' ? 'บันทึกนัดแล้ว' : 'เข้าร่วมแล้ว')
                            : event.eventType === 'public_venue'
                            ? 'ดูรายละเอียด'
                            : 'เข้าร่วม'}
                        </span>
                      </button>
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
