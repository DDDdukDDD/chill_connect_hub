'use client';

import React, { useState } from 'react';
import { EventItem } from '@/data/mockData';
import { X, Calendar, MapPin, Users, Heart, Share2, CheckCircle2, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onJoinSuccess: (eventId: string) => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  isFavorite,
  onToggleFavorite,
  onJoinSuccess,
  isLoggedIn = true,
  onRequireLogin,
}) => {
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subTitleInput, setSubTitleInput] = useState('');
  const [subActivities, setSubActivities] = useState([
    {
      id: 'sub-1',
      title: 'ชวนเดินดูโซนนิยายแปล & หนังสือประวัติศาสตร์ 14:00 น.',
      creatorName: 'คุณมายด์',
      time: '14:00 น.',
      membersCount: '2/4 คน',
    },
    {
      id: 'sub-2',
      title: 'หาเพื่อนแวะจิบกาแฟโซน Craft Drip ชิลล์ๆ',
      creatorName: 'คุณน็อต',
      time: '15:30 น.',
      membersCount: '3/5 คน',
    },
  ]);

  if (!event) return null;

  const isPublicVenue = event.eventType === 'public_venue';

  const handleJoin = () => {
    if (!isLoggedIn && onRequireLogin) {
      onClose();
      onRequireLogin();
      return;
    }
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

          {/* Public Venue Sub-Activities & Buddy Matcher */}
          {isPublicVenue && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#F26430]" />
                    <span>ชวนเพื่อนทำกิจกรรมในงานนี้</span>
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    มี 2 กิจกรรมย่อยที่เพื่อนๆ ตั้งหาคนไปทำด้วยกันในงาน
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubForm(!showSubForm)}
                  className="bg-[#4A7C59] hover:bg-[#3B6447] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-all active:scale-95 shrink-0"
                >
                  {showSubForm ? 'ยกเลิก' : '➕ สร้างกิจกรรม'}
                </button>
              </div>

              {/* Form to create sub-activity */}
              {showSubForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!subTitleInput.trim()) return;
                    setSubActivities([
                      {
                        id: `sub-${Date.now()}`,
                        title: subTitleInput.trim(),
                        creatorName: 'คุณส้ม (Som_Chill)',
                        time: '14:00 น.',
                        membersCount: '1/4 คน',
                      },
                      ...subActivities,
                    ]);
                    setSubTitleInput('');
                    setShowSubForm(false);
                  }}
                  className="p-3 bg-white rounded-xl border border-amber-200 space-y-2 animate-fade-in"
                >
                  <label className="text-[11px] font-bold text-[#1E293B]">ตั้งชวนกิจกรรมย่อยภายในงาน:</label>
                  <input
                    type="text"
                    value={subTitleInput}
                    onChange={(e) => setSubTitleInput(e.target.value)}
                    placeholder="เช่น ชวนเดินดูโซนนิยายแปล 14:00 น. หรือ จิบกาแฟโซนดริป"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#F26430]"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#F26430] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs"
                    >
                      ยืนยันสร้างกิจกรรมย่อย
                    </button>
                  </div>
                </form>
              )}

              {/* List of sub-activities */}
              <div className="space-y-2 pt-1">
                {subActivities.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white p-2.5 rounded-xl border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-[#1E293B] truncate">🎯 {sub.title}</p>
                      <p className="text-[10px] text-[#64748B]">
                        จัดโดย {sub.creatorName} • เวลา {sub.time} ({sub.membersCount})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`ส่งคำขอเข้าร่วม "${sub.title}" สำเร็จแล้ว!`)}
                      className="text-[11px] font-bold text-[#F26430] bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full border border-orange-200 shrink-0 transition-colors"
                    >
                      ขอไปด้วย ➔
                    </button>
                  </div>
                ))}
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
