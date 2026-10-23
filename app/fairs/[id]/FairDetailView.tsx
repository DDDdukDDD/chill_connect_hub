'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { useAuth } from '@/lib/useAuth';
import { VisitPanel } from '@/components/VisitPanel';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { GroupChatModal } from '@/components/GroupChatModal';
import {
  getEventById,
  getRelatedEvents,
  EventItem,
  MOCK_EVENTS
} from '@/data/mockData';
import { eventOrigin } from '@/lib/contentOrigin';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { resolveEventGallery } from '@/lib/eventImageResolver';
import { parseEventPrice } from '@/lib/priceUtils';
import { renderDescriptionContent, stripHtmlToPlainText } from '@/components/RichTextEditor';
import { SpotBuddyGatheringModal, SpotBuddyPostItem } from '@/components/SpotBuddyGatheringModal';
import { ExpoMeetupPassModal, ExpoMeetupPassData } from '@/components/ExpoMeetupPassModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { EventGrid } from '@/components/EventGrid';
import { DetailHero, PillarChip, StatusChip, heroButton } from '@/components/detail/DetailHero';
import { PillarLinks } from '@/components/detail/PillarLinks';
import { VisitReviews } from '@/components/detail/VisitReviews';

export interface FairSubActivityItem {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  meetupPoint: string;
  time: string;
  currentMembers: number;
  maxMembers: number;
  note: string;
  contactChannel?: string;
}
import {
  MapPin,
  Clock,
  Calendar,
  Heart,
  BookMarked,
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
  Flag,
  Globe,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Layers,
  Plus,
  Compass,
  CalendarPlus,
  Ticket
} from 'lucide-react';

// Helper to strip rogue emojis for clean, editorial typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/** The page itself: `initialEvent` comes from the server page, so the content is in the HTML search engines read. */
export default function FairDetailPage({ initialEvent = null }: { initialEvent?: EventItem | null }) {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('events');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Favorites state
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToCalendar, setIsSavedToCalendar] = useState(false);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Dynamic Event State (Immediate sync for SSR & mock events)
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

  // Fair Expo Buddy Gathering Modal
  const [isFairBuddyModalOpen, setIsFairBuddyModalOpen] = useState(false);

  // Sub-activities for this Fair
  // Meet-up groups members opened inside this fair, from the server
  const [fairSubActivities, setFairSubActivities] = useState<FairSubActivityItem[]>([]);
  const [chatGroup, setChatGroup] = useState<{ id: string; title: string } | null>(null);

  const [joinedSubIds, setJoinedSubIds] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [selectedPassData, setSelectedPassData] = useState<ExpoMeetupPassData | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  type ServerGroup = { id: string; title: string; meetupPoint: string; time: string; note: string; maxMembers: number; currentMembers: number; creator: { displayName: string; avatarUrl: string }; isJoined: boolean };
  const applyGroups = (groups: ServerGroup[]) => {
    setFairSubActivities(
      groups.map((g) => ({ id: g.id, title: g.title, creatorName: g.creator.displayName, creatorAvatar: g.creator.avatarUrl, meetupPoint: g.meetupPoint, time: g.time, currentMembers: g.currentMembers, maxMembers: g.maxMembers, note: g.note }))
    );
    setJoinedSubIds(groups.filter((g) => g.isJoined).map((g) => g.id));
  };
  const groupRequest = async (method: 'GET' | 'POST', body?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(decodedId)}/groups`, { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => null);
      if (json?.groups) applyGroups(json.groups);
      return { ok: res.ok && json?.success !== false, message: (json?.message as string) || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', json };
    } catch {
      return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ', json: null };
    }
  };

  // Groups reload when the member signs in or out; what the member joined comes from the account
  const myActivity = useMyActivity();
  const favorites = isLoggedIn ? myActivity.savedEventIds : [];
  useEffect(() => {
    void groupRequest('GET');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- groupRequest only depends on the fair id
  }, [decodedId, isLoggedIn]);
  useEffect(() => {
    if (myActivity.isLoaded) setJoinedEventIds(myActivity.joinedIds);
  }, [myActivity.isLoaded, myActivity.joinedIds]);

  // Retrieve event from mock and live API
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
      .catch((err) => console.error('Error fetching live fair events:', err))
      .finally(() => setIsLoading(false));
  }, [decodedId, initialEvent]);

  // Gallery Photos (5-6 atmospheric Expo / Hall images)
  const galleryImages: string[] = useMemo(() => {
    if (!eventData) return [];
    return resolveEventGallery(eventData);
  }, [eventData]);

  // Editorial Price & Ticket Tier Breakdown
  const parsedPrice = useMemo(() => {
    return parseEventPrice(eventData?.price, 'เข้าชมฟรี');
  }, [eventData?.price]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกงานนี้ลง MyHub');
      setPendingAction(`favorite:${eventId}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    // Hearts are saved on the account, the same list My Hub shows under "งานที่บันทึกไว้"
    const wasSaved = favorites.includes(eventId);
    void activityActions.setSaved('event', eventId, !wasSaved).then((ok) => {
      if (!ok) return showToast('บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
      const isTargetEnded = eventId === eventData?.id ? isEnded : false;
      showToast(wasSaved ? 'ลบออกจากรายการบันทึกแล้ว' : isTargetEnded ? 'เพิ่มเข้าคลังเพื่อติดตามรอบถัดไปเรียบร้อย' : 'บันทึกงานแฟร์นี้ใน MyHub เรียบร้อย');
    });
  };

  // "บันทึกงานนี้ลง MyHub": an upcoming fair joins the member's schedule in My Hub (the account's joined list);
  // a fair that has ended can only be kept to follow its next round, which is a saved event
  const toggleInHub = () => {
    if (!eventData) return;
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกงานนี้ลง MyHub');
      setPendingAction(`hub:${eventData.id}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    if (isEnded) return toggleFavorite(eventData.id);
    const id = eventData.id;
    const wasIn = joinedEventIds.includes(id);
    void (wasIn ? activityActions.leave(id) : activityActions.join(id)).then((result) => {
      if (!result.ok) return showToast(result.message);
      showToast(wasIn ? 'นำออกจาก MyHub แล้ว' : 'บันทึกงานแฟร์นี้ใน MyHub เรียบร้อย');
    });
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !eventData) return;
    const url = window.location.href;
    const shareData = {
      title: `${eventData.title} | Chill & Connect Hub`,
      text: `ชวนไปงานแฟร์นี้: ${eventData.title} (${eventData.date} @ ${eventData.location})`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('แชร์งานเรียบร้อย');
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์งานแฟร์เรียบร้อย');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('คัดลอกลิงก์เรียบร้อย');
    }
  };

  const handleSaveToCalendar = () => {
    if (!eventData) return;
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      eventData.title
    )}&dates=20260328T030000Z/20260328T120000Z&details=${encodeURIComponent(
      `งานแฟร์: ${eventData.title}\nสถานที่: ${eventData.location}\nข้อมูลเพิ่มเติม: ${typeof window !== 'undefined' ? window.location.href : ''}`
    )}&location=${encodeURIComponent(eventData.location)}`;

    window.open(googleCalendarUrl, '_blank');
    setIsSavedToCalendar(true);
    showToast('เปิดบันทึกลง Google Calendar เรียบร้อย');
  };

  const handleJoinSubActivity = async (sub: FairSubActivityItem) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อขอร่วมกลุ่มเดินชมงานนี้');
      setPendingAction(`join_sub:${sub.id}`);
      setIsRequireMembershipOpen(true);
      return;
    }

    const isJoined = joinedSubIds.includes(sub.id);

    if (isJoined) {
      // Re-open existing pass
      setSelectedPassData({
        id: sub.id,
        fairTitle: cleanText(eventData?.title) || 'งานมหกรรม & เอ็กซ์โป',
        fairLocation: cleanText(eventData?.location) || 'ศูนย์นิทรรศการ',
        fairDate: cleanText(eventData?.date) || 'วันจัดแสดง',
        groupTitle: sub.title,
        meetupPoint: sub.meetupPoint,
        time: sub.time,
        creatorName: sub.creatorName,
        creatorAvatar: sub.creatorAvatar,
        contactChannel: sub.contactChannel,
        note: sub.note,
        currentMembers: sub.currentMembers,
        maxMembers: sub.maxMembers
      });
      setIsPassModalOpen(true);
    } else {
      if (sub.currentMembers >= sub.maxMembers) {
        showToast('กลุ่มนี้มีผู้เข้าร่วมครบจำนวนแล้ว');
        return;
      }

      // The server checks the seats and the member's account
      const joined = await groupRequest('POST', { action: 'join', groupId: sub.id });
      if (!joined.ok) {
        showToast(joined.message);
        return;
      }
      const updatedCount = sub.currentMembers + 1;

      setSelectedPassData({
        id: sub.id,
        fairTitle: cleanText(eventData?.title) || 'งานมหกรรม & เอ็กซ์โป',
        fairLocation: cleanText(eventData?.location) || 'ศูนย์นิทรรศการ',
        fairDate: cleanText(eventData?.date) || 'วันจัดแสดง',
        groupTitle: sub.title,
        meetupPoint: sub.meetupPoint,
        time: sub.time,
        creatorName: sub.creatorName,
        creatorAvatar: sub.creatorAvatar,
        contactChannel: sub.contactChannel,
        note: sub.note,
        currentMembers: updatedCount,
        maxMembers: sub.maxMembers
      });
      setIsPassModalOpen(true);
      showToast(`ขอแจมกลุ่ม "${sub.title}" สำเร็จ เปิดตั๋วนัดพบแล้ว`);
    }
  };

  const handleCancelJoinSubActivity = async (groupId: string) => {
    const left = await groupRequest('POST', { action: 'leave', groupId });
    if (!left.ok) {
      showToast(left.message);
      return;
    }

    setIsPassModalOpen(false);
    showToast('ยกเลิกการเข้าร่วมกลุ่มเดินงานแล้ว');
  };

  const handleBuddyModalSuccess = async (newTrip: SpotBuddyPostItem) => {
    const created = await groupRequest('POST', {
      action: 'create',
      title: newTrip.title,
      meetupPoint: newTrip.meetingPoint || 'จุดนัดพบในงาน',
      time: newTrip.time,
      note: stripHtmlToPlainText(newTrip.description),
      maxMembers: newTrip.maxParticipants || 4,
    });
    showToast(created.ok ? `เปิดกลุ่มนัดเดินงาน "${newTrip.title}" แล้ว` : created.message);
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

  // member = an organizer posted it here, source = imported from an official website, sample = seed data.
  // Placeholder text is for seed data only.
  const origin = eventData ? eventOrigin(eventData) : 'sample';
  const isSample = origin === 'sample';

  const fairHighlights = useMemo(() => {
    if (!isSample) return [];
    return [
      'นิทรรศการและมหกรรมจัดแสดงผลงานระดับประเทศ รวมแบรนด์และผู้เชี่ยวชาญชั้นนำ',
      'เวทีกิจกรรมสัมมนา เปิดมุมมอง และแลกเปลี่ยนองค์ความรู้สร้างสรรค์ใหม่ๆ ตลอดงาน',
      'โซนเวิร์กช็อปและกิจกรรมสัมผัสประสบการณ์จริง (Hands-on Interactive Showcase)',
      'พื้นที่พักผ่อน คาเฟ่ Slow Bar และโซนอาหารรองรับผู้เข้าร่วมงานอย่างทั่วถึง',
      'การเดินทางสะดวกสบายด้วยทางเชื่อมรถไฟฟ้า MRT / BTS Skywalk และที่จอดรถในร่มขนาดใหญ่'
    ];
  }, [isSample]);

  // Hall & Transit breakdown
  const { publicTransitText, parkingText, venueOrganizerName, officialWebsiteUrl } = useMemo(() => {
    if (!eventData) return { publicTransitText: '', parkingText: '', venueOrganizerName: '', officialWebsiteUrl: null };
    const loc = eventData.location || '';
    
    let organizer = eventData.source || 'ผู้จัดงานทางการ (Official Partner)';
    let website = eventData.externalUrl || eventData.sourceUrl || null;
    // Facts about the four known halls are kept for every event held there; the generic lines are filler
    let transit = isSample ? 'เดินทางสะดวกด้วยรถไฟฟ้า BTS / MRT และรถประจำทาง' : '';
    let parking = isSample ? 'มีอาคารจอดรถรองรับผู้เข้าร่วมงาน พร้อมสิ่งอำนวยความสะดวกครบครัน' : '';

    if (loc.includes('สิริกิติ์') || loc.includes('QSNCC')) {
      organizer = 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)';
      website = website || 'https://www.qsncc.com/en/whats-on/event-calendar';
      transit = 'รถไฟฟ้า MRT สถานีศูนย์การประชุมแห่งชาติสิริกิติ์ ทางออก 3 เดินเชื่อมเข้าสู่อาคารโดยตรง';
      parking = 'อาคารจอดรถใต้ดินรองรับมากกว่า 3,000 คัน พร้อมจุดชาร์จรถยนต์ไฟฟ้า EV ชั้น B1 และ B2';
    } else if (loc.includes('ไบเทค') || loc.includes('BITEC')) {
      organizer = 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา';
      website = website || 'https://www.bitec.co.th/events';
      transit = 'รถไฟฟ้า BTS สถานีบางนา ทางออก 1 เดินผ่าน Skywalk เชื่อมเข้าสู่อาคารนิทรรศการไบเทค';
      parking = 'ลานจอดรถในร่มและกลางแจ้งรองรับมากกว่า 5,000 คัน มีจุดจอดรถบัสและ EV Charger';
    } else if (loc.includes('อิมแพ็ค') || loc.includes('IMPACT')) {
      organizer = 'อิมแพ็ค เมืองทองธานี';
      website = website || 'https://www.impact.co.th';
      transit = 'รถไฟฟ้า MRT สายสีชมพู สถานีอิมแพ็ค เมืองทองธานี / รถตู้สาธารณะและรถโดยสารปรับอากาศ';
      parking = 'อาคารจอดรถ P1, P2, P3 และลานจอดรอบอาคารชาเลนเจอร์ รองรับมากกว่า 10,000 คัน';
    } else if (loc.includes('พารากอน') || loc.includes('Paragon')) {
      organizer = 'รอยัล พารากอน ฮอลล์ (สยามพารากอน)';
      website = website || 'https://www.royalparagonhall.com';
      transit = 'รถไฟฟ้า BTS สถานีสยาม ทางออก 3 และ 5 เดินเชื่อมเข้าสู่ศูนย์การค้าสยามพารากอน ชั้น 5';
      parking = 'อาคารจอดรถสยามพารากอนและสยามเซ็นเตอร์';
    }

    // An organizer who posted the fair is named as they wrote it; an imported fair names where it was read from
    if (origin === 'member') organizer = eventData.hostName || organizer;
    else if (origin === 'source') organizer = eventData.source || organizer;

    return { publicTransitText: transit, parkingText: parking, venueOrganizerName: organizer, officialWebsiteUrl: website };
  }, [eventData, origin, isSample]);

  // Related Fairs
  const relatedFairs = useMemo(() => {
    if (!eventData) return [];
    return getRelatedEvents(eventData, 40).filter((event) => !isEventEnded(event)).slice(0, 5);
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
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-[#2B527A]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ไม่พบข้อมูลงานอีเวนต์หรือนิทรรศการนี้</h1>
          <p className="text-sm text-slate-600">งานนี้อาจสิ้นสุดลงแล้วหรือถูกย้ายออกจากระบบ</p>
          <Link
            href="/fairs"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้างามหกรรม & เอ็กซ์โป</span>
          </Link>
        </main>
      </div>
    );
  }

  const isEnded = isEventEnded(eventData);
  // In My Hub: on the schedule while the fair is ahead, kept to follow once it has ended
  const isFav = isEnded ? favorites.includes(eventData.id) : joinedEventIds.includes(eventData.id);
  // Started and not ended: "กำลังจัดอยู่" (the landing's fair list uses the same rule)
  const isOngoing = !isEnded && parseEventDateToTimestamp(eventData.date) <= Date.now();

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#2B527A] selection:text-white">
      
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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-1.5 pb-28 sm:pt-2 sm:pb-12 space-y-3 sm:space-y-4">
        
        {/* =========================================================================
            TOP BREADCRUMBS & ACTION BAR
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1.5 border-b border-slate-100">
          
          {/* Left: Clean Breadcrumbs */}
          <nav className="text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 py-1 min-w-0">
            <Link href="/" className="hover:text-[#2B527A] transition-colors font-semibold py-1 px-1">หน้าแรก</Link>
            <span>/</span>
            <Link
              href="/fairs"
              className="hover:text-[#2B527A] transition-colors py-1 px-1 font-semibold text-sky-800"
            >
              งานมหกรรม & เอ็กซ์โป
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold py-1 px-1">{cleanText(venueOrganizerName)}</span>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-[180px] sm:max-w-[280px] py-1 px-1">{cleanText(eventData.title)}</span>
          </nav>

          {/* Right: Favorite & Share Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleInHub}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                isFav
                  ? 'bg-sky-50 text-[#2B527A] border-sky-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:text-[#2B527A]'
              }`}
            >
              <BookMarked className={`w-3.5 h-3.5 ${isFav ? 'text-[#2B527A]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {isFav
                  ? isEnded
                    ? 'บันทึกในคลัง MyHub แล้ว'
                    : 'บันทึกใน MyHub แล้ว'
                  : isEnded
                  ? 'ติดตามรอบถัดไป'
                  : 'บันทึกงานนี้'}
              </span>
              <span className="sm:hidden">
                {isFav ? 'บันทึกแล้ว' : isEnded ? 'ติดตาม' : 'บันทึก'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#2B527A] text-xs font-bold transition-all shadow-2xs border border-slate-200 hover:border-sky-200 cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>แชร์งาน</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* =========================================================================
            HEADER: photo left, what is needed to decide and the one main action right (shared with
            meetups, places and challenges: components/detail/DetailHero.tsx). Fairs show no head count.
           ========================================================================= */}
        <DetailHero
          pillar="fair"
          image={galleryImages[0] || eventData.image}
          imageAlt={`${cleanText(eventData.title)} บรรยากาศงาน`}
          photoCount={galleryImages.length}
          onOpenPhotos={() => {
            setActivePhotoIndex(0);
            setIsLightboxOpen(true);
          }}
          chips={
            <>
              <PillarChip pillar="fair">{cleanText(eventData.tag) || 'งานแฟร์'}</PillarChip>
              {isEnded ? (
                <StatusChip tone="muted">งานจบแล้ว</StatusChip>
              ) : isOngoing ? (
                <StatusChip tone="live">กำลังจัดอยู่</StatusChip>
              ) : (
                <StatusChip tone="muted">เร็วๆ นี้</StatusChip>
              )}
            </>
          }
          title={cleanText(eventData.title)}
          facts={[
            { icon: Calendar, title: cleanText(eventData.date), sub: cleanText(eventData.time) },
            { icon: MapPin, title: cleanText(eventData.location) },
            { icon: Ticket, title: parsedPrice.displayPrice },
            { icon: Building2, title: <>จัดโดย {venueOrganizerName}</> },
          ]}
          actions={
            <>
              <button type="button" onClick={toggleInHub} aria-pressed={isFav} className={isFav ? heroButton.done : heroButton.primary}>
                {isFav ? <Check className="w-5 h-5" aria-hidden="true" /> : <BookMarked className="w-5 h-5" aria-hidden="true" />}
                {isFav ? 'บันทึกแล้ว' : isEnded ? 'ติดตามงานรอบหน้า' : 'บันทึกงานนี้'}
              </button>
              {officialWebsiteUrl && (
                <a href={officialWebsiteUrl} target="_blank" rel="noopener noreferrer" className={heroButton.secondary}>
                  {parsedPrice.isFree ? <Globe className="w-5 h-5" aria-hidden="true" /> : <Ticket className="w-5 h-5" aria-hidden="true" />}
                  {parsedPrice.isFree ? 'เว็บไซต์งาน' : 'ซื้อบัตร'}
                  <ExternalLink className="w-4 h-4 opacity-60" aria-hidden="true" />
                </a>
              )}
            </>
          }
          note={!isEnded && !isFav ? 'บันทึกไว้ แล้วเราจะเตือนก่อนวันงาน' : undefined}
        />

        {/* The challenge this counts toward and the moments people shared */}
        <PillarLinks target={{ type: 'fair', id: eventData.id, title: cleanText(eventData.title) }} momentsNoun="งานนี้" />

        {/* =========================================================================
            CORE CONTENT: 2-COLUMN EDITORIAL LAYOUT
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start pt-3">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols) */}
          <div className="lg:col-span-2 space-y-7">
            
            {/* Official Partner Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-[#2B527A]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{venueOrganizerName}</h3>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
                      {origin === 'member' ? 'ผู้จัดงานลงประกาศเอง' : origin === 'source' ? 'ข้อมูลจากแหล่งทางการ' : 'Official Venue & Partner'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {origin === 'member'
                      ? 'ผู้จัดงานที่ยืนยันตัวตนแล้ว • ตรวจโดยทีมงาน Chill & Connect Hub ก่อนเผยแพร่'
                      : origin === 'source'
                        ? 'ทีมงานรวบรวมจากเว็บไซต์ทางการของผู้จัดหรือสถานที่ • ตรวจรายละเอียดล่าสุดที่เว็บไซต์งานก่อนเดินทาง'
                        : 'งานแฟร์ทางการ • คัดสรรและตรวจสอบข้อมูลโดย Chill & Connect Hub'}
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
                    <span>เว็บไซต์งาน</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="รายงานข้อมูลไม่ถูกต้อง"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. About the Fair / Story */}
            <div className="space-y-3 pt-1">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                เกี่ยวกับงานและนิทรรศการนี้
              </h2>
              {renderDescriptionContent(eventData.description)}
            </div>

            {/* Ticket & Admission Breakdown Section (If multiple tiers) */}
            {parsedPrice.hasMultipleTiers && (
              <div className="space-y-3.5 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <Ticket className="w-5 h-5 text-[#2B527A]" />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    ผังราคาและประเภทบัตรเข้าชม
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                    ช่วงราคา {parsedPrice.displayPrice}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {parsedPrice.tiers.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-center flex flex-col justify-center transition-all ${
                        t.isOnline
                          ? 'bg-gradient-to-b from-amber-50/50 to-white border-amber-200/70 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:shadow-2xs'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-slate-500 block truncate">
                        {t.label || (t.isOnline ? 'ออนไลน์' : 'บัตรเข้าชม')}
                      </span>
                      <span className="text-base font-bold text-slate-900 mt-0.5">
                        {t.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Verified Highlights */}
            {fairHighlights.length > 0 && (
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                จุดเด่น & ไฮไลต์ที่ไม่ควรพลาดในงาน
              </h2>
              <ul className="space-y-3 pt-1">
                {fairHighlights.map((h, idx) => (
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
            )}

            {/* 6. Hall Transit & Parking */}
            {(publicTransitText || parkingText) && (
            <div className="space-y-4 pt-5 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                การเดินทางเข้าศูนย์นิทรรศการ & ที่จอดรถ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    รถไฟฟ้า MRT / BTS & ทางเชื่อมอาคาร
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(publicTransitText)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    อาคารจอดรถ & จุดชาร์จ EV
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(parkingText)}
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* 7. Interactive Google Maps */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  พิกัดแผนที่ศูนย์นิทรรศการ
                </h3>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2B527A] hover:underline shrink-0"
                >
                  <span>เปิดดูใน Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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

            {/* Ratings and tips from people who went (the "จบ" phase of a fair) */}
            <div className="pt-5 border-t border-slate-100">
              <VisitReviews targetType="fair" targetId={eventData.id} isLoggedIn={isLoggedIn} />
            </div>

            {/* 8. Sub-Activities: กลุ่มนัดเดินดูงาน & หาเพื่อนแวะจิบกาแฟ (Relocated Under Map) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      กลุ่มนัดเดินดูงาน & หาเพื่อนแวะจิบกาแฟ
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      {fairSubActivities.length} กลุ่มนัดหมาย
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium pt-0.5">
                    ไปคนเดียวไม่ต้องกลัวเหงา มารวมกลุ่มหน้าบูธ หรือตั้งกลุ่มชวนเพื่อนเดินโซนที่ชอบได้เลย
                  </p>
                </div>

                {isEnded ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold cursor-not-allowed shrink-0"
                  >
                    <span>ปิดรับการนัดหมาย (งานสิ้นสุดแล้ว)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        setMembershipActionTitle('เพื่อสร้างกลุ่มนัดเดินงาน');
                        setPendingAction('create_sub_trip');
                        setIsRequireMembershipOpen(true);
                      } else {
                        setIsFairBuddyModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>สร้างกลุ่มนัดเดินงาน</span>
                  </button>
                )}
              </div>

              {/* Sub-Activities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {fairSubActivities.map((sub) => {
                  const isJoined = joinedSubIds.includes(sub.id);
                  const isFull = sub.currentMembers >= sub.maxMembers;
                  const availableSlots = Math.max(0, sub.maxMembers - sub.currentMembers);

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                        isJoined
                          ? 'border-sky-400 ring-2 ring-sky-300/50 shadow-md bg-gradient-to-b from-sky-50/25 to-white'
                          : 'border-slate-200/90 shadow-2xs hover:border-sky-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 truncate">
                            <MapPin className="w-3 h-3 text-sky-700 shrink-0" />
                            <span>{sub.meetupPoint}</span>
                          </span>
                          <span className={`font-bold shrink-0 px-2 py-0.5 rounded-full text-[10px] ${
                            isFull
                              ? 'bg-slate-100 text-slate-500'
                              : isJoined
                              ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                              : 'bg-sky-50 text-sky-700'
                          }`}>
                            {sub.currentMembers}/{sub.maxMembers} คน {isFull ? '(เต็มแล้ว)' : `(ว่าง ${availableSlots})`}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {sub.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {sub.note}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={sub.creatorAvatar}
                            alt={sub.creatorName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">{sub.creatorName}</span>
                            <span className="text-[10px] text-slate-400 block">นัด {sub.time}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJoinSubActivity(sub)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                            isJoined
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : isEnded
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                          }`}
                          disabled={(isFull && !isJoined) || (isEnded && !isJoined)}
                        >
                          {isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isEnded ? 'ประวัติเข้าร่วม (ดูตั๋ว)' : 'เข้าร่วมแล้ว (ดูตั๋ว)'}</span>
                            </>
                          ) : isEnded ? (
                            <span>สิ้นสุดกิจกรรม</span>
                          ) : isFull ? (
                            <span>เต็มแล้ว</span>
                          ) : (
                            <>
                              <span>ขอแจมกลุ่ม</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY SCHEDULE & ACTION CARD (1 Col) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
            
            <div className={`p-6 rounded-3xl transition-all space-y-5 ${
              isFav
                ? 'bg-gradient-to-b from-sky-50/40 via-white to-white border-2 border-sky-400 shadow-md ring-2 ring-sky-300/40'
                : 'bg-white border border-slate-200/90 shadow-sm'
            }`}>
              
              {/* Header Price & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">ค่าเข้าชมนิทรรศการ</span>
                <span className="text-base sm:text-lg font-bold text-slate-900 text-right">
                  {parsedPrice.displayPrice}
                </span>
              </div>

              {/* Multi-Tier Chips in Sidebar */}
              {parsedPrice.hasMultipleTiers && (
                <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-[#2B527A]" />
                      <span>ประเภทบัตรและราคา ({parsedPrice.tiers.length} รูปแบบ)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-36 overflow-y-auto">
                    {parsedPrice.tiers.map((t, idx) => (
                      <span
                        key={idx}
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                          t.isOnline
                            ? 'bg-amber-50 text-amber-900 border-amber-200/70'
                            : 'bg-white text-slate-800 border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        {t.label ? `${t.label}: ` : ''}{t.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Pure Retention Hero CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={toggleInHub}
                  className={`group w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                    isFav
                      ? 'bg-sky-50 text-[#2B527A] border border-sky-300 shadow-sky-900/10 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm'
                  }`}
                >
                  {isFav ? (
                    <>
                      <span className="flex items-center gap-2 group-hover:hidden">
                        <Check className="w-4 h-4 text-[#2B527A]" />
                        <span>{isEnded ? 'บันทึกในคลัง MyHub แล้ว' : 'บันทึกงานนี้ลง MyHub แล้ว'}</span>
                      </span>
                      <span className="hidden items-center gap-2 group-hover:flex text-rose-600">
                        <X className="w-4 h-4 text-rose-500" />
                        <span>{isEnded ? 'นำออกจากคลัง' : 'นำออกจาก MyHub'}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <BookMarked className="w-4 h-4 text-white" />
                      <span>{isEnded ? 'เพิ่มเข้าคลังเพื่อติดตามรอบถัดไป' : 'บันทึกงานนี้ลง MyHub'}</span>
                    </>
                  )}
                </button>

                {isFav && (
                  <Link
                    href="/myhub?type=public_venue"
                    className="text-center text-[11px] font-bold text-sky-800 hover:underline block pt-0.5"
                  >
                    <span>{isEnded ? 'ดูงานในคลัง MyHub ของคุณ' : 'ดูงานที่บันทึกไว้ใน MyHub ของคุณ'}</span>
                  </Link>
                )}
              </div>

            </div>


            {/* Moments from members here, and how to share one (same place as on the place page) */}
            <VisitPanel
              targetType="fair"
              markOpensAt={parseEventDateToTimestamp(eventData.date)}
              targetId={eventData.id}
              title={eventData.title}
              location={eventData.location}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => {
                setMembershipActionTitle('เพื่อบันทึกว่าคุณไปงานนี้มาแล้ว');
                setIsRequireMembershipOpen(true);
              }}
              onShowToast={showToast}
            />
          </div>

        </div>

        {/* =========================================================================
            RELATED FAIRS & EXPOS SECTION (REUSE STANDARD EVENTGRID)
           ========================================================================= */}
        {relatedFairs.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  งานมหกรรมและนิทรรศการที่น่าสนใจอื่นๆ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  ค้นพบอีเวนต์ระดับฮอลล์และงานแฟร์ที่กำลังจะจัดขึ้นเร็วๆ นี้
                </p>
              </div>

              <Link
                href="/fairs"
                className="text-xs font-bold text-[#2B527A] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>สำรวจงานมหกรรม & เอ็กซ์โปทั้งหมด</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <EventGrid
              events={relatedFairs}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onSelectEvent={() => {}}
              columns={5}
            />
          </section>
        )}

      </main>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-bold truncate max-w-md">
                {cleanText(eventData.title)}
              </span>
              <span className="text-xs text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-full">
                {activePhotoIndex + 1} / {galleryImages.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center py-4 select-none">
            <img
              src={galleryImages[activePhotoIndex]}
              alt={`${eventData.title} รูปที่ ${activePhotoIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
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
                  activePhotoIndex === idx ? 'border-sky-400 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
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
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);
          if (pendingAction === 'create_sub_trip') {
            setIsFairBuddyModalOpen(true);
          } else if (pendingAction && pendingAction.startsWith('hub:')) {
            toggleInHub();
          } else if (pendingAction && pendingAction.startsWith('favorite:')) {
            const targetId = pendingAction.split(':')[1];
            if (targetId) toggleFavorite(targetId);
          } else if (pendingAction && pendingAction.startsWith('join_sub:')) {
            const subId = pendingAction.split(':')[1];
            const subObj = fairSubActivities.find((s) => s.id === subId);
            if (subObj) handleJoinSubActivity(subObj);
          }
          setPendingAction(null);
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          setIsFairBuddyModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูลงาน "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`สร้างงาน "${newEvent.title}" สำเร็จแล้ว`);
          }
          setIsCreateEventModalOpen(false);
        }}
      />
      {eventData && (
        <>
          <SpotBuddyGatheringModal
            isOpen={isFairBuddyModalOpen}
            onClose={() => setIsFairBuddyModalOpen(false)}
            spotTitle={cleanText(eventData.title)}
            spotLocation={eventData.location}
            spotImage={eventData.image}
            spotId={eventData.id}
            spotProvince={eventData.province}
            mode="fair"
            onSuccess={handleBuddyModalSuccess}
          />
          <ReportSafetyModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetType="fair"
            targetId={eventData.id}
            targetTitle={eventData.title}
          />
          {selectedPassData && (
            <ExpoMeetupPassModal
              isOpen={isPassModalOpen}
              onClose={() => setIsPassModalOpen(false)}
              passData={selectedPassData}
              onCancelJoin={handleCancelJoinSubActivity}
              onOpenChat={(groupId) => setChatGroup({ id: groupId, title: selectedPassData.groupTitle })}
            />
          )}
        </>
      )}

      <GroupChatModal isOpen={Boolean(chatGroup)} onClose={() => setChatGroup(null)} event={eventData} roomId={chatGroup?.id} roomTitle={chatGroup?.title} />

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />
    </div>
  );
}
