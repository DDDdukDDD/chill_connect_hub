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
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import {
  getEventById,
  getRelatedEvents,
  EventItem,
  MOCK_EVENTS
} from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import {
  MapPin,
  Clock,
  Calendar,
  Heart,
  Star,
  Share2,
  Check,
  CheckCircle2,
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
  AlertCircle,
  Flag,
  Flame,
  BatteryCharging,
  DollarSign,
  Tag,
  CheckSquare,
  Gift,
  User,
  Globe,
  Building2
} from 'lucide-react';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  heal: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: '🌿 ฮีลใจ & สมาธิ' },
  move: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: '🏃 ขยับกาย & กีฬา' },
  chill: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: '☕ จิบกาแฟ & ชิลล์' },
  learn: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: '🎨 ศิลปะ & เรียนรู้' },
};

export default function EventDetailPage() {
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

  // Secondary Modals State
  const [isETicketOpen, setIsETicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Dynamic Event State (Live participants)
  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Retrieve event from both local mock and live API database
  useEffect(() => {
    if (!decodedId) {
      setIsLoading(false);
      return;
    }

    // 1. Check local mock events first for instantaneous display
    const localFound = getEventById(decodedId) || MOCK_EVENTS.find((e) => e.id === decodedId || e.title === decodedId);
    if (localFound) {
      setEventData(localFound);
      setIsLoading(false);
    }

    // 2. Fetch live and scraped events from /api/events
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
      .catch((err) => {
        console.error('Error fetching live events:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [decodedId]);

  // Load user status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('favorite_events');
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch {
          // ignore
        }
      }

      const savedJoined = localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        try {
          setJoinedEventIds(JSON.parse(savedJoined));
        } catch {
          // ignore
        }
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
        showToast('บันทึกอีเวนต์ในรายการโปรดเรียบร้อย! ❤️');
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

    const updatedParticipants = Math.min(eventData.participantsCount + 1, eventData.maxParticipants);
    setEventData({ ...eventData, participantsCount: updatedParticipants });
    
    const newJoined = [...joinedEventIds, eventData.id];
    setJoinedEventIds(newJoined);
    if (typeof window !== 'undefined') {
      localStorage.setItem('joined_event_ids', JSON.stringify(newJoined));
    }

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
      text: `ชวนไปงานนี้: ${eventData.title} (${eventData.date} @ ${eventData.location})`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('แชร์กิจกรรมเรียบร้อย! 🎉');
        return;
      } catch {
        // user cancel
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์อีเวนต์แล้ว ส่งชวนเพื่อนใน LINE ได้เลย! 📋✨');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('คัดลอกลิงก์เรียบร้อย');
    }
  };

  // Related events
  const relatedEvents = useMemo(() => {
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
          <div className="h-64 sm:h-80 md:h-[380px] bg-slate-100 animate-pulse rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
              <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
            </div>
          </div>
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
          <div className="w-16 h-16 bg-orange-50 text-[#F26430] rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🎟️
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลกิจกรรมหรืออีเวนต์นี้</h1>
          <p className="text-sm text-slate-600">กิจกรรมนี้อาจสิ้นสุดลงแล้วหรือไม่มีอยู่ในระบบ</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าแรก</span>
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

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
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
            TOP BREADCRUMBS & ACTIONS
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1.5 border-b border-slate-100">
          
          {/* Breadcrumbs */}
          <nav className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#F26430] transition-colors font-semibold py-2 px-1">หน้าแรก</Link>
            <span className="py-2">/</span>
            <Link
              href={`/?tab=${eventData.eventType === 'public_venue' ? 'public_venue' : 'community'}`}
              className="hover:text-[#F26430] transition-colors py-2 px-1 font-semibold"
            >
              {eventData.eventType === 'public_venue' ? 'อีเวนต์ & งานแฟร์' : 'กิจกรรมคอมมูนิตี้'}
            </Link>
            <span className="py-2">/</span>
            <span className="text-slate-900 font-bold truncate py-2 px-1">{eventData.title}</span>
          </nav>

          {/* Action Buttons */}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-slate-700 hover:text-[#F26430] text-xs font-bold transition-all shadow-2xs border border-slate-200 hover:border-orange-200 cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>แชร์อีเวนต์</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* =========================================================================
            HERO BANNER & POSTER
           ========================================================================= */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 h-64 sm:h-80 md:h-[380px] group shadow-sm">
          <img
            src={eventData.image}
            alt={eventData.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

          {/* Floating Badges on Top Left */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-10">
            <span className={`text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {catStyle.label}
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/80 text-white border border-white/20 backdrop-blur-md">
              {eventData.eventType === 'public_venue' ? '🎟️ งานอีเวนต์ & งานแฟร์' : '👥 กิจกรรมคอมมูนิตี้'}
            </span>

            {isAlmostFull && !isEnded && (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500 text-white shadow-md animate-pulse">
                🔥 ที่นั่งใกล้เต็ม
              </span>
            )}

            {isEnded && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-200">
                🏁 สิ้นสุดกิจกรรมแล้ว
              </span>
            )}
          </div>

          {/* Title and Date on Bottom Left */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white space-y-1.5 z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-snug drop-shadow-md">
              {eventData.title}
            </h1>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#F26430]" />
                <span>{eventData.date}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#4A7C59]" />
                <span>{eventData.time}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 truncate max-w-xs sm:max-w-md">
                <MapPin className="w-4 h-4 text-[#F26430]" />
                <span className="truncate">{eventData.location}</span>
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2-COLUMN EDITORIAL CONTENT LAYOUT
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-2">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Host Profile Card / Official Organizer Card */}
            {(() => {
              const isSystemOrOfficial =
                eventData.eventType === 'public_venue' ||
                eventData.source?.includes('QSNCC') ||
                eventData.source?.includes('BITEC') ||
                eventData.source?.includes('IMPACT') ||
                eventData.source?.includes('Official') ||
                eventData.source?.includes('Events') ||
                eventData.venueTag === 'qsncc' ||
                eventData.venueTag === 'bitec' ||
                eventData.venueTag === 'impact' ||
                eventData.id.startsWith('live-') ||
                eventData.id.startsWith('seed-');

              const organizerName =
                eventData.source ||
                (eventData.location?.includes('สิริกิติ์')
                  ? 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)'
                  : eventData.location?.includes('ไบเทค')
                  ? 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา'
                  : eventData.location?.includes('อิมแพ็ค')
                  ? 'อิมแพ็ค เมืองทองธานี'
                  : 'ผู้จัดงานทางการ (Official Partner)');

              const officialWebsiteUrl =
                eventData.externalUrl ||
                eventData.sourceUrl ||
                (eventData.location?.includes('สิริกิติ์')
                  ? 'https://www.qsncc.com/en/whats-on/event-calendar'
                  : eventData.location?.includes('ไบเทค')
                  ? 'https://www.bitec.co.th/events'
                  : eventData.location?.includes('อิมแพ็ค')
                  ? 'https://www.impact.co.th'
                  : null);

              if (isSystemOrOfficial) {
                return (
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-2xl shrink-0">
                        🏛️
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-sm text-slate-900 truncate">{organizerName}</h3>
                          <span className="text-[10px] font-black text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
                            Official Partner 🏛️
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          อีเวนต์ทางการ • คัดสรรและตรวจสอบข้อมูลโดย Chill & Connect Hub
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {officialWebsiteUrl && (
                        <a
                          href={officialWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-sky-600" />
                          <span>เว็บผู้จัดงาน</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="รายงานข้อมูลไม่ถูกต้อง"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Community Host Mode (Clickable Profile Link)
              const profileHref = `/profile?id=${encodeURIComponent(eventData.hostId || 'host-mind')}&name=${encodeURIComponent(eventData.hostName)}`;

              return (
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
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#F26430] transition-colors truncate">
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
              );
            })()}

            {/* About / Description */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                <Sparkles className="w-4 h-4 text-[#F26430]" />
                <span>รายละเอียดกิจกรรม & วัตถุประสงค์</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                {eventData.description}
              </p>
            </div>

            {/* Safe Space Community Pledge */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-emerald-950 leading-relaxed">
                <strong className="block font-bold">100% Safe Space & Welcoming Atmosphere</strong>
                <span>กิจกรรมนี้เน้นความเป็นมิตร ไม่กดดัน ทุกคนสามารถเป็นตัวของตัวเองได้สบายใจ มี Host ดูแลต้อนรับอย่างอบอุ่น</span>
              </div>
            </div>

            {/* Schedule & Checklist (If any) */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                <CheckSquare className="w-4 h-4 text-[#4A7C59]" />
                <span>สิ่งที่ควรเตรียมมา & กฎการเข้าร่วม</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'แต่งกายสุภาพและสวมใส่รองเท้าที่เดินสะดวก',
                  'พกสมาร์ตโฟนที่มีแบตเตอรี่เพียงพอสำหรับเปิด E-Ticket',
                  'รักษามารยาทและความเป็นมิตรต่อเพื่อนร่วมทางทุกคน',
                  'หากไม่สามารถมาได้ กรุณากดยกเลิกล่วงหน้า 24 ชม.'
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-medium">
                    <Check className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue & Location Map Box */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                <MapPin className="w-4 h-4 text-[#F26430]" />
                <span>สถานที่จัดงาน & จุดนัดพบ</span>
              </h2>

              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">{eventData.location}</h4>
                  <p className="text-xs text-slate-500">มีจุดสังเกตและป้ายต้อนรับของกิจกรรมอย่างชัดเจน</p>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-orange-50 text-[#F26430] border border-orange-200 font-bold text-xs shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>เปิด Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>



          </div>

          {/* RIGHT COLUMN: STICKY REGISTRATION & E-TICKET SIDEBAR (1 Col) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              
              {/* Price & Free Entry Header */}
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
                    <Users className="w-3.5 h-3.5 text-[#2B527A]" />
                    <span>ผู้ลงทะเบียน</span>
                  </span>
                  <span className="text-slate-900 font-extrabold">
                    {eventData.participantsCount} / {eventData.maxParticipants} คน
                  </span>
                </div>

                {/* Progress Bar */}
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
                  <Calendar className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">วันที่จัดงาน</span>
                    <span className="font-bold text-slate-900">{eventData.date}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">เวลา</span>
                    <span className="font-bold text-slate-900">{eventData.time}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">สถานที่</span>
                    <span className="font-bold text-slate-900 leading-snug">{eventData.location}</span>
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
                    className="w-full bg-[#F26430] hover:bg-[#D95322] text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <span>ลงทะเบียนรับตั๋ว E-Ticket ฟรี</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================================
            RELATED EVENTS SECTION
           ========================================================================= */}
        {relatedEvents.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  กิจกรรมและอีเวนต์ที่น่าสนใจอื่นๆ 🎟️
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  ค้นพบงานแฟร์ เวิร์กช็อป และตี้ใหม่ๆ ที่จัดขึ้นเร็วๆ นี้
                </p>
              </div>

              <Link
                href="/?category=all"
                className="text-xs font-extrabold text-[#F26430] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>ดูกิจกรรมทั้งหมด</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedEvents.map((item) => (
                <Link
                  key={item.id}
                  href={`/events/${encodeURIComponent(item.id)}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {item.eventType === 'public_venue' ? '🎟️ งานอีเวนต์' : '👥 คอมมูนิตี้'}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>{item.date}</span>
                        <span className="text-[#F26430]">{item.price && !item.price.includes('ฟรี') ? item.price : 'เข้าฟรี'}</span>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#F26430] transition-colors mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        📍 {item.location}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#F26430]">
                      <span>ดูรายละเอียดงาน</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 space-y-1.5 mt-10">
        <p className="font-medium text-slate-600 text-xs">Lifestyle Discovery & Community Engagement Platform ระดับประเทศ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* MODALS */}
      {/* 1. E-Ticket Modal */}
      {isETicketOpen && eventData && (
        <ETicketModal
          event={eventData}
          isOpen={isETicketOpen}
          onClose={() => setIsETicketOpen(false)}
          ticketId={`TICKET-${eventData.id.toUpperCase()}-2026`}
          isCheckedIn={isCheckedIn}
          onCheckIn={(_tId: string) => {
            setIsCheckedIn(true);
            showToast('เช็คอินเข้าร่วมกิจกรรมเรียบร้อย! 🎉');
          }}
          onOpenChat={() => {
            setIsETicketOpen(false);
            setIsChatOpen(true);
          }}
          onOpenCancel={() => {
            setIsETicketOpen(false);
            setIsCancelModalOpen(true);
          }}
        />
      )}

      {/* 2. Group Chat Modal */}
      {isChatOpen && eventData && (
        <GroupChatModal
          event={eventData}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* 3. Cancel Ticket Modal */}
      {isCancelModalOpen && eventData && (
        <CancelTicketModal
          event={eventData}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          ticketId={`TICKET-${eventData.id.toUpperCase()}-2026`}
          onConfirmCancel={(_tId: string, _reason: string) => handleConfirmCancel()}
        />
      )}

      {/* 4. Tip Host Modal */}
      {isTipModalOpen && eventData && (
        <TipHostModal
          event={eventData}
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          onTipSubmit={(_rating: number, _review: string, amount: number) => {
            setIsTipModalOpen(false);
            showToast(`ขอบคุณที่เลี้ยงกาแฟ Host จำนวน ฿${amount}! ☕💖`);
          }}
        />
      )}

      {/* 5. Report Safety Modal */}
      {isReportModalOpen && eventData && (
        <ReportSafetyModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetTitle={eventData.title}
          targetHostName={eventData.hostName}
          onReportSubmitted={(reason: string, _details: string) => {
            setIsReportModalOpen(false);
            showToast(`ส่งรายงาน "${reason}" เรียบร้อยแล้ว ทีมงานจะตรวจสอบอย่างเร็วที่สุด`);
          }}
        />
      )}

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          showToast('ออกจากระบบเรียบร้อย');
        }}
      />
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
