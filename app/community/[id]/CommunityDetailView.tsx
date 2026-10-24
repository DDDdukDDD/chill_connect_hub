'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ETicketModal } from '@/components/ETicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { useAuth } from '@/lib/useAuth';
import { VisitPanel } from '@/components/VisitPanel';
import { EventAttendees } from '@/components/EventAttendees';
import { JoinReadinessNotice, joinBlocker } from '@/components/JoinReadinessNotice';
import { DetailHero, DetailTable, ItineraryList, heroButton } from '@/components/detail/DetailHero';
import { PillarLinks } from '@/components/detail/PillarLinks';
import { AfterTeePanel } from '@/components/detail/AfterTeePanel';
import { SeriesDates } from '@/components/detail/SeriesDates';
import { DayOfPanel, isToday } from '@/components/detail/DayOfPanel';
import { HostCheckIn } from '@/components/detail/HostCheckIn';
import { WaitlistAction } from '@/components/detail/WaitlistAction';
import { EventQuestions, type QuestionItem } from '@/components/detail/EventQuestions';
import { useMemberSession } from '@/lib/useMemberSession';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import {
  getEventById,
  EventItem,
  MOCK_EVENTS
} from '@/data/mockData';
import { eventOrigin } from '@/lib/contentOrigin';
import { isEventEnded } from '@/lib/dateUtils';
import { resolveEventGallery } from '@/lib/eventImageResolver';
import { parseEventPrice } from '@/lib/priceUtils';
import { renderDescriptionContent } from '@/components/RichTextEditor';
import { RelatedCards, teeCard } from '@/components/detail/RelatedCards';
import {
  MapPin,
  Clock,
  Calendar,
  Globe,
  Repeat,
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
  CheckCircle2,
  Ticket
} from 'lucide-react';

// Helper to strip rogue emojis for clean typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/** The page itself: `initialEvent` comes from the server page, so the content is in the HTML search engines read. */
export default function CommunityDetailPage({
  initialEvent = null,
  initialQuestions = null,
}: {
  initialEvent?: EventItem | null;
  /** "ถามผู้จัดก่อนไป" read on the server, so questions and answers are in the HTML */
  initialQuestions?: { canAnswer: boolean; hostName?: string; questions: QuestionItem[] } | null;
}) {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('events');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const hostCheckMember = useMemberSession().member;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Sign-up from "ลงทะเบียนเข้าร่วม" comes back here with ?join=1 (through onboarding and the email link),
  // so the join dialog opens again instead of the member having to find the button
  const [pairChat, setPairChat] = useState<{ roomId: string; title: string } | null>(null);
  const [membershipReturnTo, setMembershipReturnTo] = useState<string | null>(null);
  const joinReturnPath = `/community/${encodeURIComponent(decodedId)}?join=1`;

  // Favorites & Joined Events State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  // What the member joined comes from the account; this keeps the page in step with it
  const myActivity = useMyActivity();
  useEffect(() => {
    if (myActivity.isLoaded) setJoinedEventIds(myActivity.joinedIds);
  }, [myActivity.isLoaded, myActivity.joinedIds]);
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Dynamic Event State (Immediate sync for SSR & instant load)
  const [eventData, setEventData] = useState<EventItem | null>(() => {
    if (initialEvent) return initialEvent;
    if (!decodedId) return null;
    return getEventById(decodedId) || MOCK_EVENTS.find((e) => e.id === decodedId || e.title === decodedId) || null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (initialEvent || !decodedId) return false;
    const found = getEventById(decodedId) || MOCK_EVENTS.find((e) => e.id === decodedId || e.title === decodedId);
    return !found;
  });

  // Retrieve event from both local mock and live API database
  useEffect(() => {
    // The server already sent this event
    if (initialEvent) return;
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
  }, [decodedId, initialEvent]);

  const [liveMeetups, setLiveMeetups] = useState<EventItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/events?type=community&status=recruiting&limit=24')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.events)) setLiveMeetups(data.events);
      })
      .catch(() => {
        /* the row stays hidden */
      });
    return () => {
      active = false;
    };
  }, []);

  // Gallery Photos
  const galleryImages: string[] = useMemo(() => {
    if (!eventData) return [];
    return resolveEventGallery(eventData);
  }, [eventData]);

  // Editorial Price & Ticket Tier Breakdown
  const parsedPrice = useMemo(() => {
    return parseEventPrice(eventData?.price, 'เข้าร่วมฟรี');
  }, [eventData?.price]);

  // Load user status from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedFavs = localStorage.getItem('favorite_events');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch {}
    }

    // Who joined what comes from the account (useMyActivity above), never from this browser:
    // lists kept in the browser belong to whoever used it last, so another member would look "joined"
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกตี้ที่ชอบ');
      setPendingAction(`favorite:${eventId}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    setFavorites((prev) => {
      const isFavorited = prev.includes(eventId);
      let updated: string[];
      if (isFavorited) {
        updated = prev.filter((id) => id !== eventId);
        showToast('ลบออกจากรายการโปรดแล้ว');
      } else {
        updated = [...prev, eventId];
        const targetTitle = eventId === eventData?.id ? eventData?.title : (relatedActivities.find((a) => a.id === eventId)?.title || eventData?.title);
        showToast(`เพิ่ม "${cleanText(targetTitle)}" ใน MyHub เรียบร้อย! ❤️`);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleJoinEvent = () => {
    // A recurring ตี้ is joined one date at a time: the date list does it
    if (eventData && eventData.scheduleType === 'recurring' && eventData.recurrence?.daysOfWeek?.length && !eventData.seriesId) {
      document.getElementById('dates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อลงทะเบียนเข้าร่วมตี้');
      setPendingAction('join');
      setIsRequireMembershipOpen(true);
      return;
    }
    if (!eventData) return;

    if (joinedEventIds.includes(eventData.id)) {
      setIsETicketOpen(true);
      return;
    }

    setIsConfirmJoinModalOpen(true);
  };

  const handleExecuteJoin = async () => {
    if (!eventData) return;
    // The server decides (seats left, event ended, account verified)
    const joinResult = await activityActions.join(eventData.id);
    if (!joinResult.ok) {
      setIsConfirmJoinModalOpen(false);
      showToast(joinResult.message);
      return;
    }

    const updatedParticipants = Math.min(eventData.participantsCount + 1, eventData.maxParticipants);
    setEventData({ ...eventData, participantsCount: updatedParticipants });
    
    const newJoined = [...joinedEventIds, eventData.id];
    setJoinedEventIds(newJoined);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('joined_event_ids', JSON.stringify(newJoined));
        const existingSubs = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
        existingSubs[eventData.id] = {
          id: eventData.id,
          eventId: eventData.id,
          eventTitle: cleanText(eventData.title),
          subTitle: cleanText(eventData.title),
          eventDate: cleanText(eventData.date),
          eventTime: cleanText(eventData.time),
          eventLocation: cleanText(eventData.location),
          eventImage: eventData.image,
          creatorName: cleanText(eventData.hostName),
          creatorAvatar: eventData.hostAvatar,
          eventType: 'community',
          category: eventData.category || 'heal',
          tag: eventData.tag || 'ตี้',
          description: eventData.description,
          price: eventData.price,
          participantsCount: updatedParticipants,
          maxParticipants: eventData.maxParticipants,
        };
        localStorage.setItem('joinedSubActivities', JSON.stringify(existingSubs));
      } catch {}
    }

    setIsConfirmJoinModalOpen(false);
    showToast(`ยินดีด้วย! คุณลงทะเบียนเข้าร่วม "${cleanText(eventData.title)}" สำเร็จแล้ว 🎉`);
    setIsETicketOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!eventData) return;
    const leaveResult = await activityActions.leave(eventData.id);
    if (!leaveResult.ok) {
      setIsCancelModalOpen(false);
      showToast(leaveResult.message);
      return;
    }
    const updatedParticipants = Math.max(eventData.participantsCount - 1, 0);
    setEventData({ ...eventData, participantsCount: updatedParticipants });

    const newJoined = joinedEventIds.filter((id) => id !== eventData.id);
    setJoinedEventIds(newJoined);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('joined_event_ids', JSON.stringify(newJoined));
        const existingSubs = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
        delete existingSubs[eventData.id];
        localStorage.setItem('joinedSubActivities', JSON.stringify(existingSubs));
      } catch {}
    }

    setIsCancelModalOpen(false);
    showToast(`ยกเลิกการเข้าร่วมตี้เรียบร้อย`);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !eventData) return;
    const url = window.location.href;
    const shareData = {
      title: `${eventData.title} | Chill & Connect Hub`,
      text: `ชวนไปตี้นี้: ${eventData.title} (${eventData.date} @ ${eventData.location})`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('แชร์ตี้เรียบร้อย! 🎉');
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์ตี้แล้ว ส่งชวนเพื่อนใน LINE ได้เลย! 📋✨');
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

  // Placeholder text below is for seed events only; a member's event shows what the member entered
  const isSample = !eventData || eventOrigin(eventData) === 'sample';

  // Transit details
  const { publicTransitText, parkingText } = useMemo(() => {
    if (!eventData) return { publicTransitText: '', parkingText: '' };
    if (!isSample) return { publicTransitText: eventData.transportation || '', parkingText: '' };
    const loc = eventData.location || '';
    if (loc.includes('สวน') || loc.includes('เบญจกิติ') || loc.includes('ลุมพินี')) {
      return {
        publicTransitText: 'รถไฟฟ้า MRT สถานีสุขุมวิท / คลองเตย หรือ BTS สถานีอโศก เดินต่อเข้าสู่ทางเข้าสวน',
        parkingText: 'มีลานจอดรถของสวนสาธารณะ (แนะนำเดินทางด้วยรถไฟฟ้าสะดวกที่สุด)'
      };
    }
    return {
      publicTransitText: 'สามารถเดินทางด้วยรถไฟฟ้า BTS, MRT หรือรถประจำทางที่ผ่านบริเวณจุดนัดพบ',
      parkingText: 'มีพื้นที่จอดรถสำหรับผู้เข้าร่วมตี้ หรือจุดจอดรถบริเวณใกล้เคียง'
    };
  }, [eventData, isSample]);

  const checklist = isSample
    ? [
      'แต่งกายสุภาพและสวมใส่ชุดที่เคลื่อนไหวสะดวก',
      'พกสมาร์ตโฟนที่มีแบตเตอรี่พร้อมเปิดตั๋ว E-Ticket และเข้าห้องแชต',
      'เปิดใจรับฟังและรักษามารยาทต่อเพื่อนร่วมตี้ทุกคน',
      'หากไม่สะดวกมาร่วมตี้ กรุณากดยกเลิกล่วงหน้า 24 ชม. เพื่อเปิดสิทธิ์ให้ผู้อื่น',
    ]
    : eventData?.whatToBring ?? [];

  // Related Community Activities (never ones that are over)
  // Back from sign-up (?join=1): open the join dialog once, then drop the flag so a reload does not reopen it
  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || !eventData || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('join') !== '1') return;
    url.searchParams.delete('join');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    if (!joinedEventIds.includes(eventData.id) && !isEventEnded(eventData)) setIsConfirmJoinModalOpen(true);
  }, [isAuthReady, isLoggedIn, eventData, joinedEventIds]);

  // Other ตี้ open now, same สาย first (live data; the old sample list mixed in ticketed fairs)
  const sameSai = (e: EventItem) => (eventData?.lifestyleCategory && e.lifestyleCategory === eventData.lifestyleCategory ? 0 : e.category === eventData?.category ? 1 : 2);
  const relatedActivities = eventData
    ? liveMeetups
        .filter((e) => e.id !== eventData.id && e.eventType !== 'public_venue' && !isEventEnded(e))
        .sort((x, y) => sameSai(x) - sameSai(y))
        .slice(0, 4)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
        <Navbar
        showMenuOnMobile
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
        showMenuOnMobile
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
            🌿
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ไม่พบข้อมูลตี้นี้</h1>
          <p className="text-sm text-slate-600">ตี้นี้อาจสิ้นสุดลงแล้วหรือถูกยกเลิก</p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปดูตี้ทั้งหมด</span>
          </Link>
        </main>
      </div>
    );
  }

  const isFav = favorites.includes(eventData.id);
  const isHost = Boolean(eventData.isHost || (hostCheckMember && (eventData as { createdByMemberId?: string }).createdByMemberId === hostCheckMember.id));
  const isJoined = isHost || joinedEventIds.includes(eventData.id);
  // A recurring ตี้ (the series, not one of its dates) goes on: seats and dates come from its dates
  const isSeriesEvent = eventData.scheduleType === 'recurring' && Boolean(eventData.recurrence?.daysOfWeek?.length) && !eventData.seriesId;
  const isEnded = !isSeriesEvent && isEventEnded(eventData);
  const fillRatio = eventData.participantsCount / eventData.maxParticipants;
  const isAlmostFull = fillRatio >= 0.8;
  const seatsLeft = Math.max(eventData.maxParticipants - eventData.participantsCount, 0);
  const isFull = !isSeriesEvent && seatsLeft === 0 && !isJoined;
  const isOnline = eventData.locationType === 'online' || eventData.province === 'ออนไลน์';
  // A recurring ตี้ is a series: members pick a date (each date is its own event, lib/social/recurring.ts)
  const isSeriesPage = isSeriesEvent;
  const memberHost = Boolean((eventData as { createdByMemberId?: string }).createdByMemberId);
  const askToJoin = (title: string, returnTo: string | null) => {
    setMembershipActionTitle(title);
    setMembershipReturnTo(returnTo);
    setIsRequireMembershipOpen(true);
  };
  const cancellationText =
    eventData.cancellationPolicy === 'free_anytime'
      ? 'ยกเลิกได้ตลอด'
      : eventData.cancellationPolicy === 'free_48h'
      ? 'ยกเลิกได้ก่อนเริ่ม 48 ชม.'
      : eventData.cancellationPolicy === 'chat_notice'
      ? 'ไปไม่ได้ แจ้งในแชตกลุ่ม'
      : 'ยกเลิกได้ก่อนเริ่ม 24 ชม.';
  const profileHref = `/profile?id=${encodeURIComponent(eventData.hostId || 'host-mind')}&name=${encodeURIComponent(eventData.hostName)}`;

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        showMenuOnMobile
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setMembershipActionTitle('เพื่อตั้งตี้ใหม่');
            setPendingAction('create');
            setIsRequireMembershipOpen(true);
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-16">
        <Link href="/community" className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          ตี้ทั้งหมด
        </Link>

        {/* Header, drawn like the challenge page (components/detail/DetailHero.tsx): every fact here once */}
        <DetailHero
          pillar="community"
          image={galleryImages[0] || eventData.image}
          imageAlt={`${cleanText(eventData.title)} ภาพบรรยากาศตี้`}
          photoCount={galleryImages.length}
          onOpenPhotos={() => {
            setActivePhotoIndex(0);
            setIsLightboxOpen(true);
          }}
          highlight={
            isSeriesEvent
              ? { icon: Users, text: `จัดประจำ · รับวันละ ${eventData.maxParticipants} คน`, tone: 'open' }
              : isEnded
              ? { icon: Users, text: `ตี้นี้จบแล้ว · ไป ${eventData.participantsCount} คน`, tone: 'closed' }
              : isFull
              ? { icon: Users, text: `เต็มแล้ว · ${eventData.participantsCount}/${eventData.maxParticipants} คน`, tone: 'closed' }
              : { icon: Users, text: `${eventData.participantsCount}/${eventData.maxParticipants} คน · เหลือ ${seatsLeft} ที่`, tone: seatsLeft <= 2 ? 'urgent' : 'open' }
          }
          title={cleanText(eventData.title)}
          facts={[
            {
              icon: eventData.scheduleType === 'recurring' ? Repeat : Calendar,
              text:
                eventData.scheduleType === 'recurring' && eventData.recurrence?.customSummary
                  ? eventData.recurrence.customSummary
                  : `${cleanText(eventData.date)} · ${cleanText(eventData.time)}`,
            },
            {
              icon: isOnline ? Globe : MapPin,
              text: isOnline ? `ออนไลน์ผ่าน ${eventData.onlinePlatform ? eventData.onlinePlatform.replace('_', ' ') : 'วิดีโอคอล'}` : cleanText(eventData.location),
            },
            { icon: Ticket, text: parsedPrice.displayPrice },
          ]}
          note={
            isJoined && !isHost && !isEnded ? (
              <button type="button" onClick={() => setIsCancelModalOpen(true)} className="font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer">
                ไปไม่ได้แล้ว? ยกเลิกการเข้าร่วม
              </button>
            ) : undefined
          }
          actions={
            <>
              {isHost ? (
                <>
                  <button type="button" onClick={() => setIsChatOpen(true)} className={heroButton.primary}>
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    แชตกับคนในตี้
                  </button>
                  <Link href="/myhub?tab=community" className={heroButton.quiet}>จัดการในมายฮับ</Link>
                </>
              ) : isJoined ? (
                <>
                  <button type="button" onClick={() => setIsETicketOpen(true)} className={heroButton.done}>
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    ลงทะเบียนแล้ว · ดูบัตร
                  </button>
                  <button type="button" onClick={() => setIsChatOpen(true)} className={heroButton.quiet}>
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    แชตกลุ่ม
                  </button>
                </>
              ) : isEnded ? (
                <button type="button" disabled className={heroButton.primary}>ตี้นี้จบแล้ว</button>
              ) : isSeriesPage ? (
                <a href="#dates" className={heroButton.primary}>เลือกวันที่จะไป</a>
              ) : isFull ? (
                <WaitlistAction
                  eventId={eventData.id}
                  isLoggedIn={isLoggedIn}
                  onRequireLogin={() => askToJoin('เพื่อต่อคิวรายชื่อสำรอง', `/community/${encodeURIComponent(eventData.id)}`)}
                  onJoin={handleJoinEvent}
                />
              ) : (
                <button type="button" onClick={handleJoinEvent} className={heroButton.primary}>
                  ลงทะเบียนเข้าร่วม
                </button>
              )}
              <button type="button" onClick={handleShare} className={heroButton.quiet}>
                {isCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                {isCopied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}
              </button>
              {/* A ตี้ you joined or run is already on your schedule, so saving it says nothing more */}
              {!isJoined && !isHost && (
                <button
                  type="button"
                  onClick={() => toggleFavorite(eventData.id)}
                  aria-pressed={isFav}
                  aria-label={isFav ? 'บันทึกตี้นี้แล้ว' : 'บันทึกตี้นี้'}
                  className={heroButton.icon}
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-[#F26430] text-[#F26430]' : ''}`} aria-hidden="true" />
                </button>
              )}
            </>
          }
        />

        {/* Other dates of a recurring ตี้ and the place it meets at, the date list, and the day-of and after panels:
            each only when it applies (empty wrapper hides) */}
        <div className="mt-8 space-y-6 empty:hidden">
        <PillarLinks
          links={[
            ...(eventData.seriesId ? [{ pillar: 'community' as const, label: 'ตี้ประจำ', text: 'ดูวันอื่นของตี้นี้', href: `/community/${encodeURIComponent(eventData.seriesId)}` }] : []),
            ...((eventData as { spotId?: string }).spotId
              ? [{ pillar: 'spot' as const, label: 'ที่นัดเจอ', text: (eventData as { spotTitle?: string }).spotTitle || cleanText(eventData.location), href: `/spots/${encodeURIComponent((eventData as { spotId?: string }).spotId as string)}` }]
              : []),
          ]}
        />

        {isSeriesPage && <SeriesDates series={eventData} onRequireLogin={(returnTo) => askToJoin('เพื่อลงทะเบียนเข้าร่วมตี้', returnTo)} />}

        {/* The day itself: ticket, way there, chat, who has arrived (participant) and the check-in (host) */}
        {isJoined && !isHost && isToday(eventData) && (
          <DayOfPanel event={eventData} onOpenTicket={() => setIsETicketOpen(true)} onOpenChat={() => setIsChatOpen(true)} onCancel={() => setIsCancelModalOpen(true)} />
        )}
        {isHost && memberHost && (isToday(eventData) || isEnded) && <HostCheckIn eventId={eventData.id} />}

        {/* After the ตี้: review, "อยากเจออีก" and a moment (shown once the host confirmed the member came, or it ended) */}
        <AfterTeePanel event={eventData} isHost={isHost} onOpenPairChat={(roomId, title) => setPairChat({ roomId, title })} />
        </div>

        {/* Like the challenge page: the story, the rules as a plain table and the way there on the left; on the right
            the one thing the header does not say, who runs it, then moments and the challenge it counts toward */}
        <div className="mt-10 sm:mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-start">
          <aside className="lg:order-2 space-y-6 lg:sticky lg:top-24">
            <section className="p-5 sm:p-6 rounded-3xl bg-[#FFF4EE] border border-slate-200 space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">คนจัดตี้นี้</h2>
              <Link href={profileHref} className="flex items-center gap-3 min-w-0 group">
                {/* eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers */}
                <img
                  src={eventData.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover bg-white shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-sm sm:text-base font-bold text-slate-900 truncate group-hover:underline">{eventData.hostName}</span>
                  {(isSample || eventData.hostRating || eventData.hostHostedCount) && (
                    <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                      {(eventData.hostRating || eventData.rating || 4.9).toFixed(1)}
                      <span aria-hidden="true">·</span>
                      จัดมาแล้ว {eventData.hostHostedCount || 12} ครั้ง
                    </span>
                  )}
                </span>
              </Link>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
                <Link href={profileHref} className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline">ดูโปรไฟล์และรีวิว</Link>
                <button type="button" onClick={() => setIsReportModalOpen(true)} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer">
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  รายงาน
                </button>
              </div>
            </section>

            {/* Moments from members here, and the challenge this counts toward (said once, here) */}
            <VisitPanel
              targetType="community"
              targetId={eventData.id}
              title={eventData.title}
              location={eventData.location}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => {
                setMembershipActionTitle('เพื่อโพสต์โมเมนต์จากตี้นี้');
                setIsRequireMembershipOpen(true);
              }}
              onShowToast={showToast}
            />
          </aside>

          <div className="lg:order-1 min-w-0 space-y-10">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">รายละเอียดตี้</h2>
              {renderDescriptionContent(eventData.description)}
            </section>

            {/* The schedule the host filled in (ตั้งตี้ form, "กำหนดการ"): what happens, hour by hour */}
            <ItineraryList items={eventData.itinerary} />

            <DetailTable
              title="ก่อนไป"
              rows={[
                {
                  label: 'เหมาะกับ',
                  value: [
                    !isOnline && eventData.isSoloFriendly !== false ? 'มาคนเดียวได้' : '',
                    eventData.isBeginnerFriendly ? 'มือใหม่มาได้' : '',
                    !isOnline && eventData.isPetFriendly ? 'พาสัตว์เลี้ยงมาได้' : '',
                  ]
                    .filter(Boolean)
                    .join(' · '),
                },
                {
                  label: 'จำนวนคน',
                  value: eventData.minParticipants
                    ? eventData.participantsCount >= eventData.minParticipants
                      ? `ครบขั้นต่ำ ${eventData.minParticipants} คนแล้ว ตี้นี้ไปแน่นอน`
                      : `ออกเดินทางเมื่อครบ ${eventData.minParticipants} คน ถ้ายังไม่ครบ อย่าเพิ่งไปเจอกันสองต่อสอง`
                    : '',
                },
                {
                  label: 'ค่าใช้จ่าย',
                  value: parsedPrice.hasMultipleTiers ? parsedPrice.tiers.map((t) => `${t.label ? `${t.label}: ` : ''}${t.price}`).join(' · ') : '',
                },
                { label: 'การยกเลิก', value: isEnded ? '' : cancellationText },
                { label: 'สิ่งที่ควรเตรียม', value: isSample ? '' : checklist.map((rule) => cleanText(rule)).join(' · ') },
                {
                  label: 'กติกา',
                  value: (
                    <>
                      นัดเจอที่สาธารณะเท่านั้น เดินทางเอง ไม่สบายใจขอตัวกลับได้ทุกเมื่อ{' '}
                      <Link href="/safety" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">อ่านคู่มือความปลอดภัย</Link>
                    </>
                  ),
                },
              ]}
            />

            {/* Where to meet, or how to join online */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{isOnline ? 'เข้าร่วมออนไลน์' : 'จุดนัดพบ & การเดินทาง'}</h2>
                {!isOnline && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(eventData.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0"
                  >
                    เปิดใน Google Maps
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>

              {isOnline ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {eventData.meetingPoint || `รวมตัวกันผ่าน ${eventData.onlinePlatform ? eventData.onlinePlatform.replace('_', ' ') : 'วิดีโอคอล'} เข้าร่วมได้จากทุกที่`}
                  </p>
                  {isJoined && eventData.onlineJoinUrl ? (
                    <a href={eventData.onlineJoinUrl} target="_blank" rel="noopener noreferrer" className={heroButton.quiet}>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      เปิดห้องตี้
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-500">
                      {isJoined ? 'ลิงก์ห้องจะส่งในแชตกลุ่มก่อนเริ่ม' : 'ลิงก์ห้องจะเปิดให้เห็นหลังลงทะเบียน'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {eventData.meetingPoint && cleanText(eventData.meetingPoint) !== cleanText(eventData.location) && (
                    <p className="text-sm font-medium text-slate-700">
                      <span className="text-slate-500">จุดนัด </span>
                      {cleanText(eventData.meetingPoint)}
                    </p>
                  )}
                  {(publicTransitText || parkingText) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {publicTransitText && (
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-slate-500">{isSample ? 'รถสาธารณะ & รถไฟฟ้า' : 'การเดินทาง'}</p>
                          <p className="text-sm font-medium text-slate-800 leading-relaxed">{cleanText(publicTransitText)}</p>
                        </div>
                      )}
                      {parkingText && (
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-slate-500">รถยนต์ส่วนตัว & ที่จอดรถ</p>
                          <p className="text-sm font-medium text-slate-800 leading-relaxed">{cleanText(parkingText)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative w-full h-60 sm:h-72 rounded-3xl overflow-hidden bg-slate-100">
                    <iframe
                      title={`Google Map - ${cleanText(eventData.title)}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(eventData.location)}&hl=th&z=15&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </>
              )}
            </section>

            {/* Questions to the host, once the plan and the meeting point are read (owner 2026-10-24) */}
            <EventQuestions
              eventId={eventData.id}
              initial={initialQuestions}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => askToJoin('เพื่อถามคนจัด', `/community/${encodeURIComponent(eventData.id)}#questions`)}
            />

            <EventAttendees
              src={`/api/events/${encodeURIComponent(eventData.id)}/attendees`}
              total={eventData.participantsCount}
              hostName={eventData.hostName}
              hostAvatar={eventData.hostAvatar}
              hostHref={profileHref}
              refreshKey={`${isJoined}-${eventData.participantsCount}`}
            />
          </div>
        </div>

        <RelatedCards title="ตี้ที่คุณอาจสนใจ" allHref="/community" items={relatedActivities.map(teeCard)} />

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
                  activePhotoIndex === idx ? 'border-[#F26430] scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
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
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        returnTo={membershipReturnTo ?? (pendingAction === 'join' ? joinReturnPath : undefined)}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          setIsAuthModalOpen(false);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);

          // Seamlessly fulfill pending user action after login
          if (pendingAction === 'join') {
            setTimeout(() => {
              setIsConfirmJoinModalOpen(true);
            }, 300);
          } else if (pendingAction === 'create') {
            setTimeout(() => {
              setIsCreateEventModalOpen(true);
            }, 300);
          } else if (pendingAction?.startsWith('favorite:') && eventData) {
            const evId = pendingAction.replace('favorite:', '');
            setTimeout(() => {
              toggleFavorite(evId);
            }, 300);
          }
          setPendingAction(null);
        }}
      />

      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        returnTo={pendingAction === 'join' ? joinReturnPath : undefined}
        onClose={() => {
          setIsRequireMembershipOpen(false);
          setPendingAction(null);
        }}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          setFavorites([]);
          setJoinedEventIds([]);
          // Close all authenticated and pending modals on logout
          setIsETicketOpen(false);
          setIsChatOpen(false);
          setIsConfirmJoinModalOpen(false);
          setIsCancelModalOpen(false);
          setIsCreateEventModalOpen(false);
          setPendingAction(null);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`ตั้งตี้ "${newEvent.title}" สำเร็จแล้ว! 🎉`);
          }
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
            className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg sm:max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-left space-y-5 animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="ยืนยันการลงทะเบียน"
          >
            {/* Top Bar: Category Pill & Close Button */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F26430] text-xs font-bold tracking-wide">
                <span>ตี้</span>
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
              <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
                ยืนยันการลงทะเบียน
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                ร่วมตี้และพบปะเพื่อนใหม่ในบรรยากาศที่เป็นกันเองและปลอดภัย
              </p>
            </div>

            {/* Editorial Reservation Pass Card */}
            <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4 shadow-2xs relative">
              {/* Event Title & Price Pill */}
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {cleanText(eventData.title)}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                  parsedPrice.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {parsedPrice.displayPrice}
                </span>
              </div>

              {/* Tier Pills if multiple */}
              {parsedPrice.hasMultipleTiers && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedPrice.tiers.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-md border bg-white text-slate-800 border-slate-200 shadow-2xs"
                    >
                      {t.label ? `${t.label}: ` : ''}{t.price}
                    </span>
                  ))}
                </div>
              )}

              {/* Clean Key-Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 font-medium pt-1">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#F26430] shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">วันที่จัด:</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#F26430] shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">ช่วงเวลา:</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">สถานที่นัดพบ:</span>
                    <span className="font-bold text-slate-900 leading-relaxed">{cleanText(eventData.location)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <User className="w-4 h-4 text-[#F26430] shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">ผู้จัด:</span>
                    <span className="font-bold text-slate-900">{eventData.hostName || 'Verified Community Host'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F26430]" />
                  </div>
                </div>
              </div>

              {/* Perforated Divider & E-Ticket Guarantee */}
              <div className="border-t border-dashed border-slate-200 pt-3.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span>ระบบจะสร้าง <strong>QR E-Ticket</strong> และบันทึกเข้าหน้า <strong>MyHub</strong> ให้อัตโนมัติ</span>
                </div>
              </div>
            </div>

            {/* What the account still needs, said before the button rather than as a refusal after it */}
            {hostCheckMember && <JoinReadinessNotice member={hostCheckMember} returnTo={joinReturnPath} />}

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
                disabled={Boolean(joinBlocker(hostCheckMember))}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-2xs hover:shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>ยืนยันการเข้าร่วม</span>
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
              const nextCheckedIn = !isCheckedIn;
              setIsCheckedIn(nextCheckedIn);
              showToast(nextCheckedIn ? 'เช็คอินหน้างานเรียบร้อย ยินดีต้อนรับค่ะ! 🎉' : 'ยกเลิกการจำลองเช็คอินเรียบร้อย');
            }}
            onOpenChat={() => setIsChatOpen(true)}
          />
          <GroupChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} event={eventData} />
          {pairChat && <GroupChatModal isOpen onClose={() => setPairChat(null)} event={eventData} roomId={pairChat.roomId} roomTitle={pairChat.title} />}
          <CancelTicketModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            event={eventData}
            ticketId={`TICK-${eventData.id}`}
            onConfirmCancel={handleConfirmCancel}
          />
          <ReportSafetyModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetType="community"
            targetId={eventData.id}
            targetTitle={eventData.title}
          />
        </>
      )}

      {/* Phones and tablets: when, seats, save, share and the one main button stay in reach */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {eventData.scheduleType === 'recurring' && eventData.recurrence?.customSummary
                ? eventData.recurrence.customSummary
                : `${cleanText(eventData.date)} · ${cleanText(eventData.time).split(/\s*[-–]\s*/)[0]}`}
            </p>
            <p className={`text-[11px] sm:text-xs font-bold truncate ${
              isEnded ? 'text-slate-500' : isJoined ? 'text-emerald-700' : fillRatio >= 1 ? 'text-rose-600' : isAlmostFull ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {isEnded
                ? 'ตี้นี้จบแล้ว'
                : isHost
                ? 'คุณเป็นผู้จัดตี้นี้'
                : isJoined
                ? 'คุณลงทะเบียนแล้ว'
                : fillRatio >= 1
                ? 'ที่นั่งเต็มแล้ว'
                : `เหลืออีก ${Math.max(eventData.maxParticipants - eventData.participantsCount, 0)} ที่`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(eventData.id)}
            aria-label={isFav ? 'เอาออกจากที่บันทึก' : 'บันทึกตี้'}
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${isFav ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-[#F26430] text-[#F26430]' : 'text-slate-600'}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="แชร์ตี้"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
          </button>
          {isEnded ? (
            <button type="button" disabled className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs sm:text-sm font-bold shrink-0 cursor-not-allowed">
              สิ้นสุดแล้ว
            </button>
          ) : fillRatio >= 1 && !isJoined ? (
            <button type="button" disabled className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs sm:text-sm font-bold shrink-0 cursor-not-allowed">
              ที่นั่งเต็มแล้ว
            </button>
          ) : (
            <button
              type="button"
              onClick={isHost ? () => setIsChatOpen(true) : isJoined ? () => setIsETicketOpen(true) : handleJoinEvent}
              className={isJoined || isHost
                ? 'px-4 py-2.5 rounded-full border-[1.5px] border-[#2563EB] bg-white text-[#1D4ED8] text-sm font-semibold shrink-0 cursor-pointer active:scale-95'
                : 'px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shrink-0 cursor-pointer active:scale-95'}
            >
              {isHost ? 'แชตกับคนในตี้' : isJoined ? 'ดูบัตร' : 'ลงทะเบียน'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
