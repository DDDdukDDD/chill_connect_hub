'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  MapPin,
  Clock,
  Heart,
  Star,
  Share2,
  Check,
  CheckCircle2,
  Sparkles,
  Compass,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Users,
  Plus,
  Zap,
  Camera,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flag,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { LifestyleSpotItem, SpotSubActivity, SpotRelatedQuest } from '@/data/spotsData';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { ChallengeQuest } from '@/data/mockData';

interface SpotDetailModalProps {
  spot: LifestyleSpotItem | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  onAcceptQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onCancelQuest?: (questTitle: string) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
];

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  isLoggedIn = false,
  onRequireLogin,
  onAcceptQuest,
  joinedQuestTitles = [],
  onCancelQuest,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  
  // Collapsible state for Buddy Board & Quests
  const [isBuddySectionOpen, setIsBuddySectionOpen] = useState(false);
  const [isQuestsSectionOpen, setIsQuestsSectionOpen] = useState(true);
  const [selectedQuestModal, setSelectedQuestModal] = useState<ChallengeQuest | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [joinedSubIds, setJoinedSubIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasAcceptedSafetyPledge, setHasAcceptedSafetyPledge] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  // Form State for creating a new Buddy Meetup
  const [subTitleInput, setSubTitleInput] = useState('');
  const [subTimeInput, setSubTimeInput] = useState('14:00 น.');
  const [subMeetupPointInput, setSubMeetupPointInput] = useState('');
  const [subMaxMembers, setSubMaxMembers] = useState(4);
  const [subNoteInput, setSubNoteInput] = useState('');

  // Local state for sub activities
  const [localSubActivities, setLocalSubActivities] = useState<SpotSubActivity[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsBuddySectionOpen(false); // ข้อ 5: default collapse
    setShowSubForm(false);
    setExpandedSubId(null);
    if (spot) {
      const defaultSubs: SpotSubActivity[] = spot.subActivities || [
        {
          id: `${spot.id}-sub-1`,
          title: `ชวนเดินเล่น & ถ่ายรูปมุมสวยที่ ${spot.title}`,
          creatorName: 'คุณมายด์',
          creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          date: 'เสาร์นี้',
          time: '15:30 น.',
          membersCount: '2/4 คน',
          meetupPoint: 'บริเวณทางเข้าหลัก / จุดนัดพบด้านหน้า',
          note: 'มาเดินชิลล์ๆ แลกเปลี่ยนมุมถ่ายรูปกันครับ ไม่เกร็ง มีแวะพักจิบเครื่องดื่มระหว่างทาง',
        },
        {
          id: `${spot.id}-sub-2`,
          title: 'หาเพื่อนแวะจิบกาแฟ Slow Bar & นั่งคุยสบายๆ',
          creatorName: 'คุณป๊อป',
          creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
          date: 'อาทิตย์นี้',
          time: '14:00 น.',
          membersCount: '3/5 คน',
          meetupPoint: 'หน้าร้านกาแฟ Slow Bar',
          note: 'นั่งคุยสบายๆ ใครชอบ Slow Bar หรือกาแฟดริปมาแลกเปลี่ยนเมล็ดกาแฟกันได้ครับ',
        },
      ];
      setLocalSubActivities(defaultSubs);
    }
  }, [spot]);

  if (!isOpen || !spot || !mounted) return null;

  const images = spot.galleryImages && spot.galleryImages.length > 0 ? spot.galleryImages : [spot.image];
  const avatars = spot.interestedAvatars || DEFAULT_AVATARS;

  // ข้อ 4 & 5: 2-3 Related Quests per spot with enhanced typography
  const relatedQuestsList: SpotRelatedQuest[] = spot.relatedQuests || [
    {
      id: `quest-${spot.id}-1`,
      title: `🏅 สำรวจพิกัดฮีลใจ: ${spot.title}`,
      xp: 350,
      badge: 'Explorer',
      icon: '🌿',
    },
    {
      id: `quest-${spot.id}-2`,
      title: `📸 ถ่ายภาพบรรยากาศ & บันทึกโมเมนต์`,
      xp: 200,
      badge: 'Photographer',
      icon: '📸',
    },
    {
      id: `quest-${spot.id}-3`,
      title: `☕ จิบเครื่องดื่ม & ซัพพอร์ตชุมชนท้องถิ่น`,
      xp: 150,
      badge: 'Local Supporter',
      icon: '☕',
    },
  ];

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${spot.title} - ${spot.province} (${spot.googleMapsUrl})`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleJoinSub = (subId: string, subTitle: string) => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
      return;
    }
    if (joinedSubIds.includes(subId)) {
      setJoinedSubIds((prev) => prev.filter((id) => id !== subId));
      showToast(`ยกเลิกการเข้าร่วมตี้ "${subTitle}" แล้ว`);
    } else {
      setJoinedSubIds((prev) => [...prev, subId]);
      showToast(`🎉 เข้าร่วมตี้ "${subTitle}" สำเร็จแล้ว!`);
    }
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
      return;
    }
    if (!subTitleInput.trim()) return;

    if (!hasAcceptedSafetyPledge) {
      setSafetyError('กรุณากดยินยอมข้อกำหนดความปลอดภัยก่อนสร้างกลุ่ม');
      return;
    }

    const newSub: SpotSubActivity = {
      id: `spot-sub-${Date.now()}`,
      title: subTitleInput.trim(),
      creatorName: 'คุณ (ผู้สร้าง)',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      isCreator: true,
      date: 'เสาร์นี้',
      time: subTimeInput,
      membersCount: `1/${subMaxMembers} คน`,
      meetupPoint: subMeetupPointInput.trim() || 'บริเวณจุดนัดพบด้านหน้า',
      note: subNoteInput.trim() || 'มาเที่ยวชิลล์ๆ ด้วยกันครับ ยินดีต้อนรับทุกคน',
    };

    setLocalSubActivities((prev) => [newSub, ...prev]);
    setJoinedSubIds((prev) => [...prev, newSub.id]);
    setShowSubForm(false);
    setSubTitleInput('');
    setSubMeetupPointInput('');
    setSubNoteInput('');
    setHasAcceptedSafetyPledge(false);
    setSafetyError(null);
    showToast(`🎉 สร้างตี้ "${newSub.title}" สำเร็จแล้ว!`);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-[99999] animate-fade-in font-sans">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-[#E8E2D8] text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification inside modal */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-slide-down">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Top Header Image & Controls (Compact Cinematic Banner h-36 sm:h-40) */}
        <div className="relative h-36 sm:h-38 md:h-40 w-full bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={images[activeImageIndex] || spot.image}
            alt={spot.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

          {/* Top-Right: Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-xs z-10"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Bottom-Right: Favorite Button on Image (Standard Position matching EventDetailModal) */}
          <button
            onClick={() => {
              if (!isLoggedIn && onRequireLogin) {
                onRequireLogin();
                return;
              }
              onToggleFavorite(spot.id);
            }}
            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-xs z-10"
            title={isFavorite ? 'ลบออกจากที่บันทึกไว้' : 'บันทึกสถานที่'}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFavorite ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
              }`}
            />
          </button>

          {/* Bottom-Left Image Badges: Province & Rating */}
          <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 flex items-center gap-2 text-white z-10">
            <span className="text-[11px] font-extrabold flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20">
              <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
              <span>{spot.province} • {spot.district}</span>
            </span>

            <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-2xs">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>{spot.rating} ({spot.reviewsCount} รีวิว)</span>
            </span>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto text-slate-800">
          
          {/* Main Title & Action Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  📍 {spot.categoryLabel}
                </span>

                <span className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-300">
                  {spot.price.includes('ฟรี') ? '🎉 เข้าฟรี!' : `🏷️ ${spot.price}`}
                </span>
              </div>

              {/* ข้อ 2: ปุ่ม "แชร์สถานที่" (1 Icon Clean) */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                title="แชร์สถานที่นี้ให้เพื่อน"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3 text-slate-500" />
                    <span>แชร์สถานที่</span>
                  </>
                )}
              </button>
            </div>

            {/* Title with sleek typography */}
            <h2 className="text-base sm:text-lg font-black text-[#1E293B] mt-1 leading-snug tracking-tight">
              {spot.title}
            </h2>

            {/* Attendees Bar พร้อม Link ไปยังหน้า Moments ของสถานที่นี้ */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {avatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Attendee"
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    />
                  ))}
                </div>
                <span className="text-slate-700 font-medium text-[11px] sm:text-xs">
                  <strong className="text-slate-900 font-extrabold">{spot.interestedCount || 48} คน</strong> วางแผนจะไป
                </span>
              </div>

              {/* Link ไปยังหน้า Moments พร้อม Filter สถานที่นี้ */}
              <Link
                href={`/moments?location=${encodeURIComponent(spot.title)}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#4A7C59] hover:text-[#3B6447] bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-xl border border-[#4A7C59]/30 transition-all shrink-0 shadow-2xs"
              >
                <Camera className="w-3 h-3 text-[#4A7C59]" />
                <span>ดูโมเมนต์จากเพื่อนๆ ➔</span>
              </Link>
            </div>
          </div>

          {/* Location & Open Hours Box (ถอดแบบจาก EventDetailModal ตามภาพต้นแบบ) */}
          <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            {/* Top Row: Hours */}
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-slate-400 text-[10px] block font-bold">เวลาเปิด-ปิด:</span>
                <span className="font-semibold text-[#1E293B] block">{spot.openHours}</span>
              </div>
            </div>

            <div className="h-px bg-slate-200/60" />

            {/* Bottom Row: District & Exact Pill Button for Google Maps */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 text-[10px] block font-bold">ย่าน / อำเภอ:</span>
                  <span className="font-bold text-[#1E293B] text-xs leading-relaxed break-words">{spot.district}, {spot.province}</span>
                </div>
              </div>

              {/* Exact Google Maps Button from Screenshot */}
              <a
                href={spot.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-[#1E293B] hover:text-[#F26430] border border-slate-200 hover:border-orange-300 text-xs font-bold shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer self-start sm:self-auto"
                title="เปิดดูตำแหน่งและเส้นทางบน Google Maps"
              >
                <span>เปิด Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Description (ปรับขนาด Font ให้เล็กลงดูสบายตาและสวยงาม) */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>เกี่ยวกับสถานที่นี้</span>
            </h3>
            <p className="text-[12px] sm:text-[13px] text-slate-600 leading-relaxed font-medium">
              {spot.description}
            </p>
          </div>

          {/* Highlights List */}
          {spot.highlights && spot.highlights.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-black text-slate-900">✨ จุดเด่นที่ไม่ควรพลาด</h3>
              <div className="space-y-1">
                {spot.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-[#4A7C59] shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facilities & Transit Guide */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900">🚗 สิ่งอำนวยความสะดวก & การเดินทาง</h3>
            {spot.transitInfo && (
              <p className="text-xs text-slate-700 font-semibold bg-slate-100 p-2.5 rounded-xl">
                {spot.transitInfo}
              </p>
            )}
            {spot.facilities && spot.facilities.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {spot.facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ชาเลนจ์ & เควสต์ที่เกี่ยวข้อง (Clean Secondary Banner เชื่อมต่อไปยังหน้า Challenges) */}
          {/* ========================================================================= */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/80 to-amber-50/80 border border-amber-200/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  มีเควสต์สะสม XP ประจำสถานที่นี้ 🎯
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  เช็คอินหรือบันทึกภาพโมเมนต์เพื่อรับแต้ม XP และเหรียญตรา
                </span>
              </div>
            </div>

            <Link
              href="/challenges"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-300/80 transition-all shrink-0 shadow-2xs active:scale-95 cursor-pointer"
            >
              <span>ดูเควสต์</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* ข้อ 5: ตี้ชวนเพื่อนเที่ยวที่นี่ (ดีไซน์ถอดแบบจาก EventDetailModal 100% ตามภาพแนบ) */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-amber-200/90 bg-[#FFFDF7] overflow-hidden transition-all shadow-2xs">
            {/* Collapsible Header */}
            <div
              onClick={() => setIsBuddySectionOpen(!isBuddySectionOpen)}
              className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors select-none"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#F26430] shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1E293B]">
                      ชวนเพื่อนทำกิจกรรม / เที่ยวที่นี่ ({localSubActivities.length})
                    </h3>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {isBuddySectionOpen ? 'แตะเพื่อย่อ' : 'แตะเพื่อเปิดดู'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#64748B] truncate mt-0.5">
                    หาเพื่อนร่วมเดินเที่ยว หรือสร้างนัดหมายกลุ่มย่อยของคุณ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLoggedIn && onRequireLogin) {
                      onRequireLogin();
                      return;
                    }
                    setIsBuddySectionOpen(true);
                    setShowSubForm(!showSubForm);
                  }}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1 ${
                    showSubForm
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-[#4A7C59] hover:bg-[#3d6849] text-white shadow-[#4A7C59]/20'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showSubForm ? 'ปิดฟอร์ม' : 'ชวนเพื่อน'}</span>
                </button>

                <div className="p-1 text-slate-400 hover:text-slate-600">
                  {isBuddySectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Collapsible Body */}
            {isBuddySectionOpen && (
              <div className="p-3.5 sm:p-4 pt-0 space-y-3 border-t border-amber-200/60 mt-0 animate-fade-in">
                {/* Create Buddy Form */}
                {showSubForm && (
                  <form
                    onSubmit={handleCreateSub}
                    className="p-3.5 sm:p-4 bg-white rounded-2xl border border-amber-300/80 shadow-md space-y-3 animate-scale-up text-left text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-extrabold text-[#1E293B] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                        <span>ตั้งกลุ่มชวนเพื่อนเที่ยวสถานที่นี้</span>
                      </h4>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        นัดกลุ่มย่อย
                      </span>
                    </div>

                    {/* Safety Notice */}
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong>มาตรการความปลอดภัย:</strong> จุดนัดพบต้องอยู่ในพื้นที่เปิดของสถานที่ที่มีผู้คนสัญจร (เช่น หน้าทางเข้า, ร้านกาแฟ) ไม่อนุญาตให้นัดพบในสถานที่ลับตาคน
                      </span>
                    </div>

                    {safetyError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl text-xs flex items-center gap-1.5 font-bold animate-shake">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{safetyError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">หัวข้อกิจกรรม / ชวนทำอะไร: *</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ชวนเดินถ่ายรูปมุมสะพาน / จิบกาแฟดริป"
                        value={subTitleInput}
                        onChange={(e) => {
                          setSubTitleInput(e.target.value);
                          if (safetyError) setSafetyError(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#1E293B]">เวลานัดพบ:</label>
                        <input
                          type="text"
                          value={subTimeInput}
                          onChange={(e) => setSubTimeInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#1E293B]">จำนวนรับสูงสุด:</label>
                        <select
                          value={subMaxMembers}
                          onChange={(e) => setSubMaxMembers(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                        >
                          <option value={2}>👥 2 คน (เดินคู่สบายๆ)</option>
                          <option value={3}>👥 3 คน</option>
                          <option value={4}>👥 4 คน (แนะนำ)</option>
                          <option value={5}>👥 5 คน</option>
                          <option value={8}>👥 8 คน (กลุ่มใหญ่)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">จุดนัดพบในสถานที่ (พื้นที่เปิด):</label>
                      <input
                        type="text"
                        placeholder="เช่น หน้าร้านกาแฟ / ประตูทางเข้า 1"
                        value={subMeetupPointInput}
                        onChange={(e) => setSubMeetupPointInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#1E293B]">รายละเอียดเพิ่มเติม (สไตล์การเที่ยว):</label>
                      <textarea
                        rows={2}
                        placeholder="เช่น เน้นเดินชิลล์ๆ ถ่ายรูป ไม่รีบเร่ง ยินดีต้อนรับสายชิลล์ทุกคน"
                        value={subNoteInput}
                        onChange={(e) => setSubNoteInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                      />
                    </div>

                    {/* Safety Pledge Checkbox */}
                    <label className="flex items-start gap-2 text-[11px] text-[#1E293B] cursor-pointer pt-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
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
                      <span className="leading-tight text-slate-700">
                        ข้าพเจ้ายืนยันว่าจะไม่ใช้กลุ่มนี้ในการชักชวนลงทุน/ขายตรง/การพนัน หรือแสวงหาประโยชน์ส่วนตัวอันไม่เหมาะสม และจะนัดพบในพื้นที่เปิดเท่านั้น 🛡️
                      </span>
                    </label>

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
                        ยืนยันสร้างกลุ่มชวนเพื่อน
                      </button>
                    </div>
                  </form>
                )}

                {/* List of SubActivities (Exact match with EventDetailModal & screenshot) */}
                <div className="space-y-2 pt-0.5">
                  {localSubActivities.map((sub) => {
                    const isSubJoined = joinedSubIds.includes(sub.id);
                    const isExpanded = expandedSubId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className={`bg-white rounded-xl overflow-hidden shadow-2xs transition-all border ${
                          isSubJoined
                            ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                            : 'border-amber-200/80 hover:border-amber-300'
                        }`}
                      >
                        {/* Sub-activity Header Bar */}
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
                                  showToast(`ได้รับรายงานกลุ่ม "${sub.title}" แล้ว ทีมงานจะตรวจสอบความปลอดภัยครับ`);
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

                          {/* Row 2: Host, Date, Time & Members */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <span>จัดโดย <strong className="text-[#1E293B]">{sub.creatorName}</strong></span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>ยืนยันตัวตน</span>
                              </span>
                            </span>
                            <span>•</span>
                            <span className="text-[#4A7C59] font-medium">📅 {sub.date}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">⏰ {sub.time}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">({sub.membersCount})</span>
                          </div>

                          {/* Row 3: Criteria Badges (Left) & Action Button (Right) */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100/60 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                👥 ทุกเพศ
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                🎂 ไม่จำกัดอายุ
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {isSubJoined ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 select-none">
                                    เข้าร่วมแล้ว
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleJoinSub(sub.id, sub.title);
                                    }}
                                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleJoinSub(sub.id, sub.title);
                                  }}
                                  className="bg-[#4A7C59] hover:bg-[#3B6447] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  เข้าร่วม
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="p-3 bg-amber-50/30 border-t border-amber-100 text-xs text-[#64748B] space-y-1.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 font-bold">
                              <span>📍 จุดนัดพบ:</span>
                              <span className="text-[#1E293B]">{sub.meetupPoint}</span>
                            </div>
                            {sub.note && (
                              <p className="text-[11px] leading-relaxed italic bg-white p-2 rounded-lg border border-amber-100">
                                &ldquo;{sub.note}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Footer: ปุ่มบันทึกสถานที่ */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn && onRequireLogin) {
                onRequireLogin();
                return;
              }
              onToggleFavorite(spot.id);
            }}
            className={`py-2 px-5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
              isFavorite
                ? 'bg-[#4A7C59] hover:bg-[#3B6447] border-[#4A7C59] text-white shadow-[#4A7C59]/20'
                : 'bg-[#F26430] hover:bg-[#D95322] border-[#F26430] text-white shadow-[#F26430]/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : 'fill-white/20 text-white'}`} />
            <span>{isFavorite ? 'บันทึกสถานที่แล้ว' : 'บันทึกสถานที่'}</span>
          </button>
        </div>
      </div>

      {/* Challenge Quest Full Detail Popup Modal */}
      {selectedQuestModal && (
        <JoinChallengeModal
          isOpen={!!selectedQuestModal}
          onClose={() => setSelectedQuestModal(null)}
          quest={selectedQuestModal}
          onConfirmJoin={(q) => {
            if (!isLoggedIn && onRequireLogin) {
              onRequireLogin();
              return;
            }
            if (onAcceptQuest) {
              onAcceptQuest(q.title);
            } else {
              showToast(`🎉 รับภารกิจ "${q.title}" เรียบร้อยแล้ว! (+${q.rewardPoints} XP)`);
            }
            setSelectedQuestModal(null);
          }}
        />
      )}
    </div>,
    document.body
  );
};
