'use client';

import React from 'react';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, CheckCircle2, LayoutGrid, List, Sparkles, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventGridProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
  viewMode?: 'grid' | 'list';
  onToggleViewMode?: (mode: 'grid' | 'list') => void;
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
  viewMode = 'grid',
  onToggleViewMode,
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
    <div className="space-y-4">
      {/* View Switcher Header Bar if handler exists */}
      {onToggleViewMode && (
        <div className="flex items-center justify-between px-1 py-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            พบทั้งหมด <span className="text-[#4A7C59] font-bold">{events.length}</span> กิจกรรม
          </p>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#4A7C59] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="ตาราง (Grid View)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">การ์ด</span>
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-[#4A7C59] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="รายการ (List View)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">รายการ</span>
            </button>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => {
            const isFav = favorites.includes(event.id);
            const fillRatio = event.participantsCount / event.maxParticipants;
            const isAlmostFull = fillRatio >= 0.8;
            const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="group bg-white rounded-2xl border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                  {/* Top-Left Status Badge */}
                  {event.badgeText && (
                    <div className="absolute top-3 left-3 bg-[#F26430] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{event.badgeText}</span>
                    </div>
                  )}

                  {/* Floating Favorite Heart Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(event.id);
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all z-10"
                    title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                      }`}
                    />
                  </button>

                  {/* Price Tag Badge */}
                  {event.price && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/20 shadow-sm flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>{event.price}</span>
                    </div>
                  )}

                  {/* Category Tag */}
                  <div className={`absolute bottom-3 right-3 ${catStyle.bg} ${catStyle.text} ${catStyle.border} border px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md`}>
                    {event.tag}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Host Info */}
                    <div className="flex items-center gap-2">
                      <img
                        src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={event.hostName}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-medium text-slate-600 truncate flex items-center gap-1">
                        {event.hostName}
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectEvent(event)}
                      className="font-bold text-base sm:text-lg text-[#1E293B] line-clamp-2 leading-snug group-hover:text-[#4A7C59] cursor-pointer transition-colors"
                    >
                      {event.title}
                    </h3>

                    {/* Meta Information */}
                    <div className="space-y-1.5 text-xs sm:text-sm text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0" />
                        <span>{event.date} • {event.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#F26430] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>ที่นั่ง {event.participantsCount}/{event.maxParticipants}</span>
                      </span>
                      {isAlmostFull && (
                        <span className="text-amber-600 font-semibold text-[11px] animate-pulse">
                          ใกล้เต็มแล้ว!
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAlmostFull ? 'bg-gradient-to-r from-amber-400 to-[#F26430]' : 'bg-[#4A7C59]'
                        }`}
                        style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                    {event.rating ? (
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{event.rating}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">ใหม่</span>
                    )}

                    <button
                      onClick={() => onSelectEvent(event)}
                      className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md shadow-[#F26430]/20 active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>เข้าร่วม</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="space-y-3">
          {events.map((event, idx) => {
            const isFav = favorites.includes(event.id);
            const fillRatio = event.participantsCount / event.maxParticipants;
            const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => onSelectEvent(event)}
                className="group bg-white rounded-2xl border border-[#E8E2D8] p-3 sm:p-4 hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer"
              >
                {/* Thumbnail Image */}
                <div className="relative w-full sm:w-44 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute top-2 left-2 ${catStyle.bg} ${catStyle.text} text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border ${catStyle.border}`}>
                    {event.tag}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{event.hostName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    {event.price && (
                      <span className="text-xs font-bold text-[#4A7C59] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {event.price}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#4A7C59] transition-colors line-clamp-1">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#4A7C59]" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {event.participantsCount}/{event.maxParticipants} คน
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(event.id);
                    }}
                    className="p-2 rounded-full hover:bg-slate-100 text-[#F26430] transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-[#F26430]' : 'text-slate-400'}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    className="bg-[#F26430] hover:bg-[#D95322] text-white px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm active:scale-95"
                  >
                    รายละเอียด
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
