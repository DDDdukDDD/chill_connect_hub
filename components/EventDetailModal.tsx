import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import { X, Calendar, MapPin, Users, Heart, Share2, CheckCircle2, ShieldCheck, Clock, ExternalLink, Ticket, AlertCircle, Bell, Navigation2, MessageCircle, Check, Copy, Sparkles, Flag, ShieldAlert, Lock, AlertTriangle, Plus, ChevronDown, ChevronUp, Image as ImageIcon, HelpCircle, CheckSquare, Star, User, QrCode, ArrowRight } from 'lucide-react';
import { ReportSafetyModal } from './ReportSafetyModal';
import { ProfileModal } from './ProfileModal';
import { getConnectedUserIds, toggleUserConnect } from '@/data/profilesData';

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

export interface SubActivityItem {
  id: string;
  title: string;
  creatorName: string;
  isCreator?: boolean;
  date: string;
  time: string;
  membersCount: string;
  meetupPoint: string;
  targetGender: string;
  targetAge: string;
  note: string;
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
  const [subTimeInput, setSubTimeInput] = useState('14:00 น.');
  const [subMeetupPointInput, setSubMeetupPointInput] = useState('');
  const [subMaxMembers, setSubMaxMembers] = useState(4);
  const [subTargetGender, setSubTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [subTargetAge, setSubTargetAge] = useState('ไม่จำกัดอายุ');
  const [subNoteInput, setSubNoteInput] = useState('');
  const [hasAcceptedSafetyPledge, setHasAcceptedSafetyPledge] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [reportModalTarget, setReportModalTarget] = useState<{ title: string; hostName?: string } | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [joinedSubIds, setJoinedSubIds] = useState<string[]>([]);
  const [selectedProfileQuery, setSelectedProfileQuery] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isBuddyBoxOpen, setIsBuddyBoxOpen] = useState(false);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  const [subActivities, setSubActivities] = useState<SubActivityItem[]>([
    {
      id: 'sub-1',
      title: 'ชวนเดินดูโซนนิยายแปล & หนังสือประวัติศาสตร์',
      creatorName: 'คุณมายด์',
      isCreator: false,
      date: '28 มี.ค. 2026',
      time: '14:00 น.',
      membersCount: '2/4 คน',
      meetupPoint: 'หน้าบูธ B02 โซนสำนักพิมพ์มติชน',
      targetGender: 'all',
      targetAge: 'ไม่จำกัดอายุ',
      note: 'มาเดินชิลล์ๆ แลกเปลี่ยนหนังสือน่าอ่านกันครับ ไม่เกร็ง มีแวะพักจิบเครื่องดื่มระหว่างทาง',
    },
    {
      id: 'sub-2',
      title: 'หาเพื่อนแวะจิบกาแฟโซน Craft Drip ชิลล์ๆ',
      creatorName: 'คุณน็อต',
      isCreator: false,
      date: '29 มี.ค. 2026',
      time: '15:30 น.',
      membersCount: '3/5 คน',
      meetupPoint: 'หน้าร้านกาแฟ Slow Bar ชั้น 1',
      targetGender: 'all',
      targetAge: '20-35 ปี',
      note: 'นั่งคุยสบายๆ หลังเดินดูงานเสร็จ ใครชอบกาแฟดริปมาแลกเปลี่ยนเมล็ดกาแฟกันได้ครับ',
    },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && event) {
      try {
        const stored = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
        if (stored[event.id]?.subId) {
          setJoinedSubIds([stored[event.id].subId]);
        }
      } catch (e) {
        console.log('Error reading joinedSubActivities:', e);
      }
    }
  }, [event]);

  if (!event) return null;

  const isPublicVenue = event.eventType === 'public_venue';
  const isEnded = isEventEnded(event);

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
    const target = subActivities.find((s: any) => s.id === subId);
    if (target && (target.isCreator || target.creatorName?.includes('คุณส้ม'))) {
      return;
    }
    if (joinedSubIds.includes(subId)) {
      // 1-Click In-place Cancel
      const newJoined = joinedSubIds.filter((id) => id !== subId);
      setJoinedSubIds(newJoined);
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
          delete stored[event.id];
          localStorage.setItem('joinedSubActivities', JSON.stringify(stored));
        } catch (e) {
          console.log(e);
        }
      }
    } else if (target) {
      // Enforce 1-group limit: cannot join another group until previous group is cancelled
      if (joinedSubIds.length > 0) {
        return;
      }
      setJoinedSubIds([subId]);
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
          stored[event.id] = {
            eventId: event.id,
            eventTitle: event.title,
            eventImage: event.image,
            eventLocation: event.location,
            eventDate: event.date,
            eventTime: event.time,
            eventPrice: event.price || 'เข้าชมฟรี!',
            eventType: event.eventType || 'public_venue',
            subId: target.id,
            subTitle: target.title,
            creatorName: target.creatorName,
            subTime: target.time,
            subDate: target.date || event.date,
            meetupPoint: target.meetupPoint,
            note: target.note,
          };
          localStorage.setItem('joinedSubActivities', JSON.stringify(stored));
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/?event=${event.id}`;
      if (navigator.share) {
        navigator
          .share({
            title: event.title,
            text: event.description,
            url: shareUrl,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      }
    }
  };

  // Curated photo gallery calculation for rich visuals
  const galleryList = (() => {
    if (event.galleryImages && event.galleryImages.length > 0) return event.galleryImages;
    if (!isPublicVenue) {
      if (event.tag?.includes('กาแฟ') || event.title?.includes('Coffee') || event.title?.includes('กาแฟ')) {
        return [
          event.image,
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
        ];
      }
      if (event.tag?.includes('บอร์ดเกม') || event.title?.includes('บอร์ดเกม')) {
        return [
          event.image,
          'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        ];
      }
      if (event.tag?.includes('วิ่ง') || event.title?.includes('Run') || event.title?.includes('วิ่ง') || event.tag?.includes('HYROX')) {
        return [
          event.image,
          'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80',
        ];
      }
      if (event.tag?.includes('Sound Bath') || event.tag?.includes('โยคะ') || event.title?.includes('โยคะ')) {
        return [
          event.image,
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=600&q=80',
        ];
      }
      return [
        event.image,
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
      ];
    }
    return null;
  })();

  // 📝 Smart Formatted Description Renderer (Paragraphs, Headings, and Custom Bullet Lists)
  const renderFormattedDescription = (text?: string, isExpanded: boolean = false) => {
    if (!text) return null;

    if (!isExpanded && text.length > 120) {
      return (
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed line-clamp-3 whitespace-pre-line">
          {text}
        </p>
      );
    }

    // Split by double line breaks into paragraphs
    const paragraphs = text.split('\n\n');

    return (
      <div className="space-y-2.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
        {paragraphs.map((para, pIdx) => {
          const lines = para.split('\n');
          const hasBullets = lines.some((l) => /^\s*([•\-*▪]|\d+\.)\s+/.test(l));

          if (hasBullets) {
            return (
              <div key={pIdx} className="space-y-1.5">
                {lines.map((line, lIdx) => {
                  const isBullet = /^\s*([•\-*▪]|\d+\.)\s+/.test(line);
                  const isHeader = line.endsWith(':') || /^[✨📚☕🎲🏃🎯🎒📌💡]/.test(line);

                  if (isHeader) {
                    return (
                      <p key={lIdx} className="font-bold text-[#1E293B] pt-1">
                        {line}
                      </p>
                    );
                  }

                  if (isBullet) {
                    const cleanedText = line.replace(/^\s*([•\-*▪]|\d+\.)\s+/, '');
                    return (
                      <div key={lIdx} className="flex items-start gap-2 pl-2 sm:pl-3 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-2" />
                        <span className="flex-1 leading-relaxed">{cleanedText}</span>
                      </div>
                    );
                  }

                  return (
                    <p key={lIdx} className="leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            );
          }

          return (
            <p key={pIdx} className="whitespace-pre-line leading-relaxed">
              {para}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-[#E8E2D8]">
        {/* Modal Top Header Image & Controls (Compact Cinematic Banner) */}
        <div className="relative h-36 sm:h-38 md:h-40 w-full bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

          {/* Top-Right: Close Button (Universal standard position) */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-xs z-10"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Bottom-Right: Favorite Button (Only for active / ongoing events) */}
          {!isEnded && (
            <button
              onClick={() => onToggleFavorite(event.id)}
              className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-xs z-10"
              title={isFavorite ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                }`}
              />
            </button>
          )}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto">

          {/* Joined Status Badge (If already registered) */}
          {isJoined && (
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-800 font-bold animate-fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isPublicVenue
                    ? 'คุณบันทึกงานนี้ลงในตารางนัดหมายแล้ว'
                    : 'คุณลงทะเบียนเข้าร่วมกิจกรรมนี้เรียบร้อยแล้ว'}
                </span>
              </span>
              {!isPublicVenue && (
                <Link
                  href="/myhub"
                  onClick={onClose}
                  className="text-[11px] text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 font-extrabold shrink-0"
                >
                  ดูตั๋ว ➔
                </Link>
              )}
            </div>
          )}

          {/* Main Title & Tags (Clean Optical Spacing) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block ${
                  isPublicVenue
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isPublicVenue ? (
                    '🏛️ อีเวนต์ & งานแฟร์'
                  ) : (
                    <>
                      <span className="inline sm:hidden">🌿 Chill & Connect</span>
                      <span className="hidden sm:inline">🌿 Chill & Connect Community</span>
                    </>
                  )}
                </span>

                {/* 🏷️ Prominent Price Pill (Free vs Paid) */}
                {event.price && (
                  <span className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs inline-block ${
                    event.price.includes('ฟรี')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}>
                    {event.price.includes('ฟรี') ? '🎉 เข้าร่วมฟรี!' : `🏷️ ${event.price}`}
                  </span>
                )}
              </div>

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

          {/* Location with Clean Google Maps Link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="font-semibold text-[#1E293B] truncate">{event.time}</span>
            </div>

            {/* Location with Clean Google Maps Link (Wrapped & size matches date/time) */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:col-span-3 pt-2.5 border-t border-slate-200/60">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0 mt-0.5" />
                <span className="font-bold text-[#1E293B] text-xs leading-relaxed break-words">{event.location}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-[#1E293B] hover:text-[#F26430] border border-slate-200 hover:border-orange-300 text-xs font-bold shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer self-start sm:self-auto"
                title="เปิดดูตำแหน่งและเส้นทางบน Google Maps"
              >
                <span>เปิด Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Participant Criteria & Vibe Badges */}
          {(event.targetGender || event.targetAge || event.energyLevel || (event.maxParticipants && event.eventType !== 'public_venue')) && (
            <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
              {event.targetGender && (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200/80 flex items-center gap-1">
                  <span>{event.targetGender === 'female_only' ? '👩 เฉพาะผู้หญิง' : event.targetGender === 'male_only' ? '👨 เฉพาะผู้ชาย' : '👥 เปิดรับทุกเพศ'}</span>
                </span>
              )}
              {event.targetAge && (
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200/80 flex items-center gap-1">
                  <span>🎂 {event.targetAge}</span>
                </span>
              )}
              {event.energyLevel && (
                <span className={`px-3 py-1 rounded-xl font-bold border flex items-center gap-1 ${
                  event.energyLevel === 'active'
                    ? 'bg-orange-50 text-orange-800 border-orange-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <span>{event.energyLevel === 'active' ? '🔥 สายลุย / Active' : '🌿 ชิลล์ / สโลว์ไลฟ์'}</span>
                </span>
              )}
              {event.maxParticipants > 0 && event.eventType !== 'public_venue' && (
                <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-bold border border-sky-200 flex items-center gap-1">
                  <span>👥 รับสูงสุด {event.maxParticipants} คน</span>
                </span>
              )}
            </div>
          )}

          {/* Description with See more / See less */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-[#1E293B]">รายละเอียดกิจกรรม</h4>
              {event.description && event.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer transition-colors"
                >
                  <span>{isDescriptionExpanded ? 'ย่อเนื้อหา' : 'อ่านต่อ'}</span>
                  {isDescriptionExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              )}
            </div>
            
            {renderFormattedDescription(event.description, isDescriptionExpanded)}
          </div>

          {/* 📸 Event Photo Gallery (4-5 Photos) */}
          {galleryList && galleryList.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>ภาพบรรยากาศกิจกรรม</span>
                  <span className="text-slate-400 text-xs font-normal">({galleryList.length} รูป)</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">คลิกที่รูปเพื่อดูภาพใหญ่</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {galleryList.slice(0, 5).map((imgUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGalleryImg(imgUrl)}
                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:border-[#F26430] cursor-pointer group transition-all"
                  >
                    <img
                      src={imgUrl}
                      alt={`บรรยากาศ ${event.title} รูปที่ ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📋 Guidelines, Rules & What to Bring (Exclusively for Community Meetups) */}
          {!isPublicVenue && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* What to Bring */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs text-slate-700">
                <h5 className="font-extrabold text-[#1E293B] flex items-center gap-1.5 text-xs">
                  <span>🎒 สิ่งที่ควรเตรียมมา</span>
                </h5>
                <ul className="space-y-1 text-[11px] text-[#334155] list-disc list-inside leading-relaxed">
                  <li>แต่งกายตามสะดวก สบายๆ ตามสไตล์กิจกรรม</li>
                  <li>เตรียมกระบอกน้ำหรือของใช้ส่วนตัว</li>
                  <li>เปิดใจ พร้อมร่วมสนุกและทำความรู้จักเพื่อนใหม่</li>
                </ul>
              </div>

              {/* Community Rules & Safety */}
              <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
                <h5 className="font-extrabold text-[#1E293B] flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>กฎระเบียบ & ความปลอดภัย</span>
                </h5>
                <ul className="space-y-1 text-[11px] text-[#334155] list-disc list-inside leading-relaxed">
                  <li>ตรงต่อเวลา (ควรถึงก่อนเวลานัด 10-15 นาที)</li>
                  <li>ให้เกียรติและเคารพความเป็นส่วนตัวของทุกคน</li>
                  <li>ห้ามขายตรง / ชวนลงทุน / คุกคาม 100%</li>
                </ul>
              </div>
            </div>
          )}

          {/* Host Info Box with Official Source Link */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#4A7C59]/40 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={() => !isPublicVenue && setSelectedProfileQuery(event.hostName)}
                className={`flex items-center gap-2 min-w-0 ${!isPublicVenue ? 'cursor-pointer group' : ''}`}
                title={!isPublicVenue ? 'คลิกเพื่อดูโปรไฟล์โฮสต์' : undefined}
              >
                <img
                  src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={event.hostName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#4A7C59] transition-colors truncate">
                      {event.hostName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-[#64748B]">
                    <span>
                      {isPublicVenue
                        ? '🏛️ ผู้จัดงานทางการ / ศูนย์จัดแสดง'
                        : '🌿 โฮสต์ Chill & Connect'}
                    </span>
                    {!isPublicVenue && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{event.hostRating || event.rating || 4.9}</span>
                        </span>
                        <span className="text-slate-500">
                          ({event.hostReviewsCount || event.reviewsCount || (event.reviews?.length || 8)} รีวิว)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Official Source Link (Direct Search Query / Verified Venue Link) or Connect Button */}
              {isPublicVenue ? (
                (() => {
                  const googleSearchQuery = `https://www.google.com/search?q=${encodeURIComponent(`${event.title} ${event.location || ''}`.trim())}`;
                  const isVerifiedDomain = event.externalUrl && (
                    event.externalUrl.includes('qsncc.com') ||
                    event.externalUrl.includes('bitec.co.th') ||
                    event.externalUrl.includes('impact.co.th')
                  );
                  const finalUrl = isVerifiedDomain ? event.externalUrl : googleSearchQuery;

                  return (
                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
                      title="เปิดค้นหาข้อมูลทางการ แผนผังงาน และช่องทางซื้อบัตร"
                    >
                      <span>ดูข้อมูลเพิ่มเติม</span>
                      <ExternalLink className="w-3 h-3 text-sky-600" />
                    </a>
                  );
                })()
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProfileQuery(event.hostName)}
                  className="text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-[#4A7C59] border border-slate-200 shadow-2xs cursor-pointer transition-colors flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <span>ดูโปรไฟล์</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Public Venue Sub-Activities & Buddy Matcher (Collapsible - Hide if Event has Ended) */}
          {isPublicVenue && !isEnded && (
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs overflow-hidden transition-all">
              {/* Collapsible Header */}
              <div
                onClick={() => setIsBuddyBoxOpen(!isBuddyBoxOpen)}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100/50 transition-colors select-none"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B] flex items-center gap-1.5 truncate">
                    <Users className="w-4 h-4 text-[#F26430] shrink-0" />
                    <span>ชวนเพื่อนทำกิจกรรมในงาน ({subActivities.length})</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {isBuddyBoxOpen ? 'แตะเพื่อย่อ' : 'แตะเพื่อเปิดดู'}
                    </span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#64748B] truncate">
                    {isBuddyBoxOpen
                      ? 'หาเพื่อนร่วมเดินดูงาน หรือสร้างนัดหมายกลุ่มย่อยของคุณ'
                      : `มี ${subActivities.length} นัดหมายกลุ่มย่อยกำลังรอเพื่อนร่วมเดินงาน • คลิกเพื่อเปิดดูกลุ่ม`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoggedIn && onRequireLogin) {
                        onClose();
                        onRequireLogin();
                        return;
                      }
                      setIsBuddyBoxOpen(true);
                      setShowSubForm(!showSubForm);
                    }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1 ${
                      showSubForm
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-[#4A7C59] hover:bg-[#3d6849] text-white shadow-[#4A7C59]/20'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showSubForm ? 'ปิดฟอร์ม' : 'ชวนเพื่อน'}</span>
                  </button>
                  <div className="p-1 text-slate-400 hover:text-slate-600">
                    {isBuddyBoxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isBuddyBoxOpen && (
                <div className="p-3.5 sm:p-4 pt-0 space-y-3 border-t border-amber-200/60 mt-0">
                  {/* 🏆 Option 1: Inline Expandable Sub-Activity Creation Form (No Nested Popups!) */}
                  {showSubForm && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSafetyError(null);
                        if (!subTitleInput.trim()) return;

                        // Safety Moderation Filter: Check for forbidden words
                        const SENSITIVE_KEYWORDS = [
                          'ลงทุน', 'forex', 'crypto', 'คริปโต', 'ลูกโซ่', 'ขายตรง', 'mlm', 'งานออนไลน์',
                          'รายได้เสริม', 'การพนัน', 'คาสิโน', 'ยืมเงิน', 'กู้เงิน', '18+', 'เสียว', 'นวดแฝง'
                        ];
                    const allText = `${subTitleInput} ${subMeetupPointInput} ${subNoteInput}`.toLowerCase();
                    const violated = SENSITIVE_KEYWORDS.find((kw) => allText.includes(kw));

                    if (violated) {
                      setSafetyError(`⚠️ ระบบตรวจพบคำว่า "${violated}" ซึ่งขัดต่อแนวทางความปลอดภัยของคอมมูนิตี้ (ห้ามชวนลงทุน/ขายตรง/การพนัน/คุกคาม) กรุณาแก้ไขข้อความครับ`);
                      return;
                    }

                    if (!hasAcceptedSafetyPledge) {
                      setSafetyError('⚠️ กรุณากดติ๊กยอมรับข้อตกลงความปลอดภัยของคอมมูนิตี้ก่อนสร้างกลุ่มครับ');
                      return;
                    }

                    setSubActivities([
                      {
                        id: `sub-${Date.now()}`,
                        title: subTitleInput.trim(),
                        creatorName: 'คุณส้ม (Som_Chill)',
                        isCreator: true,
                        date: event.date,
                        time: subTimeInput.trim() || '14:00 น.',
                        membersCount: `1/${subMaxMembers} คน`,
                        meetupPoint: subMeetupPointInput.trim() || 'จุดนัดพบ: ล็อบบี้ทางเข้าหน้างาน',
                        targetGender: subTargetGender,
                        targetAge: subTargetAge.trim() || 'ไม่จำกัดอายุ',
                        note: subNoteInput.trim() || 'ชวนเดินชิลล์ๆ พูดคุยและทำความรู้จักเพื่อนใหม่ครับ',
                      },
                      ...subActivities,
                    ]);
                    setSubTitleInput('');
                    setSubMeetupPointInput('');
                    setSubNoteInput('');
                    setHasAcceptedSafetyPledge(false);
                    setShowSubForm(false);
                  }}
                  className="p-3.5 sm:p-4 bg-white rounded-2xl border border-amber-300/80 shadow-md space-y-3 animate-scale-up text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                      <span>ตั้งกลุ่มชวนเพื่อนเดินงานนี้</span>
                    </h5>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      นัดกลุ่มย่อย
                    </span>
                  </div>

                  {/* Public Meetup Safety Notice Box */}
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong>มาตรการความปลอดภัย:</strong> จุดนัดพบต้องอยู่ในพื้นที่เปิดของงานที่มีผู้คนสัญจร (เช่น หน้าบูธประชาสัมพันธ์, หน้าร้านกาแฟ) ไม่อนุญาตให้นัดพบในสถานที่ลับตาคน
                    </span>
                  </div>

                  {/* Safety Error Alert */}
                  {safetyError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-start gap-1.5 animate-shake leading-relaxed font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{safetyError}</span>
                    </div>
                  )}

                  {/* Field 1: Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1E293B] flex items-center gap-1">
                      <span>หัวข้อชวนเพื่อน / กิจกรรมที่จะทำ:</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subTitleInput}
                      onChange={(e) => {
                        setSubTitleInput(e.target.value);
                        if (safetyError) setSafetyError(null);
                      }}
                      placeholder="เช่น ชวนเดินดูโซนนิยายแปล 14:00 น., แวะจิบกาแฟดริปพูดคุย"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      required
                    />
                  </div>

                  {/* Field 2: Time & Meetup Spot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">เวลานัดพบ:</label>
                      <input
                        type="text"
                        value={subTimeInput}
                        onChange={(e) => setSubTimeInput(e.target.value)}
                        placeholder="เช่น 14:00 น. หรือ 15:30 น."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">จุดนัดพบในงาน (พื้นที่เปิด):</label>
                      <input
                        type="text"
                        value={subMeetupPointInput}
                        onChange={(e) => setSubMeetupPointInput(e.target.value)}
                        placeholder="เช่น หน้าร้านกาแฟ Slow Bar ชั้น 1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      />
                    </div>
                  </div>

                  {/* Field 3: Participants & Gender Preference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">จำนวนรับ (คน):</label>
                      <select
                        value={subMaxMembers}
                        onChange={(e) => setSubMaxMembers(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      >
                        <option value={2}>2 คน (เดินคู่สบายๆ)</option>
                        <option value={3}>3 คน</option>
                        <option value={4}>4 คน (แนะนำกลุ่มเล็ก)</option>
                        <option value={6}>6 คน</option>
                        <option value={8}>8 คน</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">เพศที่เปิดรับ:</label>
                      <select
                        value={subTargetGender}
                        onChange={(e) => setSubTargetGender(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      >
                        <option value="all">ทุกเพศ (All Genders)</option>
                        <option value="female_only">เฉพาะผู้หญิง (Women Only Safe Zone)</option>
                        <option value="male_only">เฉพาะผู้ชาย (Men Only)</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 4: Custom Age Range & Quick Chips */}
                  <div className="space-y-1 pt-0.5">
                    <label className="text-[11px] font-bold text-[#1E293B] flex items-center justify-between">
                      <span>ช่วงอายุ (กำหนดเองได้อิสระ):</span>
                      <span className="text-[10px] text-slate-500 font-normal">พิมพ์ระบุเองได้</span>
                    </label>
                    <input
                      type="text"
                      value={subTargetAge}
                      onChange={(e) => setSubTargetAge(e.target.value)}
                      placeholder="เช่น 20-35 ปี, วัยทำงาน, ไม่จำกัดอายุ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {['ไม่จำกัดอายุ', '18 - 25 ปี', '20 - 35 ปี', '25 - 40 ปี'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setSubTargetAge(sug)}
                          className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            subTargetAge === sug
                              ? 'bg-[#4A7C59] text-white border-[#4A7C59] font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 5: Note / Message */}
                  <div className="space-y-1 pt-0.5">
                    <label className="text-[11px] font-bold text-[#1E293B]">ข้อความชวนเพื่อนสั้นๆ:</label>
                    <input
                      type="text"
                      value={subNoteInput}
                      onChange={(e) => {
                        setSubNoteInput(e.target.value);
                        if (safetyError) setSafetyError(null);
                      }}
                      placeholder="เช่น ชวนเดินชิลล์ๆ ไม่ต้องเกร็งนะ แวะพักกินของอร่อยกัน"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                    />
                  </div>

                  {/* Safety Pledge Checkbox */}
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasAcceptedSafetyPledge}
                      onChange={(e) => {
                        setHasAcceptedSafetyPledge(e.target.checked);
                        if (safetyError) setSafetyError(null);
                      }}
                      className="mt-0.5 rounded text-[#4A7C59] focus:ring-[#4A7C59] cursor-pointer"
                      required
                    />
                    <span className="leading-tight">
                      ข้าพเจ้ายืนยันว่าจะไม่ใช้กลุ่มนี้ในการชักชวนลงทุน/ขายตรง/การพนัน หรือแสวงหาประโยชน์ส่วนตัวอันไม่เหมาะสม และจะนัดพบในพื้นที่เปิดของงานเท่านั้น 🛡️
                    </span>
                  </label>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowSubForm(false)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="bg-[#4A7C59] hover:bg-[#3B6447] text-white text-xs font-bold px-5 py-2 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <span>ยืนยันสร้างกลุ่มชวนเพื่อน</span>
                    </button>
                  </div>
                </form>
              )}

              {/* List of sub-activities with expandable details & badges */}
              <div className="space-y-2 pt-0.5">
                {subActivities.map((sub: any) => {
                  const isSubJoined = joinedSubIds.includes(sub.id);
                  const isExpanded = expandedSubId === sub.id;
                  const isCreator = sub.isCreator || sub.creatorName === 'คุณส้ม (Som_Chill)' || sub.creatorName?.includes('คุณส้ม');

                  return (
                    <div
                      key={sub.id}
                      className={`bg-white rounded-xl overflow-hidden shadow-2xs transition-all border ${
                        isSubJoined
                          ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                          : 'border-amber-200/80 hover:border-amber-300'
                      }`}
                    >
                      {/* Sub-activity Header Bar with Date before Time */}
                      <div 
                        onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                        className="p-2.5 sm:p-3 space-y-2 cursor-pointer hover:bg-amber-50/40 transition-colors"
                      >
                        {/* Row 1: Full-width Title + Expand Icon & Report Button */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs sm:text-sm font-bold text-[#1E293B] leading-snug flex items-center gap-1 flex-1">
                            <span>🎯 {sub.title}</span>
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportModalTarget({ title: sub.title, hostName: sub.creatorName });
                              }}
                              className="text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors cursor-pointer"
                              title="รายงานความไม่ปลอดภัยของกลุ่มนี้"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-slate-400 select-none">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Host, Date, Time & Members Count */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <span>จัดโดย <strong className="text-[#1E293B]">{sub.creatorName}</strong></span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                              <span>ยืนยันตัวตน</span>
                            </span>
                          </span>
                          <span>•</span>
                          <span className="text-[#4A7C59] font-medium">📅 {sub.date || event.date}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">⏰ {sub.time}</span>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">({sub.membersCount})</span>
                        </div>

                        {/* Row 3: Criteria Badges (Left) & Action Buttons (Right) */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100/60 flex-wrap">
                          {/* Left: Criteria Badges */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {sub.targetGender && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {sub.targetGender === 'female_only' ? '👩 เฉพาะผู้หญิง' : sub.targetGender === 'male_only' ? '👨 เฉพาะผู้ชาย' : '👥 ทุกเพศ'}
                              </span>
                            )}
                            {sub.targetAge && sub.targetAge !== 'ไม่จำกัดอายุ' && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                🎂 {sub.targetAge}
                              </span>
                            )}
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            {isCreator ? (
                              <span className="text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs select-none">
                                คุณเป็นผู้สร้าง
                              </span>
                            ) : isSubJoined ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 select-none">
                                  เข้าร่วมแล้ว
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoinSubActivity(sub.id);
                                  }}
                                  className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                                  title="กดยกเลิกการเข้าร่วมกลุ่มนี้"
                                >
                                  <X className="w-3 h-3" />
                                  <span>ยกเลิก</span>
                                </button>
                                <Link
                                  href={`/myhub?chatSubId=${sub.id}&eventId=${event.id}`}
                                  onClick={onClose}
                                  className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
                                  title="เปิดห้องแชตคุยกับโฮสต์และเพื่อนๆ ที่หน้ามายฮับ"
                                >
                                  <span>💬 คุยในแชต ➔</span>
                                </Link>
                              </div>
                            ) : joinedSubIds.length > 0 ? (
                              <button
                                type="button"
                                disabled
                                className="text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 flex items-center gap-1 select-none"
                                title="คุณเข้าร่วมกลุ่มอื่นในงานนี้อยู่แล้ว กรุณายกเลิกกลุ่มเดิมก่อนเข้าร่วมกลุ่มใหม่"
                              >
                                เข้าร่วม
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinSubActivity(sub.id);
                                }}
                                className="text-[10px] sm:text-[11px] font-bold px-3.5 py-1 rounded-full border bg-[#4A7C59] hover:bg-[#3B6447] text-white border-[#4A7C59] shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                เข้าร่วม
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Body */}
                      {isExpanded && (
                        <div className="p-3 bg-amber-50/40 border-t border-amber-100 space-y-2 text-xs text-[#475569] animate-fade-in text-left">
                          <div className="space-y-1.5">
                            <p className="font-bold text-[#1E293B] flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                              <span>{sub.meetupPoint || 'จุดนัดพบ: ล็อบบี้ทางเข้าหน้างาน'}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-amber-200/50 leading-relaxed">
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
        </div>
      )}

          {/* Public Venue Sub-Activities: Read-only Summary for Ended Events */}
          {isPublicVenue && isEnded && subActivities.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 truncate">
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>กลุ่มชวนเพื่อนที่เคยนัดหมาย ({subActivities.length} กิจกรรม)</span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    สรุปนัดหมายกลุ่มย่อยที่เพื่อนๆ ได้ร่วมทำกิจกรรมในงานนี้
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/90 px-2 py-0.5 rounded-md shrink-0 border border-slate-300/60">
                  🔒 ปิดรับสมัครแล้ว
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {subActivities.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-2.5 bg-white/90 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-slate-700 shadow-2xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                        <span>🎯 {sub.title}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>โดย <strong className="text-slate-700">{sub.creatorName}</strong></span>
                        <span>•</span>
                        <span>⏰ {sub.time}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">({sub.membersCount})</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-semibold shrink-0">
                      ✓ เสร็จสิ้น
                    </span>
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
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-[#E8E2D8] flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          {isEnded ? (
            /* When Event Has Ended: Display clean Ended Badge */
            <div className="flex items-center justify-center sm:justify-end gap-2 w-full">
              <span className="px-5 py-2 rounded-full font-extrabold text-xs sm:text-sm bg-slate-100 text-slate-600 border border-slate-300/80 flex items-center gap-1.5 shadow-2xs">
                <span>🏁 งานนี้จัดเสร็จสิ้นแล้ว</span>
              </span>
            </div>
          ) : isJoined ? (
            /* When Already Joined: If Public Venue, display only "ดูตารางนัดหมาย"; If Community, display Cancel + "ดูตั๋วกิจกรรมของฉัน" */
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
              {!isPublicVenue && (
                <button
                  type="button"
                  onClick={() => setShowConfirmCancelModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-full border border-rose-200 transition-all cursor-pointer"
                >
                  ยกเลิกการเข้าร่วม
                </button>
              )}

              <Link
                href="/myhub"
                onClick={onClose}
                className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ml-auto cursor-pointer"
              >
                {isPublicVenue ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ดูตารางนัดหมาย</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-3.5 h-3.5" />
                    <span>ดูตั๋วกิจกรรมของฉัน</span>
                  </>
                )}
              </Link>
            </div>
          ) : (
            /* When Not Joined: Confirm to Register / Save Schedule */
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={handleOpenJoinConfirm}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25 active:scale-95"
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

      {/* POPUP 1: Double Confirm Join Modal (สำหรับกิจกรรมหลัก) */}
      {showConfirmJoinModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowConfirmJoinModal(false)}
        >
          <div 
            className="bg-white rounded-[36px] p-6 sm:p-8 max-w-lg sm:max-w-xl w-full shadow-2xl border border-[#E8E2D8] text-left space-y-5 animate-scale-up relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Category Pill & Close Button */}
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                isPublicVenue
                  ? 'bg-sky-50 text-[#2B527A] border-sky-200'
                  : 'bg-[#FAF7F2] text-[#4A7C59] border-[#E8E2D8]'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPublicVenue ? 'Official Venue & Fair Pass' : 'กิจกรรมคอมมูนิตี้ • Safe Space Verified'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmJoinModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                {isPublicVenue ? 'ยืนยันบันทึกลงตารางนัดหมาย' : 'ยืนยันการลงทะเบียน'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isPublicVenue ? 'บันทึกอีเวนต์ลง MyHub พร้อมแจ้งเตือนกำหนดการจัดงาน' : 'ร่วมกิจกรรมและพบปะเพื่อนใหม่ในบรรยากาศที่เป็นกันเองและปลอดภัย'}
              </p>
            </div>

            {/* Editorial Reservation Pass Card */}
            <div className="bg-[#FAF7F2] rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] space-y-4 shadow-2xs relative">
              {/* Event Title & Price Pill */}
              <div className="flex items-start justify-between gap-3">
                <h4 className={`text-base sm:text-lg font-black leading-snug ${isPublicVenue ? 'text-[#2B527A]' : 'text-slate-900'}`}>
                  {event.title}
                </h4>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shrink-0">
                  {!event.price || event.price.includes('ฟรี') ? 'เข้าร่วมฟรี' : event.price}
                </span>
              </div>

              {/* Clean Key-Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 font-medium pt-1">
                <div className="flex items-center gap-2.5">
                  <Calendar className={`w-4 h-4 shrink-0 ${isPublicVenue ? 'text-[#2B527A]' : 'text-[#4A7C59]'}`} />
                  <div>
                    <span className="text-slate-400 block text-[11px]">วันที่จัด:</span>
                    <span className="font-bold text-slate-900">{event.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 shrink-0 ${isPublicVenue ? 'text-[#2B527A]' : 'text-[#4A7C59]'}`} />
                  <div>
                    <span className="text-slate-400 block text-[11px]">ช่วงเวลา:</span>
                    <span className="font-bold text-slate-900">{event.time}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isPublicVenue ? 'text-[#2B527A]' : 'text-[#4A7C59]'}`} />
                  <div>
                    <span className="text-slate-400 block text-[11px]">สถานที่:</span>
                    <span className="font-bold text-slate-900 leading-relaxed">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <User className={`w-4 h-4 shrink-0 ${isPublicVenue ? 'text-[#2B527A]' : 'text-[#4A7C59]'}`} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">ผู้จัดงาน:</span>
                    <span className="font-bold text-slate-900">{event.hostName || 'Official Partner'}</span>
                    <ShieldCheck className={`w-3.5 h-3.5 ${isPublicVenue ? 'text-[#2B527A]' : 'text-[#4A7C59]'}`} />
                  </div>
                </div>
              </div>

              {/* Perforated Divider & E-Ticket Guarantee */}
              <div className="border-t border-dashed border-[#E8E2D8] pt-3.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span>ระบบจะสร้าง <strong>QR E-Ticket</strong> และบันทึกเข้าหน้า <strong>MyHub</strong> ให้อัตโนมัติ</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmJoinModal(false)}
                className="w-full py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-98 cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleExecuteJoin}
                className={`w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                  isPublicVenue
                    ? 'bg-[#2B527A] hover:bg-[#1F3C5C] shadow-sky-900/25'
                    : 'bg-[#4A7C59] hover:bg-[#3B6347] shadow-[#4A7C59]/25'
                }`}
              >
                <span>{isPublicVenue ? 'บันทึกลงตาราง' : 'ยืนยันและรับตั๋ว'}</span>
                <ArrowRight className="w-4 h-4" />
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

      {/* Safety Report Modal */}
      {reportModalTarget && (
        <ReportSafetyModal
          isOpen={!!reportModalTarget}
          onClose={() => setReportModalTarget(null)}
          targetTitle={reportModalTarget.title}
          targetHostName={reportModalTarget.hostName}
        />
      )}

      {/* Quick Profile Modal */}
      {selectedProfileQuery && (
        <ProfileModal
          isOpen={!!selectedProfileQuery}
          onClose={() => setSelectedProfileQuery(null)}
          targetProfileIdOrName={selectedProfileQuery}
        />
      )}

      {/* 🖼️ Photo Gallery Lightbox Modal */}
      {selectedGalleryImg && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-fade-in cursor-pointer"
          onClick={() => setSelectedGalleryImg(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full rounded-3xl overflow-hidden shadow-2xl bg-black/90 flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGalleryImg(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs cursor-pointer z-10 transition-all border border-white/20"
              title="ปิดรูปภาพ"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedGalleryImg}
              alt="ภาพบรรยากาศขนาดใหญ่"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl mx-auto shadow-lg"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetailModal;