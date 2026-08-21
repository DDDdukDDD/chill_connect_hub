'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/data/mockData';
import { X, Calendar, MapPin, Users, Heart, Share2, CheckCircle2, ShieldCheck, Clock, ExternalLink, Ticket, AlertCircle, Bell, Navigation2, MessageCircle, Check, Copy } from 'lucide-react';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onJoinSuccess: (eventId: string) => void;
  onLeaveSuccess?: (eventId: string) => void;
  isJoined?: boolean;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  isFavorite,
  onToggleFavorite,
  onJoinSuccess,
  onLeaveSuccess,
  isJoined = false,
  isLoggedIn = true,
  onRequireLogin,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFollowingHost, setIsFollowingHost] = useState(false);
  const [showConfirmJoinModal, setShowConfirmJoinModal] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
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

  const handleOpenJoinConfirm = () => {
    if (!isLoggedIn && onRequireLogin) {
      onClose();
      onRequireLogin();
      return;
    }
    setShowConfirmJoinModal(true);
  };

  const handleExecuteJoin = () => {
    setShowConfirmJoinModal(false);
    onJoinSuccess(event.id);
  };

  const handleExecuteLeave = () => {
    setShowConfirmCancelModal(false);
    if (onLeaveSuccess) {
      onLeaveSuccess(event.id);
    }
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

  const handleShare = async () => {
    const deepLinkUrl = typeof window !== 'undefined' ? `${window.location.origin}/?event=${event.id}` : '';
    const shareData = {
      title: event.title,
      text: `ไปกิจกรรมนี้กันมั้ย! "${event.title}" 📍 ${event.location} (${event.date})`,
      url: deepLinkUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user cancelled
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareLine = () => {
    const text = encodeURIComponent(`ไปกิจกรรมนี้กันมั้ย! "${event.title}" 📍 ${event.location} (${event.date})\n${typeof window !== 'undefined' ? window.location.href : ''}`);
    window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      
      {/* Modal Card (Floats comfortably above mobile navigation) */}
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8E2D8] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Image Banner (Compact 115px mobile / 140px desktop) */}
        <div className="relative aspect-21/9 sm:aspect-16/7 w-full overflow-hidden bg-slate-100 shrink-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#1E293B] hover:bg-white transition-all z-10 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Favorite Heart Icon on Photo */}
          <div className="absolute bottom-3 right-3">
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
        <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Ended Status Banner */}
          {event.status === 'ended' && (
            <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs text-slate-700 font-bold animate-fade-in">
              <span className="flex items-center gap-1.5">
                <span className="text-base">🏁</span>
                <span>กิจกรรมนี้จัดเสร็จสิ้นไปแล้ว (เมื่อวันที่ {event.date})</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md font-semibold">
                ปิดรับสมัคร
              </span>
            </div>
          )}

          {/* Joined Status Badge (If already registered) */}
          {isJoined && (
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-800 font-bold animate-fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>คุณลงทะเบียนเข้าร่วมกิจกรรมนี้เรียบร้อยแล้ว 🎟️</span>
              </span>
              <Link
                href="/challenge"
                onClick={onClose}
                className="text-[11px] text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 font-extrabold shrink-0"
              >
                ดูตั๋ว ➔
              </Link>
            </div>
          )}

          {/* Header Title & Quick Share Row */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block ${
                event.status === 'ended'
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : isPublicVenue
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {event.status === 'ended'
                  ? '🏁 กิจกรรมที่ผ่านมา'
                  : isPublicVenue
                  ? '🏛️ อีเวนต์สาธารณะ'
                  : '🏡 กิจกรรมชุมชน'}
              </span>

              {/* Universal Global Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                title="แชร์กิจกรรม"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3 text-slate-500" />
                    <span>แชร์กิจกรรม</span>
                  </>
                )}
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] mt-1 leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Details & Host Row with Clean Google Maps Link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.time}</span>
            </div>

            {/* Location with Clean Google Maps Link (No Front Icon) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:col-span-3 pt-2.5 border-t border-slate-200/60">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="w-4 h-4 text-[#F26430] shrink-0" />
                <span className="font-bold text-[#1E293B] truncate text-xs sm:text-sm">{event.location}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-[#1E293B] hover:text-[#F26430] border border-slate-200 hover:border-orange-300 text-xs font-bold shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer"
                title="เปิดดูตำแหน่งและเส้นทางบน Google Maps"
              >
                <span>เปิด Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E293B]">รายละเอียดกิจกรรม</h4>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Host Info Box */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={event.hostName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-[#1E293B]">
                      {event.hostName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    {isPublicVenue
                      ? '🏛️ ผู้จัดงานนิทรรศการสาธารณะ'
                      : '🏡 ผู้จัดกิจกรรมชุมชน (ชวนเพื่อนๆ ร่วมทำกิจกรรม)'}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${
                isPublicVenue
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {isPublicVenue ? '🏛️ อีเวนต์สาธารณะ' : '🏡 กิจกรรมชุมชน'}
              </span>
            </div>
          </div>

          {/* Community Feedback & Reviews Section (Only for Community Events) */}
          {!isPublicVenue && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#4A7C59]" />
                  <span>ความประทับใจจากเพื่อนๆ</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({event.reviews?.length || 0})
                  </span>
                </h4>
              </div>

              {event.reviews && event.reviews.length > 0 ? (
                <div className="space-y-2">
                  {event.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.userAvatar}
                            alt={rev.userName}
                            className="w-6 h-6 rounded-full object-cover border border-slate-300"
                          />
                          <span className="font-bold text-[#1E293B]">{rev.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                      </div>

                      <p className="text-slate-700 leading-relaxed pl-8">
                        {rev.comment}
                      </p>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-8 pt-0.5">
                          {rev.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold text-[#4A7C59] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600">🌱 ยังไม่มีความเห็นก่อนหน้า</p>
                  <p className="text-[11px] text-slate-400">
                    กิจกรรมนี้เป็นโอกาสดีที่คุณจะได้ร่วมงานและบอกเล่าความประทับใจให้เพื่อนๆ ฟัง!
                  </p>
                </div>
              )}
            </div>
          )}

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

        {/* Modal Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-[#E8E2D8] flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          
          {event.status === 'ended' ? (
            /* When Event Has Ended: Disabled State + Follow Host CTA */
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-full font-bold text-xs sm:text-sm bg-slate-200 text-slate-500 cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                <span>🏁 สิ้นสุดแล้ว</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFollowingHost(!isFollowingHost)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                  isFollowingHost
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-[#4A7C59] hover:bg-[#3B6447] text-white shadow-[#4A7C59]/20'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isFollowingHost ? '✓ ติดตามแล้ว (แจ้งเตือนรอบหน้า)' : '🔔 ติดตามโฮสต์รอบหน้า'}</span>
              </button>
            </div>
          ) : isJoined ? (
            /* When Already Joined: Provide direct Ticket Hub button + Cancel option */
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmCancelModal(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-full border border-rose-200 transition-all cursor-pointer"
              >
                ✕ ยกเลิกการเข้าร่วม
              </button>

              <Link
                href="/challenge"
                onClick={onClose}
                className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#4A7C59]/20 flex items-center gap-1.5 active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                <span>ดูตั๋วกิจกรรมของฉัน</span>
              </Link>
            </div>
          ) : (
            /* When Not Joined: Share + Confirm to Register */
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                title="แชร์กิจกรรมนี้ให้เพื่อน"
              >
                <Share2 className="w-3.5 h-3.5 text-[#F26430]" />
                <span>{copied ? '✓ คัดลอกแล้ว' : 'แชร์กิจกรรม'}</span>
              </button>

              <button
                onClick={handleOpenJoinConfirm}
                className="flex-1 sm:flex-initial px-6 sm:px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25 active:scale-95"
              >
                {isPublicVenue ? (
                  <>
                    <Calendar className="w-4 h-4 text-white" />
                    <span>บันทึกลงตารางนัด</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>ยืนยันเข้าร่วมกิจกรรม</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* POPUP 1: Double Confirm Join Modal (ป้องกันการกดผิด) */}
      {showConfirmJoinModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-[#E8E2D8] text-center space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F26430] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
                {isPublicVenue ? 'ยืนยันบันทึกลงตารางนัด?' : 'ยืนยันการเข้าร่วมกิจกรรม?'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                คุณกำลังจะลงทะเบียนเข้าร่วม: <br />
                <strong className="text-[#1E293B]">{event.title}</strong>
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                📅 {event.date} • ⏰ {event.time}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmJoinModal(false)}
                className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleExecuteJoin}
                className="w-full py-2.5 rounded-full bg-[#F26430] hover:bg-[#D95322] text-white text-xs font-bold shadow-md shadow-[#F26430]/25 active:scale-95 cursor-pointer"
              >
                ยืนยันเข้าร่วม 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Double Confirm Cancel Join Modal (กรณีกดยกเลิก) */}
      {showConfirmCancelModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-rose-200 text-center space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
                ยืนยันยกเลิกการเข้าร่วม?
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                คุณต้องการยกเลิกการลงทะเบียนกิจกรรม <strong className="text-[#1E293B]">"{event.title}"</strong> ใช่หรือไม่?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmCancelModal(false)}
                className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ไม่ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteLeave}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 active:scale-95 cursor-pointer"
              >
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
