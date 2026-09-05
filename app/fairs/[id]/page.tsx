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
  CalendarPlus
} from 'lucide-react';

// Helper to strip rogue emojis for clean, editorial typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function FairDetailPage() {
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

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToCalendar, setIsSavedToCalendar] = useState(false);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Dynamic Event State
  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-activity form in Fair
  const [showSubActivityForm, setShowSubActivityForm] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubMeetupPoint, setNewSubMeetupPoint] = useState('');
  const [newSubTime, setNewSubTime] = useState('14:00 น.');
  const [newSubMaxMembers, setNewSubMaxMembers] = useState(4);
  const [newSubNote, setNewSubNote] = useState('');

  // Sub-activities for this Fair
  const [fairSubActivities, setFairSubActivities] = useState([
    {
      id: 'fair-sub-1',
      title: 'นัดเดินดูโซนไฮไลต์ & ชมนิทรรศการพิเศษด้วยกัน',
      creatorName: 'คุณมายด์',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      meetupPoint: 'จุดนัดพบหน้า Information Counter ชั้น G',
      time: '14:00 น.',
      membersCount: '2/4 คน',
      note: 'เดินชมงานแบบสบายๆ ไม่รีบร้อน ใครมาคนเดียวมารวมกลุ่มกันได้เลยครับ'
    },
    {
      id: 'fair-sub-2',
      title: 'หาเพื่อนแวะจิบกาแฟ & พักขาโซน Cafe Lounge',
      creatorName: 'คุณน็อต',
      creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      meetupPoint: 'หน้าร้านกาแฟ Slow Bar ชั้น 1',
      time: '16:00 น.',
      membersCount: '3/5 คน',
      note: 'นั่งคุยแลกเปลี่ยนไอเดียหลังเดินดูงานเสร็จ ชิลล์ๆ ไม่เกร็งครับ'
    }
  ]);

  const [joinedSubIds, setJoinedSubIds] = useState<string[]>([]);

  // Retrieve event from mock and live API
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
      .catch((err) => console.error('Error fetching live fair events:', err))
      .finally(() => setIsLoading(false));
  }, [decodedId]);

  // Gallery Photos (5-6 atmospheric Expo / Hall images)
  const galleryImages: string[] = useMemo(() => {
    if (!eventData) return [];
    return resolveEventGallery(eventData);
  }, [eventData]);

  // Favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('favorite_events');
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
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
        showToast('ลบออกจากรายการบันทึกแล้ว');
      } else {
        updated = [...prev, eventId];
        showToast('บันทึกงานแฟร์นี้ในรายการที่สนใจเรียบร้อย! 📌');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      }
      return updated;
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
        showToast('แชร์งานเรียบร้อย! 🎉');
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์งานแฟร์แล้ว ส่งชวนเพื่อนใน LINE ได้เลย! 📋✨');
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
    showToast('เปิดบันทึกลง Google Calendar เรียบร้อย! 📅');
  };

  const handleJoinSubActivity = (subId: string, title: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    if (joinedSubIds.includes(subId)) {
      setJoinedSubIds((prev) => prev.filter((id) => id !== subId));
      showToast(`ยกเลิกการเข้าร่วมกลุ่ม "${title}" แล้ว`);
    } else {
      setJoinedSubIds((prev) => [...prev, subId]);
      showToast(`เข้าร่วมกลุ่มเดินงาน "${title}" เรียบร้อย! 🎉`);
    }
  };

  const handleCreateSubActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newSubTitle.trim() || !newSubMeetupPoint.trim()) {
      showToast('กรุณากรอกหัวข้อและจุดนัดพบให้ครบถ้วน');
      return;
    }

    const newSub = {
      id: `fair-sub-${Date.now()}`,
      title: newSubTitle.trim(),
      creatorName: 'คุณ (ผู้สร้างกลุ่ม)',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      meetupPoint: newSubMeetupPoint.trim(),
      time: newSubTime,
      membersCount: `1/${newSubMaxMembers} คน`,
      note: newSubNote.trim() || 'มาเดินดูงานด้วยกัน บรรยากาศเป็นกันเองครับ'
    };

    setFairSubActivities((prev) => [newSub, ...prev]);
    setJoinedSubIds((prev) => [...prev, newSub.id]);
    setShowSubActivityForm(false);
    setNewSubTitle('');
    setNewSubMeetupPoint('');
    setNewSubNote('');
    showToast('เปิดกลุ่มนัดเดินงานสำเร็จแล้ว! 👥✨');
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

  // Verified highlights for Public Venue & Fairs
  const fairHighlights = useMemo(() => {
    return [
      'นิทรรศการและมหกรรมจัดแสดงผลงานระดับประเทศ รวมแบรนด์และผู้เชี่ยวชาญชั้นนำ',
      'เวทีกิจกรรมสัมมนา เปิดมุมมอง และแลกเปลี่ยนองค์ความรู้สร้างสรรค์ใหม่ๆ ตลอดงาน',
      'โซนเวิร์กช็อปและกิจกรรมสัมผัสประสบการณ์จริง (Hands-on Interactive Showcase)',
      'พื้นที่พักผ่อน คาเฟ่ Slow Bar และโซนอาหารรองรับผู้เข้าร่วมงานอย่างทั่วถึง',
      'การเดินทางสะดวกสบายด้วยทางเชื่อมรถไฟฟ้า MRT / BTS Skywalk และที่จอดรถในร่มขนาดใหญ่'
    ];
  }, []);

  // Hall & Transit breakdown
  const { publicTransitText, parkingText, venueOrganizerName, officialWebsiteUrl } = useMemo(() => {
    if (!eventData) return { publicTransitText: '', parkingText: '', venueOrganizerName: '', officialWebsiteUrl: null };
    const loc = eventData.location || '';
    
    let organizer = eventData.source || 'ผู้จัดงานทางการ (Official Partner)';
    let website = eventData.externalUrl || eventData.sourceUrl || null;
    let transit = 'เดินทางสะดวกด้วยรถไฟฟ้า BTS / MRT และรถประจำทาง';
    let parking = 'มีอาคารจอดรถรองรับผู้เข้าร่วมงาน พร้อมสิ่งอำนวยความสะดวกครบครัน';

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

    return { publicTransitText: transit, parkingText: parking, venueOrganizerName: organizer, officialWebsiteUrl: website };
  }, [eventData]);

  // Related Fairs
  const relatedFairs = useMemo(() => {
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
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🏛️
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลงานอีเวนต์หรือนิทรรศการนี้</h1>
          <p className="text-sm text-slate-600">งานนี้อาจสิ้นสุดลงแล้วหรือถูกย้ายออกจากระบบ</p>
          <Link
            href="/?tab=public_venue"
            className="inline-flex items-center gap-2 bg-[#2B527A] hover:bg-[#1E3B59] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าอีเวนต์ & งานแฟร์</span>
          </Link>
        </main>
      </div>
    );
  }

  const isFav = favorites.includes(eventData.id);
  const isEnded = isEventEnded(eventData);

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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-1.5 pb-5 sm:pt-2 sm:pb-6 space-y-3 sm:space-y-4">
        
        {/* =========================================================================
            TOP BREADCRUMBS & ACTION BAR
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1.5 border-b border-slate-100">
          
          {/* Left: Clean Breadcrumbs */}
          <nav className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#2B527A] transition-colors font-semibold py-2 px-1">หน้าแรก</Link>
            <span className="py-2">/</span>
            <Link
              href="/?tab=public_venue"
              className="hover:text-[#2B527A] transition-colors py-2 px-1 font-semibold text-sky-800"
            >
              อีเวนต์ & งานแฟร์
            </Link>
            <span className="py-2">/</span>
            <span className="text-slate-700 font-semibold py-2 px-1">{cleanText(venueOrganizerName)}</span>
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
              <span>{isFav ? 'บันทึกแล้ว' : 'บันทึกงานนี้'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#2B527A] text-xs font-bold transition-all shadow-2xs border border-slate-200 hover:border-sky-200 cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-extrabold">คัดลอกลิงก์แล้ว!</span>
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
            EDITORIAL 5-PHOTO MOSAIC GALLERY (Expos & Fairs)
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
                alt={`${eventData.title} บรรยากาศงาน`}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 hover:opacity-25 transition-opacity" />
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
                      <span className="font-extrabold text-xs sm:text-sm">ดูภาพบรรยากาศทั้งหมด</span>
                      <span className="text-[11px] text-slate-200 font-medium">({galleryImages.length} รูป)</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile View All Photos Button */}
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
            <span className="hidden sm:inline">คลังภาพนิทรรศการและบูท {galleryImages.length} มุมมอง</span>
          </div>

        </section>

        {/* =========================================================================
            CORE CONTENT: 2-COLUMN EDITORIAL LAYOUT
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start pt-3">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols) */}
          <div className="lg:col-span-2 space-y-7">
            
            {/* 1. Title, Venue Tag & Official Status */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>{venueOrganizerName}</span>
                </span>

                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  !eventData.price || eventData.price.includes('ฟรี')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {!eventData.price || cleanText(eventData.price).includes('ฟรี') ? 'เข้าชมฟรี' : cleanText(eventData.price)}
                </span>

                {isEnded ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    🏁 งานสิ้นสุดลงแล้ว
                  </span>
                ) : (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>กำลังเปิดจัดแสดง / กำลังจะมาถึง</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {cleanText(eventData.title)}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2B527A] shrink-0" />
                <span>
                  {eventData.province && !eventData.location.includes(eventData.province)
                    ? `${eventData.province} • ${cleanText(eventData.location)}`
                    : cleanText(eventData.location)}
                </span>
              </p>
            </div>

            {/* 2. Inline Metadata Ribbon */}
            <div className="py-3.5 px-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">วันที่จัดแสดง:</span>
                <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">เวลาเปิด-ปิด:</span>
                <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">ประเภท:</span>
                <span className="font-bold text-slate-900">มหกรรม & งานแฟร์ระดับชาติ</span>
              </div>
            </div>

            {/* 3. Official Partner Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-2xl shrink-0">
                  🏛️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{venueOrganizerName}</h3>
                    <span className="text-[10px] font-black text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
                      Official Venue & Partner
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    งานแฟร์ทางการ • คัดสรรและตรวจสอบข้อมูลโดย Chill & Connect Hub
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
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2B527A]" />
                <span>เกี่ยวกับงานและนิทรรศการนี้</span>
              </h2>
              {renderDescriptionContent(eventData.description)}
            </div>

            {/* 5. Verified Highlights */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
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

            {/* 6. Sub-Activities: ชวนรวมแก๊งเดินดูโซนในงาน (Fairs Concept) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      กลุ่มนัดเดินดูงาน & หาเพื่อนแวะจิบกาแฟ
                    </h2>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      {fairSubActivities.length} กลุ่มนัดหมาย
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium pt-0.5">
                    ไปคนเดียวไม่ต้องกลัวเหงา มารวมกลุ่มหน้าบูธ หรือตั้งกลุ่มชวนเพื่อนเดินโซนที่ชอบได้เลย
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setIsAuthModalOpen(true);
                    } else {
                      setShowSubActivityForm(!showSubActivityForm);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2B527A] hover:bg-[#1E3B59] text-white text-xs font-extrabold shadow-md shadow-sky-900/20 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างกลุ่มนัดเดินงาน</span>
                </button>
              </div>

              {/* Sub-Activity Creation Form */}
              {showSubActivityForm && (
                <form
                  onSubmit={handleCreateSubActivity}
                  className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in duration-300"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      เปิดกลุ่มนัดเพื่อนเดินงานในจุดที่สนใจ 👥
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowSubActivityForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">หัวข้อกลุ่มนัดเดิน</label>
                      <input
                        type="text"
                        placeholder="เช่น ชวนดูโซนนิยายแปล & ซื้อหนังสือ"
                        value={newSubTitle}
                        onChange={(e) => setNewSubTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-sky-600"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">จุดนัดพบในงาน / หน้าบูธ</label>
                      <input
                        type="text"
                        placeholder="เช่น หน้า Information Counter หรือเสา B02"
                        value={newSubMeetupPoint}
                        onChange={(e) => setNewSubMeetupPoint(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-sky-600"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">เวลานัดพบ</label>
                      <input
                        type="text"
                        placeholder="เช่น 14:30 น."
                        value={newSubTime}
                        onChange={(e) => setNewSubTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-sky-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">จำนวนคนที่เปิดรับ (คน)</label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={newSubMaxMembers}
                        onChange={(e) => setNewSubMaxMembers(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-sky-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">โน้ตเพิ่มเติม</label>
                    <input
                      type="text"
                      placeholder="เช่น เดินชิลล์ๆ ไม่รีบ แวะพักจิบเครื่องดื่มระหว่างทาง"
                      value={newSubNote}
                      onChange={(e) => setNewSubNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-sky-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSubActivityForm(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#2B527A] text-white text-xs font-bold shadow-md active:scale-95"
                    >
                      เปิดกลุ่มนัดหมาย
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-Activities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {fairSubActivities.map((sub) => {
                  const isJoined = joinedSubIds.includes(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-black text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                            📍 {sub.meetupPoint}
                          </span>
                          <span className="font-bold text-slate-500">
                            {sub.membersCount}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
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
                          onClick={() => handleJoinSubActivity(sub.id, sub.title)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                            isJoined
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#2B527A] hover:bg-[#1E3B59] text-white shadow-2xs'
                          }`}
                        >
                          {isJoined ? '✓ เข้าร่วมแล้ว' : 'ขอแจมกลุ่ม'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Hall Transit & Parking */}
            <div className="space-y-4 pt-5 border-t border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
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

            {/* 8. Interactive Google Maps */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
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

          </div>

          {/* RIGHT COLUMN: STICKY SCHEDULE & ACTION CARD (1 Col) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              
              {/* Header Price & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">ค่าเข้าชมนิทรรศการ</span>
                <span className="text-lg font-black text-slate-900">
                  {eventData.price && !eventData.price.includes('ฟรี') ? eventData.price : '🎉 เข้าชมฟรี'}
                </span>
              </div>

              {/* Date & Time Summary */}
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#2B527A] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">วันที่จัดแสดง</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.date)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#2B527A] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">เวลาเปิด-ปิด</span>
                    <span className="font-bold text-slate-900">{cleanText(eventData.time)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#2B527A] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">สถานที่จัดงาน</span>
                    <span className="font-bold text-slate-900 leading-snug">{cleanText(eventData.location)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToCalendar}
                  className="w-full bg-[#2B527A] hover:bg-[#1E3B59] text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-sky-900/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{isSavedToCalendar ? 'บันทึกลงปฏิทินแล้ว ✓' : 'บันทึกลงปฏิทิน (Google / iCal)'}</span>
                </button>

                {officialWebsiteUrl && (
                  <a
                    href={officialWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>ไปที่เว็บไซต์ผู้จัดงานทางการ</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================================
            RELATED FAIRS & EXPOS SECTION
           ========================================================================= */}
        {relatedFairs.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  งานมหกรรมและนิทรรศการที่น่าสนใจอื่นๆ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  ค้นพบอีเวนต์ระดับฮอลล์และงานแฟร์ที่กำลังจะจัดขึ้นเร็วๆ นี้
                </p>
              </div>

              <Link
                href="/?tab=public_venue"
                className="text-xs font-extrabold text-[#2B527A] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>ดูงานแฟร์ทั้งหมด</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedFairs.map((item) => (
                <Link
                  key={item.id}
                  href={`/fairs/${encodeURIComponent(item.id)}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-[#2B527A] shadow-md border border-white/20 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                      🏛️ อีเวนต์ & งานแฟร์
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#2B527A] transition-colors line-clamp-2 leading-snug">
                        {cleanText(item.title)}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                        <span className="truncate">{cleanText(item.location)}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>{cleanText(item.date)}</span>
                      <span className="font-bold text-sky-800">
                        {item.price && !item.price.includes('ฟรี') ? item.price : 'เข้าฟรี'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-black truncate max-w-md">
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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirmLogout={() => handleSetIsLoggedIn(false)} />
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          showToast(`สร้างงาน "${newEvent.title}" สำเร็จแล้ว! 🎉`);
          setIsCreateEventModalOpen(false);
        }}
      />
      {eventData && (
        <ReportSafetyModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetTitle={eventData.title}
          targetHostName={venueOrganizerName}
        />
      )}

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />
    </div>
  );
}
