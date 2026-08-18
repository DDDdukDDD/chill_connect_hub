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
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [joinedSubIds, setJoinedSubIds] = useState<string[]>([]);
  const [subActivities, setSubActivities] = useState([
    {
      id: 'sub-1',
      title: 'ชวนเดินดูโซนนิยายแปล & หนังสือประวัติศาสตร์',
      creatorName: 'คุณมายด์',
      date: '28 มี.ค. 2026',
      time: '14:00 น.',
      membersCount: '2/4 คน',
      meetupPoint: 'หน้าบูธ B02 โซนสำนักพิมพ์มติชน',
      note: 'มาเดินชิลล์ๆ แลกเปลี่ยนหนังสือน่าอ่านกันครับ ไม่เกร็ง มีแวะพักจิบเครื่องดื่มระหว่างทาง',
    },
    {
      id: 'sub-2',
      title: 'หาเพื่อนแวะจิบกาแฟโซน Craft Drip ชิลล์ๆ',
      creatorName: 'คุณน็อต',
      date: '29 มี.ค. 2026',
      time: '15:30 น.',
      membersCount: '3/5 คน',
      meetupPoint: 'หน้าร้านกาแฟ Slow Bar ชั้น 1',
      note: 'นั่งคุยสบายๆ หลังเดินดูงานเสร็จ ใครชอบกาแฟดริปมาแลกเปลี่ยนเมล็ดกาแฟกันได้ครับ',
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

  const handleJoinSubActivity = (subId: string) => {
    if (!isLoggedIn && onRequireLogin) {
      onClose();
      onRequireLogin();
      return;
    }
    if (joinedSubIds.includes(subId)) {
      setJoinedSubIds((prev) => prev.filter((id) => id !== subId));
    } else {
      setJoinedSubIds((prev) => [...prev, subId]);
    }
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
        
        {/* Top Image Banner (Compact 130px) */}
        <div className="relative h-32 sm:h-36 w-full bg-slate-100 shrink-0 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:bg-white transition-all z-10 cursor-pointer"
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
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:scale-105 transition-all cursor-pointer"
              title="แชร์กิจกรรม"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleFavorite(event.id)}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-105 transition-all cursor-pointer"
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
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Header Title */}
          <div>
            <span className="text-xs font-bold text-[#4A7C59] tracking-wider uppercase">
              {isPublicVenue ? 'VENUE SPOTLIGHT & PUBLIC EVENT' : `กิจกรรม ${event.category.toUpperCase()}`}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] mt-0.5 leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Details & Host Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50/90 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.time}</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-3 pt-1 border-t border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.location}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E293B]">รายละเอียดกิจกรรม</h4>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Public Venue Sub-Activities & Buddy Matcher (Below Description) */}
          {isPublicVenue && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B] flex items-center gap-1.5 truncate">
                    <Users className="w-4 h-4 text-[#F26430] shrink-0" />
                    <span>ชวนเพื่อนทำกิจกรรม ({subActivities.length})</span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#64748B] truncate">
                    หาเพื่อนร่วมเดินดูงาน หรือสร้างนัดหมายกลุ่มย่อยของคุณ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubForm(!showSubForm)}
                  className="bg-[#4A7C59] hover:bg-[#3B6447] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>{showSubForm ? '✕ ปิด' : '➕ สร้างกิจกรรม'}</span>
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
                        date: event.date,
                        time: '14:00 น.',
                        membersCount: '1/4 คน',
                        meetupPoint: 'จุดนัดพบ: ล็อบบี้ทางเข้าหน้างาน',
                        note: 'ชวนเดินชิลล์ๆ พูดคุยและทำความรู้จักเพื่อนใหม่ครับ',
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
                      className="bg-[#F26430] hover:bg-[#D95322] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs cursor-pointer"
                    >
                      ยืนยันสร้างกิจกรรมย่อย
                    </button>
                  </div>
                </form>
              )}

              {/* List of sub-activities with expandable details */}
              <div className="space-y-1.5 pt-0.5">
                {subActivities.map((sub: any) => {
                  const isSubJoined = joinedSubIds.includes(sub.id);
                  const isExpanded = expandedSubId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-xl border border-amber-200/80 overflow-hidden shadow-2xs transition-all"
                    >
                      {/* Sub-activity Header Bar with Date before Time */}
                      <div 
                        onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                        className="p-2.5 sm:p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-50/40 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1E293B] truncate flex items-center gap-1">
                            <span>🎯 {sub.title}</span>
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-[#64748B] flex items-center gap-1.5 flex-wrap">
                            <span>จัดโดย <strong className="text-[#1E293B]">{sub.creatorName}</strong></span>
                            <span>•</span>
                            <span className="text-[#4A7C59] font-medium">📅 {sub.date || event.date}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">⏰ {sub.time}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">({sub.membersCount})</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinSubActivity(sub.id);
                            }}
                            className={`text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
                              isSubJoined
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-[#4A7C59] hover:bg-[#3B6447] text-white border-[#4A7C59] shadow-xs'
                            }`}
                          >
                            {isSubJoined ? '🟢 เข้าร่วมแล้ว' : 'เข้าร่วม'}
                          </button>

                          <span className="text-xs text-slate-400">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Details Body */}
                      {isExpanded && (
                        <div className="p-3 bg-amber-50/40 border-t border-amber-100 space-y-2 text-xs text-[#475569] animate-fade-in">
                          <div className="space-y-1">
                            <p className="font-bold text-[#1E293B] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                              <span>{sub.meetupPoint || 'จุดนัดพบ: ล็อบบี้ทางเข้าหน้างาน'}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-amber-200/50">
                              💬 โน้ตจากโฮสต์: {sub.note || 'ยินดีต้อนรับทุกคนครับ มาเดินทำกิจกรรมด้วยกันสบายๆ'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {copied && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center border border-emerald-200">
              คัดลอกลิงก์กิจกรรมเรียบร้อยแล้ว!
            </div>
          )}

        </div>

        {/* Modal Bottom Action Footer (Single Calendar Icon & Clean Text) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-[#E8E2D8] flex items-center justify-end shrink-0">
          {isPublicVenue ? (
            <button
              onClick={handleJoin}
              disabled={joined}
              className={`w-full sm:w-auto px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                joined
                  ? 'bg-emerald-600 shadow-emerald-600/20'
                  : 'bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25 active:scale-95'
              }`}
            >
              {joined ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>บันทึกลงตารางนัดแล้ว!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-white" />
                  <span>บันทึกลงตารางนัด</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joined}
              className={`w-full sm:w-auto px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
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
