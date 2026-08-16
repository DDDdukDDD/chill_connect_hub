'use client';

import React, { useState } from 'react';
import { EventItem } from '@/data/mockData';
import { X, Calendar, MapPin, Users, Heart, Share2, CheckCircle2, ShieldCheck, Clock, ExternalLink, UserPlus, Sparkles, MessageCircle } from 'lucide-react';

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
  const [buddyRequested, setBuddyRequested] = useState(false);

  if (!event) return null;

  const isPublicVenue = event.eventType === 'public_venue';

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

  const handleRequestBuddy = () => {
    setBuddyRequested(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Card */}
      <div 
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E8E2D8] flex flex-col max-h-[90vh] relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Image Banner */}
        <div className="relative h-40 sm:h-48 w-full bg-slate-100 shrink-0 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:bg-white transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Event Type & Tag Pill */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
              isPublicVenue ? 'bg-[#F26430] text-white' : 'bg-white/90 text-[#1E293B]'
            }`}>
              {isPublicVenue ? '📍 งานอีเวนต์สาธารณะ / ศูนย์จัดแสดง' : event.tag}
            </div>
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

        {/* Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Header Title */}
          <div>
            <span className="text-xs font-bold text-[#4A7C59] tracking-wider uppercase">
              {isPublicVenue ? 'VENUE spotlight & PUBLIC EVENT' : `กิจกรรม ${event.category.toUpperCase()}`}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] mt-0.5 leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Host / Organizer Info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#4A7C59] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {event.hostName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#64748B] font-medium">
                  {isPublicVenue ? 'ผู้จัดงาน / สถานที่' : 'จัดโดย Host'}
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-1 truncate">
                  <span>{event.hostName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                </p>
              </div>
            </div>

            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#F26430] bg-white border border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>เว็บหลักผู้จัด</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">วันที่จัดงาน</p>
                <p className="font-semibold text-[#1E293B]">{event.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">เวลาเปิดงาน</p>
                <p className="font-semibold text-[#1E293B]">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <MapPin className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">สถานที่จัดงาน</p>
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

          {/* Special Event Buddy Finder (สำหรับงานสาธารณะ) */}
          {isPublicVenue && (
            <div className="bg-gradient-to-br from-emerald-50 to-orange-50/60 p-4 rounded-2xl border border-[#C5DCCB] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F26430]" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B]">
                    🤝 หาเพื่อนไปเดินงานนี้ด้วยกัน (Event Buddy)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-[#4A7C59] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                  มีเพื่อนหาคู่ไปงาน {event.buddyCount || 12} คน
                </span>
              </div>

              {/* Sample Buddy Posts */}
              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1E293B]">คุณส้ม (Som_Chill)</p>
                      <p className="text-[#475569] truncate">อยากไปเดินงานวันเสาร์นี้ หาเพื่อนจิบกาแฟก่อนเข้างานค่ะ ☕</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBuddyRequested(true)}
                    className="text-[11px] font-bold text-[#F26430] hover:underline shrink-0"
                  >
                    ทักทาย
                  </button>
                </div>
              </div>

              {/* Post Buddy Request Action */}
              {!buddyRequested ? (
                <button
                  onClick={handleRequestBuddy}
                  className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-2 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ประกาศหาเพื่อนไปงานนี้ด้วย (+1)</span>
                </button>
              ) : (
                <div className="bg-emerald-600 text-white text-xs font-bold p-2 rounded-xl text-center flex items-center justify-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ประกาศหาเพื่อนไปงานเรียบร้อย! เพื่อนๆ ในฮับจะเห็นคำขอของคุณ</span>
                </div>
              )}
            </div>
          )}

          {/* Non-Public Participants Progress Bar */}
          {!isPublicVenue && (
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
              
              <div className="w-full h-2 bg-emerald-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A7C59] rounded-full transition-all duration-500"
                  style={{ width: `${(event.participantsCount / event.maxParticipants) * 100}%` }}
                />
              </div>
            </div>
          )}

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
            ปิดหน้าต่าง
          </button>

          {isPublicVenue ? (
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
                  <span>บันทึกเข้าตารางนัดแล้ว!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-white" />
                  <span>📌 บันทึกใส่ตารางนัด / ไปด้วย</span>
                </>
              )}
            </button>
          ) : (
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
          )}
        </div>

      </div>
    </div>
  );
};
