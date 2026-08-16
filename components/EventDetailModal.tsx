'use client';

import React, { useState } from 'react';
import { EventItem } from '@/data/mockData';
import { X, Calendar, MapPin, Users, Heart, Share2, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onJoinSuccess: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  isFavorite,
  onToggleFavorite,
  onJoinSuccess,
}) => {
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleJoin = () => {
    setJoined(true);
    onJoinSuccess(event.id);
    setTimeout(() => {
      setJoined(false);
      onClose();
    }, 1800);
  };

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Card - Compact Height with 25% Image Portion */}
      <div 
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E8E2D8] flex flex-col max-h-[88vh] relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Image Banner - Compact Height (25% portion) */}
        <div className="relative h-36 sm:h-44 w-full bg-slate-100 shrink-0 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:bg-white transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Tag Pill */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#1E293B] shadow-sm">
            {event.tag}
          </div>

          {/* Action Icons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:scale-105 transition-all"
              title="แชร์กิจกรรม"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleFavorite(event.id)}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-105 transition-all"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable, 75% portion for full event details) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Header Title */}
          <div>
            <span className="text-xs font-bold text-[#4A7C59] tracking-wider uppercase">
              กิจกรรม {event.category.toUpperCase()}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B] mt-0.5 leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-9 h-9 rounded-full bg-[#4A7C59] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {event.hostName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#64748B] font-medium">จัดโดย Host</p>
              <p className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-1 truncate">
                <span>{event.hostName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">วันที่จัดกิจกรรม</p>
                <p className="font-semibold text-[#1E293B]">{event.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">เวลา</p>
                <p className="font-semibold text-[#1E293B]">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <MapPin className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">สถานที่</p>
                <p className="font-semibold text-[#1E293B]">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E293B]">รายละเอียดกิจกรรม</h4>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Participants Status Bar */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                ผู้เข้าร่วมแล้ว ({event.participantsCount}/{event.maxParticipants} คน)
              </span>
              <span className="text-[#4A7C59] font-bold">
                เหลืออีก {event.maxParticipants - event.participantsCount} ที่นั่ง!
              </span>
            </div>
            
            {/* Progress line */}
            <div className="w-full h-2 bg-emerald-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4A7C59] rounded-full transition-all duration-500"
                style={{ width: `${(event.participantsCount / event.maxParticipants) * 100}%` }}
              />
            </div>
          </div>

          {copied && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center border border-emerald-200">
              คัดลอกลิงก์กิจกรรมเรียบร้อยแล้ว!
            </div>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E8E2D8] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#475569] hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>

          <button
            onClick={handleJoin}
            disabled={joined}
            className={`px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center gap-2 ${
              joined
                ? 'bg-emerald-600 shadow-emerald-600/20'
                : 'bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25 active:scale-95'
            }`}
          >
            {joined ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>เข้าร่วมสำเร็จ!</span>
              </>
            ) : (
              <span>ยืนยันเข้าร่วมกิจกรรม</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
