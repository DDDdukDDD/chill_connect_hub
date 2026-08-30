'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ETicketModal } from '@/components/ETicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { TipHostModal } from '@/components/TipHostModal';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { useAuth } from '@/lib/useAuth';
import {
  getEventById,
  getRelatedEvents,
  EventItem,
  MOCK_EVENTS
} from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import { resolveEventGallery } from '@/lib/eventImageResolver';
import { renderDescriptionContent } from '@/components/RichTextEditor';
import {
  MapPin,
  Clock,
  Calendar,
  Heart,
  Star,
  Share2,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Users,
  ShieldCheck,
  Navigation,
  QrCode,
  MessageCircle,
  Coffee,
  Flag,
  User,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  CheckCircle2
} from 'lucide-react';

// Helper to strip rogue emojis for clean typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  heal: { bg: 'bg-[#FFF4EE]', text: 'text-[#F26430]', border: 'border-[#FCD9C6]', label: 'ฮีลใจ & สมาธิ' },
  move: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'ขยับกาย & กีฬา' },
  chill: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'จิบกาแฟ & ชิลล์' },
  learn: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'ศิลปะ & เรียนรู้' },
};

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('events');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites & Joined Events State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Secondary Modals State
  const [isETicketOpen, setIsETicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfirmJoinModalOpen, setIsConfirmJoinModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Dynamic Event State
  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Retrieve event from both local mock and live API database
  useEffect(() => {
    if (!decodedId) {
      setIsLoading(false);
      return;
    }

    const localFound = getEventById(decodedId) || MOCK_EVENTS.find((e) => e.id === decodedId || e.title === decodedId);
    if (localFound) {
      setEventData(localFound);
      setIsLoading(false);
    }

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.events && Array.isArray(data.events)) {
          const apiFound = data.events.find(
            (e: EventItem) =>
              e.id === decodedId ||
              encodeURIComponent(e.id) === decodedId ||
              e.title === decodedId ||
              (e.title && decodedId.includes(e.title))
          );
          if (apiFound) {
            setEventData(apiFound);
          }
        }
      })
      .catch((err) => console.error('Error fetching community event:', err))
      .finally(() => setIsLoading(false));
  }, [decodedId]);

  // Gallery Photos
  const galleryImages: string[] = useMemo(() => {
    if (!eventData) return [];
    return resolveEventGallery(eventData);
  }, [eventData]);

  // Load user status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('favorite_events');
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch {}
      }

      const savedJoined = localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        try {
          setJoinedEventIds(JSON.parse(savedJoined));
        } catch {}
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      let updated: string[];
      if (isFav) {
        updated = prev.filter((id) => id !== eventId);
        showToast('ลบออกจากรายการโปรดแล้ว');
      } else {
        updated = [...prev, eventId];
        showToast('บันทึกกิจกรรมคอมมูนิตี้ในรายการโปรดเรียบร้อย! ❤️');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleJoinEvent = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!eventData) return;

    if (joinedEventIds.includes(eventData.id)) {
      setIsETicketOpen(true);
      return;
    }

    setIsConfirmJoinModalOpen(true);
  };

  const handleExecuteJoin = () => {
    if (!eventData) return;

    const updatedParticipants = Math.min(eventData.participantsCount + 1, eventData.maxParticipants);
    setEventData({ ...eventData, participantsCount: updatedParticipants });
    
    const newJoined = [...joinedEventIds, eventData.id];
    setJoinedEventIds(newJoined);
    if (typeof window !== 'undefined') {
      localStorage.setItem('joined_event_ids', JSON.stringify(newJoined));
    }

    setIsConfirmJoinModalOpen(false);
    showToast(`ยินดีด้วย! คุณลงทะเบียนเข้าร่วม "${eventData.title}" สำเร็จแล้ว 🎉`);
    setIsETicketOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!eventData) return;
    const updatedParticipants = Math.max(eventData.participantsCount - 1, 0);
    setEventData({ ...eventData, participantsCount: updatedParticipants });

    const newJoined = joinedEventIds.filter((id) => id !== eventData.id);
    setJoinedEventIds(newJoined);
    if (typeof window !== 'undefined') {
      localStorage.setItem('joined_event_ids', JSON.stringify(newJoined));
    }

    setIsCancelModalOpen(false);
    showToast(`ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อย`);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !eventData) return;
    const url = window.location.href;
    const shareData = {
      title: `${eventData.title} | Chill & Connect Hub`,
      text: `ชวนไปตี้กิจกรรมนี้: ${eventData.title} (${eventData.date} @ ${eventData.location})`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('แชร์กิจกรรมเรียบร้อย! 🎉');
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์กิจกรรมแล้ว ส่งชวนเพื่อนใน LINE ได้เลย! 📋✨');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('คัดลอกลิงก์เรียบร้อย');
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length);
      }
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  // Verified community highlights
  const communityHighlights = useMemo(() => {
    return [
      'กิจกรรมกลุ่มขนาดกะทัดรัด (Small Group) เน้นความเป็นมิตรและเปิดรับทุกคนอย่างอบอุ่น',
      'ดำเนินกิจกรรมโดย Verified Host ที่มีประสบการณ์ พร้อมดูแลให้ทุกคนรู้สึกผ่อนคลาย',
      'บรรยากาศ Safe Space 100% ปราศจากความกดดัน เป็นตัวของตัวเองได้อย่างสบายใจ',
      'ได้ทั้งเปิดรับความรู้ ทักษะใหม่ๆ และได้รู้จักเพื่อนใหม่ที่มีไลฟ์สไตล์ตรงกัน',
      'มีตั๋ว E-Ticket ในระบบและห้องแชตกลุ่มสำหรับเตรียมนัดพบก่อนเริ่มกิจกรรม'
    ];
  }, []);

  // Transit details
  const { publicTransitText, parkingText } = useMemo(() => {
    if (!eventData) return { publicTransitText: '', parkingText: '' };
    const loc = eventData.location || '';
    if (loc.includes('สวน') || loc.includes('เบญจกิติ') || loc.includes('ลุมพินี')) {
      return {
        publicTransitText: 'รถไฟฟ้า MRT สถานีสุขุมวิท / คลองเตย หรือ BTS สถานีอโศก เดินต่อเข้าสู่ทางเข้าสวน',
        parkingText: 'มีลานจอดรถของสวนสาธารณะ (แนะนำเดินทางด้วยรถไฟฟ้าสะดวกที่สุด)'
      };
    }
    return {
      publicTransitText: 'สามารถเดินทางด้วยรถไฟฟ้า BTS, MRT หรือรถประจำทางที่ผ่านบริเวณจุดนัดพบ',
      parkingText: 'มีพื้นที่จอดรถสำหรับผู้เข้าร่วมกิจกรรม หรือจุดจอดรถบริเวณใกล้เคียง'
    };
  }, [eventData]);

  // Buddy Gathering / Carpool for solo attendees
  const communityBuddyTrips = useMemo(() => {
    if (!eventData) return [];
    return [
      {
        id: 'buddy-comm-1',
        title: `นัดรวมตัวล่วงหน้า 15 นาที นั่งคุยทำความรู้จักกันก่อนเริ่ม`,
        hostName: eventData.hostName || 'โฮสต์ผู้จัด',
        hostAvatar: eventData.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        date: eventData.date,
        time: 'ก่อนเริ่มงาน 15 นาที',
        participantsCount: Math.min(eventData.participantsCount, 4),
        maxParticipants: eventData.maxParticipants,
        description: 'ยินดีต้อนรับทุกคนครับ มาถึงก่อนเวลามานั่งคุยจิบน้ำผ่อนคลายด้วยกันก่อนได้เลย',
        tag: 'นัดพบล่วงหน้า'
      }
    ];
  }, [eventData]);

  // Related Community Activities
  const relatedActivities = useMemo(() => {
    if (!eventData) return [];
    return getRelatedEvents(eventData, 4);
  }, [eventData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
        <Navbar
          activeTab={activeNavTab}
          setActiveTab={setActiveNavTab}
          isLoggedIn={isLoggedIn}
          isAuthReady={isAuthReady}
          setIsLoggedIn={handleSetIsLoggedIn}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
          onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-6 w-48 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-56 sm:h-72 md:h-[320px] bg-slate-100 animate-pulse rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
        <Navbar
          activeTab={activeNavTab}
          setActiveTab={setActiveNavTab}
          isLoggedIn={isLoggedIn}
          isAuthReady={isAuthReady}
          setIsLoggedIn={handleSetIsLoggedIn}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
          onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-[#4A7C59] rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🌿
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลกิจกรรมคอมมูนิตี้นี้</h1>
          <p className="text-sm text-slate-600">กิจกรรมนี้อาจสิ้นสุดลงแล้วหรือถูกยกเลิก</p>
          <Link
            href="/?tab=community"
            className="inline-flex items-center gap-2 bg-[#4A7C59] hover:bg-[#3B6447] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ากิจกรรมคอมมูนิตี้</span>
          </Link>
        </main>
      </div>
    );
  }

  const isFav = favorites.includes(eventData.id);
  const isJoined = joinedEventIds.includes(eventData.id);
  const isEnded = isEventEnded(eventData);
  const fillRatio = eventData.participantsCount / eventData.maxParticipants;
  const isAlmostFull = fillRatio >= 0.8;
  const catStyle = CATEGORY_STYLES[eventData.category] || CATEGORY_STYLES.heal;
  const profileHref = `/profile?id=${encodeURIComponent(eventData.hostId || 'host-mind')}&name=${encodeURIComponent(eventData.hostName)}`;

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#4A7C59] selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-1.5 pb-5 sm:pt-2 sm:pb-6 space-y-3 sm:space-y-4">
        
        {/* =========================================================================
            TOP BREADCRUMBS & ACTION BAR
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1.5 border-b border-slate-100">
          
          {/* Left: Clean Breadcrumbs */}
          <nav className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#4A7C59] transition-colors font-semibold py-2 px-1">หน้าแรก</Link>
            <span className="py-2">/</span>
            <Link
              href="/?tab=community"
              className="hover:text-[#4A7C59] transition-colors py-2 px-1 font-semibold text-emerald-800"
            >
              กิจกรรมคอมมูนิตี้
            </Link>
            <span className="py-2">/</span>
            <span className="text-slate-700 font-semibold py-2 px-1">{cleanText(catStyle.label)}</span>
            <span className="py-2">/</span>
            <span className="text-slate-900 font-bold truncate py-2 px-1">{cleanText(eventData.title)}</span>
          </nav>

          {/* Right: Favorite & Share Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavorite(eventData.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                isFav
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              <span>{isFav ? 'บันทึกแล้ว' : 'บันทึก'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#4A7C59] text-xs font-bold transition-all shadow-2xs border border-slate-200 hover:border-emerald-200 cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>แชร์กิจกรรม</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* =========================================================================
            EDITORIAL 5-PHOTO MOSAIC GALLERY (Community Vibe)
           ========================================================================= */}
        <section className="space-y-2">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 rounded-3xl overflow-hidden bg-slate-100 h-56 sm:h-72 md:h-[320px] max-h-[320px] relative group">
            
            {/* Main Big Photo (Left - 2 Cols x 2 Rows) */}
            <div
              onClick={() => {
                setActivePhotoIndex(0);
                setIsLightboxOpen(true);
              }}
              className="md:col-span-2 md:row-span-2 relative h-56 sm:h-72 md:h-[320px] overflow-hidden cursor-pointer bg-slate-200"
            >
              <img
                src={galleryImages[0] || eventData.image}
                alt={`${eventData.title} ภาพบรรยากาศกิจกรรม`}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 hover:opacity-20 transition-opacity" />
            </div>

            {/* 4 Secondary Thumbnail Photos (Right 2x2 Grid) */}
            {galleryImages.slice(1, 5).map((imgUrl, idx) => {
              const photoIdx = idx + 1;
              const isLast = idx === 3;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActivePhotoIndex(photoIdx);
                    setIsLightboxOpen(true);
                  }}
                  className="hidden md:block relative h-[155px] overflow-hidden cursor-pointer bg-slate-200"
                >
                  <img
                    src={imgUrl}
                    alt={`${eventData.title} บรรยากาศ ${photoIdx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />

                  {isLast && (
                    <div className="absolute inset-0 bg-slate-900/60 hover:bg-slate-900/50 backdrop-blur-2xs flex flex-col items-center justify-center text-white transition-all">
                      <Camera className="w-6 h-6 mb-1 text-white" />
                      <span className="font-extrabold text-xs sm:text-sm">ดูรูปทั้งหมด</span>
                      <span className="text-[11px] text-slate-200 font-medium">({galleryImages.length} รูป)</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile View All Button */}
            <button
              type="button"
              onClick={() => {
                setActivePhotoIndex(0);
                setIsLightboxOpen(true);
              }}
              className="md:hidden absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ดูรูปทั้งหมด ({galleryImages.length})</span>
            </button>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>💡 แตะที่รูปเพื่อเปิดดูภาพบรรยากาศขนาดใหญ่ (Fullscreen Lightbox)</span>
            <span className="hidden sm:inline">คลังภาพบรรยากาศ {galleryImages.length} มุมมอง</span>
          </div>

        </section>

        {/* =========================================================================
            CORE CONTENT: 2-COLUMN EDITORIAL LAYOUT
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start pt-3">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols) */}
          <div className="lg:col-span-2 space-y-7">
            
            {/* 1. Header Title, Badges & Ratings */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  {catStyle.label}
                </span>

                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  !eventData.price || eventData.price.includes('ฟรี')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {!eventData.price || cleanText(eventData.price).includes('ฟรี') ? 'เข้าร่วมฟรี' : cleanText(eventData.price)}
                </span>

                {isEnded ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    🏁 สิ้นสุดกิจกรรมแล้ว
                  </span>
                ) : isAlmostFull ? (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>ที่นั่งใกล้เต็ม (เหลือ {Math.max(eventData.maxParticipants - eventData.participantsCount, 0)} ที่)</span>
                  </span>
                ) : (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>เปิดรับสมัคร</span>
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs ml-auto sm:ml-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{eventData.hostRating || 4.9}</span>
                  <span className="text-slate-400 font-normal">({eventData.hostReviewsCount || 58} รีวิว)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {cleanText(eventData.title)}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#4A7C59] shrink-0" />
                <span>{cleanText(eventData.location)}</span>
              </p>
            </div>

            {/* 2. Inline Metadata Ribbon */}
            <div className="py-3.5 px-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">วันที่จัดกิจกรรม:</span>
                <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">เวลา:</span>
                <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">จำนวนผู้ร่วมตี้:</span>
                <span className="font-bold text-slate-900">{eventData.participantsCount} / {eventData.maxParticipants} คน</span>
              </div>
            </div>

            {/* 3. Verified Host Card (Community Core) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
              <Link
                href={profileHref}
                className="flex items-center gap-3.5 min-w-0 group cursor-pointer"
                title={`คลิกเพื่อดูโปรไฟล์และรีวิวของ ${eventData.hostName}`}
              >
                <div className="relative shrink-0">
                  <img
                    src={eventData.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={eventData.hostName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#4A7C59] transition-colors truncate">
                      {eventData.hostName}
                    </h3>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified Host 🛡️
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    จัดกิจกรรมมาแล้ว {eventData.hostHostedCount || 12} ครั้ง • เรตติ้ง ⭐ {eventData.hostRating || 4.9} ({eventData.hostReviewsCount || 58} รีวิว)
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Link
                  href={profileHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>ดูโปรไฟล์</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsTipModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tip Host</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="รายงานกิจกรรมไม่เหมาะสม"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. Safe Space Community Pledge */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-emerald-950 leading-relaxed">
                <strong className="block font-bold">100% Safe Space & Welcoming Atmosphere</strong>
                <span>กิจกรรมในคอมมูนิตี้นี้เน้นความเป็นมิตร อบอุ่น สบายใจ ไร้ความกดดัน ใครมาคนเดียวไม่ต้องเกร็ง มี Host ดูแลต้อนรับเป็นกันเองทุกคน</span>
              </div>
            </div>

            {/* 5. About Story */}
            <div className="space-y-3 pt-1">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4A7C59]" />
                <span>รายละเอียดกิจกรรม & วัตถุประสงค์</span>
              </h2>
              {renderDescriptionContent(eventData.description)}
            </div>

            {/* 6. Highlights */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                จุดเด่นของกิจกรรมนี้
              </h2>
              <ul className="space-y-3 pt-1">
                {communityHighlights.map((h, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0 mt-2" />
                    <span className="flex-1">{cleanText(h)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 7. Checklist */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                สิ่งที่ควรเตรียมมา & กฎการอยู่ร่วมกัน
              </h2>

              <ul className="space-y-3 pt-1">
                {[
                  'แต่งกายสุภาพและสวมใส่ชุดที่เคลื่อนไหวสะดวก',
                  'พกสมาร์ตโฟนที่มีแบตเตอรี่พร้อมเปิดตั๋ว E-Ticket และเข้าห้องแชต',
                  'เปิดใจรับฟังและรักษามารยาทต่อเพื่อนร่วมกิจกรรมทุกคน',
                  'หากไม่สะดวกมาร่วมตี้ กรุณากดยกเลิกล่วงหน้า 24 ชม. เพื่อเปิดสิทธิ์ให้ผู้อื่น'
                ].map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0 mt-2" />
                    <span className="flex-1">{cleanText(rule)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 8. Transit & Map */}
            <div className="space-y-4 pt-5 border-t border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                จุดนัดพบ & การเดินทาง
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    รถสาธารณะ & รถไฟฟ้า
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(publicTransitText)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    รถยนต์ส่วนตัว & ที่จอดรถ
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(parkingText)}
                  </p>
                </div>
              </div>

              <div className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                <iframe
                  title={`Google Map - ${cleanText(eventData.title)}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(eventData.location)}&hl=th&z=15&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY REGISTRATION & E-TICKET SIDEBAR (1 Col) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              
              {/* Header Price */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">ค่าลงทะเบียน</span>
                <span className="text-lg font-black text-slate-900">
                  {eventData.price && !eventData.price.includes('ฟรี') ? eventData.price : '🎉 เข้าร่วมฟรี'}
                </span>
              </div>

              {/* Progress & Remaining Seats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>ผู้ลงทะเบียน</span>
                  </span>
                  <span className="text-slate-900 font-extrabold">
                    {eventData.participantsCount} / {eventData.maxParticipants} คน
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fillRatio >= 1
                        ? 'bg-rose-500'
                        : isAlmostFull
                        ? 'bg-amber-500'
                        : 'bg-[#4A7C59]'
                    }`}
                    style={{ width: `${Math.min(fillRatio * 100, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>เหลืออีก {Math.max(eventData.maxParticipants - eventData.participantsCount, 0)} ที่นั่ง</span>
                  {isAlmostFull && !isEnded && (
                    <span className="text-rose-600 font-bold">ใกล้เต็มแล้ว!</span>
                  )}
                </div>
              </div>

              {/* Date & Time Summary */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">วันที่จัดกิจกรรม</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">เวลา</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">จุดนัดพบ</span>
                    <span className="font-bold text-slate-900 leading-snug">{cleanText(eventData.location)}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Join / View E-Ticket / Group Chat) */}
              <div className="space-y-2.5 pt-2">
                {isEnded ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3 rounded-2xl font-bold text-xs cursor-not-allowed text-center"
                  >
                    กิจกรรมนี้สิ้นสุดแล้ว
                  </button>
                ) : isJoined ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsETicketOpen(true)}
                      className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-[#4A7C59]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>ดูตั๋ว E-Ticket ของคุณ ➔</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsChatOpen(true)}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-[#4A7C59] border border-emerald-200 py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>ห้องแชตกลุ่มเตรียมนัดพบ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      className="w-full text-rose-500 hover:text-rose-700 font-bold text-xs py-1.5 transition-colors text-center hover:underline cursor-pointer"
                    >
                      ยกเลิกการเข้าร่วมกิจกรรม
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoinEvent}
                    className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-[#4A7C59]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <span>ลงทะเบียนเข้าร่วม</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================================
            RELATED ACTIVITIES SECTION
           ========================================================================= */}
        {relatedActivities.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  กิจกรรมคอมมูนิตี้ที่คุณอาจสนใจ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  กิจกรรมไลฟ์สไตล์และเวิร์กช็อปอื่นๆ ที่เปิดรับเพื่อนใหม่
                </p>
              </div>

              <Link
                href="/?tab=community"
                className="text-xs sm:text-sm font-bold text-[#4A7C59] hover:underline flex items-center gap-1"
              >
                <span>ดูกิจกรรมทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedActivities.map((relEvent) => (
                <Link
                  key={relEvent.id}
                  href={`/community/${encodeURIComponent(relEvent.id)}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={relEvent.image}
                      alt={relEvent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {relEvent.price || 'ฟรี'}
                    </span>
                  </div>
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
                      {cleanText(relEvent.title)}
                    </h3>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{cleanText(relEvent.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{cleanText(relEvent.location)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-xs sm:text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full">
              รูปที่ {activePhotoIndex + 1} จาก {galleryImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[activePhotoIndex]}
              alt={`Fullscreen ${activePhotoIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
              }
              className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length)
              }
              className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activePhotoIndex === idx ? 'border-[#4A7C59] scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bottom Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirmLogout={() => handleSetIsLoggedIn(false)} />
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จแล้ว! 🎉`);
          setIsCreateEventModalOpen(false);
        }}
      />
      
      {/* 🌟 Editorial Boarding Pass Confirm Join Modal */}
      {isConfirmJoinModalOpen && eventData && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          onClick={() => setIsConfirmJoinModalOpen(false)}
        >
          <div
            className="bg-white rounded-[36px] p-6 sm:p-8 max-w-lg sm:max-w-xl w-full shadow-2xl border border-[#E8E2D8] text-left space-y-5 animate-scale-up relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Category Pill & Close Button */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A7C59] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>กิจกรรมคอมมูนิตี้ • Safe Space Verified</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmJoinModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                ยืนยันการลงทะเบียน
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                ร่วมกิจกรรมและพบปะเพื่อนใหม่ในบรรยากาศที่เป็นกันเองและปลอดภัย
              </p>
            </div>

            {/* Editorial Reservation Pass Card */}
            <div className="bg-[#FAF7F2] rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] space-y-4 shadow-2xs relative">
              {/* Event Title & Price Pill */}
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {cleanText(eventData.title)}
                </h4>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shrink-0">
                  {!eventData.price || cleanText(eventData.price).includes('ฟรี') ? 'เข้าร่วมฟรี' : cleanText(eventData.price)}
                </span>
              </div>

              {/* Clean Key-Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 font-medium pt-1">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">วันที่จัด:</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#4A7C59] shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">ช่วงเวลา:</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">สถานที่นัดพบ:</span>
                    <span className="font-bold text-slate-900 leading-relaxed">{cleanText(eventData.location)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <User className="w-4 h-4 text-[#4A7C59] shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">ผู้จัด:</span>
                    <span className="font-bold text-slate-900">{eventData.hostName || 'Verified Community Host'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59]" />
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
                onClick={() => setIsConfirmJoinModalOpen(false)}
                className="w-full py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-98 cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleExecuteJoin}
                className="w-full py-3.5 rounded-2xl bg-[#4A7C59] hover:bg-[#3B6347] text-white text-sm font-black shadow-lg shadow-[#4A7C59]/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>ยืนยันและรับตั๋ว</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {eventData && (
        <>
          <ETicketModal
            isOpen={isETicketOpen}
            onClose={() => setIsETicketOpen(false)}
            event={eventData}
            ticketId={`TICK-${eventData.id}`}
            isCheckedIn={isCheckedIn}
            onCheckIn={() => {
              setIsCheckedIn(true);
              showToast('เช็คอินหน้างานเรียบร้อย ยินดีต้อนรับค่ะ! 🎉');
            }}
          />
          <GroupChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} event={eventData} />
          <CancelTicketModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            event={eventData}
            ticketId={`TICK-${eventData.id}`}
            onConfirmCancel={handleConfirmCancel}
          />
          <TipHostModal
            isOpen={isTipModalOpen}
            onClose={() => setIsTipModalOpen(false)}
            event={eventData}
            onTipSubmit={() => {
              setIsTipModalOpen(false);
              showToast('ส่งทิปให้ผู้จัดงานเรียบร้อย ขอบคุณสำหรับกำลังใจค่ะ! ☕✨');
            }}
          />
          <ReportSafetyModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetTitle={eventData.title}
            targetHostName={eventData.hostName}
          />
        </>
      )}

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />
    </div>
  );
}
