import React from 'react';
import { EventItem } from '@/data/mockData';
import { Heart, Calendar, MapPin, Users, Star, CheckCircle2, Sparkles, Building2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventGridProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
  joinedEventIds?: string[];
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
}) => {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D8] shadow-sm space-y-3">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-lg text-[#1E293B]">ไม่พบกิจกรรมที่ค้นหา</h3>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
          ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GRID VIEW: Sleek 4-Column Compact Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {events.map((event, idx) => {
            const isFav = favorites.includes(event.id);
            const isJoined = joinedEventIds.includes(event.id);
            const fillRatio = event.participantsCount / event.maxParticipants;
            const isAlmostFull = fillRatio >= 0.8;
            const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.heal;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => onSelectEvent(event)}
                className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer relative ${
                  isJoined
                    ? 'border-2 border-[#4A7C59] ring-2 ring-[#4A7C59]/15 shadow-md'
                    : 'border border-[#E8E2D8] shadow-sm hover:shadow-xl'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                  {/* Hover Hint Overlay for Beginners */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg border flex items-center gap-1 ${
                      isJoined ? 'bg-[#4A7C59] text-white border-white/40' : 'bg-white/95 text-[#1E293B] border-white/50'
                    }`}>
                      {isJoined ? '🎟️ คุณเข้าร่วมแล้ว (ดูตั๋ว)' : '🔍 คลิกดูรายละเอียด'}
                    </span>
                  </div>

                  {/* Top-Left Status Badge */}
                  {isJoined ? (
                    <div className="absolute top-3 left-3 bg-[#4A7C59] text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5 z-10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>เข้าร่วมแล้ว</span>
                    </div>
                  ) : event.isNew || idx < 2 ? (
                    <div className="absolute top-3 left-3 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 z-10">
                      <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                      <span>มาใหม่</span>
                    </div>
                  ) : event.badgeText ? (
                    <div className="absolute top-3 left-3 bg-[#F26430] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                      <span>{event.badgeText}</span>
                    </div>
                  ) : null}

                  {/* Floating Favorite Heart Icon (Compact Size) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(event.id);
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all z-10"
                    title={isFav ? 'ยกเลิกถูกใจ' : 'บันทึกกิจกรรม'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
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
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2.5">
                  <div className="space-y-2">
                    {/* Host Info */}
                    <div className="flex items-center gap-2">
                      <img
                        src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={event.hostName}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                        {event.hostName}
                        <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-50" />
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectEvent(event)}
                      className="font-bold text-sm sm:text-base text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59] cursor-pointer transition-colors"
                    >
                      {event.title}
                    </h3>

                    {/* Meta Information (Compact 2 Rows) */}
                    <div className="space-y-1 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{event.date} • {event.time}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar (Only for Community Events) */}
                  {event.eventType !== 'public_venue' && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#4A7C59]" />
                          <span>ที่นั่ง {event.participantsCount}/{event.maxParticipants}</span>
                        </span>
                        {isAlmostFull && (
                          <span className="text-amber-600 font-semibold text-[10px] animate-pulse">
                            ใกล้เต็มแล้ว!
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAlmostFull ? 'bg-gradient-to-r from-amber-400 to-[#F26430]' : 'bg-[#4A7C59]'
                          }`}
                          style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Area */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    {event.eventType === 'public_venue' ? (
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#F26430]" />
                        <span>อีเวนต์สาธารณะ</span>
                      </span>
                    ) : event.rating ? (
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{event.rating}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">ใหม่</span>
                    )}

                    <button
                      onClick={() => onSelectEvent(event)}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-xs hover:shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                        isJoined
                          ? 'bg-[#4A7C59] text-white shadow-[#4A7C59]/20'
                          : event.eventType === 'public_venue'
                          ? 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-[#F26430]/20'
                          : 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-[#F26430]/20'
                      }`}
                    >
                      <span>
                        {isJoined
                          ? '✔️ เข้าร่วมแล้ว'
                          : event.eventType === 'public_venue'
                          ? 'ดูรายละเอียด'
                          : 'เข้าร่วม'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
    </div>
  );
};
