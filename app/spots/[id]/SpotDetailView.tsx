'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import { useMyActivity } from '@/lib/useMyActivity';
import { CreateEventModal, type PlacePick } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import {
  getSpotById,
  getNearbySpots,
  getNearbyRecommendationInfo,
  LifestyleSpotItem,
  MOCK_SPOTS
} from '@/data/spotsData';
import { RelatedCards, spotCard, teeCard } from '@/components/detail/RelatedCards';
import { spotOrigin } from '@/lib/contentOrigin';
import { travelModes, visitorFacilities } from '@/lib/spotFacilities';
import { resolveSpotGallery, resolveSpotImage } from '@/lib/spotImageResolver';
import { usePublishedSpots } from '@/lib/usePublishedSpots';
import { renderDescriptionContent } from '@/components/RichTextEditor';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { SmartSpotPlanCard } from '@/components/SmartSpotPlanCard';
import { SpotBuddyTrips } from '@/components/SpotBuddyTrips';
import { VisitPanel } from '@/components/VisitPanel';
import { NearbyDiningSection } from '@/components/NearbyDiningSection';
import { DetailHero, DetailTable, heroButton } from '@/components/detail/DetailHero';
import { VisitReviews } from '@/components/detail/VisitReviews';
import { Toast } from '@/components/Toast';
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Heart,
  Star,
  Share2,
  Check,
  Compass,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Camera,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  ShieldCheck,
  Navigation,
  Car,
  Tag,
  Building2,
  Ticket,
  BookOpen,
  BookMarked,
  Flag
} from 'lucide-react';

// Helper to strip rogue emojis from text fields for clean, elegant typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export interface SpotOpenStatus {
  isOpen: boolean;
  statusText: string;
  subText?: string;
  badgeVariant: 'open' | 'closed' | 'unspecified';
}

export function parseSpotOpenStatus(openHours?: string): SpotOpenStatus {
  if (!openHours || /ไม่ระบุ/i.test(openHours)) {
    return {
      isOpen: false,
      statusText: 'เวลาทำการตามประกาศ',
      subText: 'โปรดตรวจสอบก่อนเดินทาง',
      badgeVariant: 'unspecified' };
  }

  const clean = openHours.trim();

  // 24 hours check
  if (/24\s*(ชั่วโมง|ชม)/i.test(clean) || /00:00\s*[-–]\s*23:59/i.test(clean) || /00:00\s*[-–]\s*24:00/i.test(clean)) {
    return {
      isOpen: true,
      statusText: 'เปิดตลอด 24 ชั่วโมง',
      badgeVariant: 'open' };
  }

  // Check current Thailand time (UTC+7)
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const thaiHours = (utcHours + 7) % 24;
  const currentMinutes = thaiHours * 60 + utcMinutes;
  const currentDay = (now.getUTCDay() + (utcHours + 7 >= 24 ? 1 : 0)) % 7; // 0=Sun, 1=Mon, ..., 6=Sat

  // Check day restrictions
  if (/จ\.-ศ\./.test(clean) && (currentDay === 0 || currentDay === 6)) {
    return {
      isOpen: false,
      statusText: 'ปิดทำการวันนี้',
      subText: 'เปิดวันจันทร์ - ศุกร์',
      badgeVariant: 'closed',
    };
  }
  if (/ส\.-อา\./.test(clean) && currentDay >= 1 && currentDay <= 5) {
    return {
      isOpen: false,
      statusText: 'ปิดทำการวันนี้',
      subText: 'เปิดเฉพาะ เสาร์ - อาทิตย์',
      badgeVariant: 'closed',
    };
  }
  if (/ปิดวันจันทร์/.test(clean) && currentDay === 1) {
    return {
      isOpen: false,
      statusText: 'ปิดทำการวันนี้',
      subText: 'ปิดทุกวันจันทร์',
      badgeVariant: 'closed',
    };
  }

  // Parse time range: e.g. 08:00 - 17:00
  const match = clean.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
  if (match) {
    const openH = parseInt(match[1], 10);
    const openM = parseInt(match[2], 10);
    const closeH = parseInt(match[3], 10);
    const closeM = parseInt(match[4], 10);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return {
        isOpen: true,
        statusText: 'เปิดให้บริการอยู่',
        subText: `ปิด ${match[3]}:${match[4]} น.`,
        badgeVariant: 'open',
      };
    } else {
      return {
        isOpen: false,
        statusText: 'ปิดให้บริการแล้ว',
        subText: `เปิด ${match[1]}:${match[2]} น.`,
        badgeVariant: 'closed',
      };
    }
  }

  return {
    isOpen: true,
    statusText: clean.length > 25 ? 'เปิดให้บริการ' : clean,
    badgeVariant: 'open',
  };
}

/** The page itself: `initialSpot` comes from the server page, so the content is in the HTML search engines read. */
export default function SpotDetailPage({ initialSpot = null }: { initialSpot?: LifestyleSpotItem | null }) {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('spots');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  // What the member joined comes from the account; this keeps the page in step with it
  const myActivity = useMyActivity();
  useEffect(() => {
    if (myActivity.isLoaded) setJoinedEventIds(myActivity.joinedIds);
  }, [myActivity.isLoaded, myActivity.joinedIds]);
  const [isCopied, setIsCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  // The Smart Plan schedule carried into the create dialog; empty when opened from other buttons
  const [teeItinerary, setTeeItinerary] = useState<Array<{ time: string; title: string }> | undefined>(undefined);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  // Fullscreen Photo Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Retrieve spot: the API holds the live catalog (incl. imported spots); bundled data renders instantly as a fallback
  const staticSpot: LifestyleSpotItem | undefined = useMemo(() => {
    if (!decodedId) return undefined;
    return getSpotById(decodedId) || MOCK_SPOTS.find((s) => s.id === decodedId || s.title === decodedId);
  }, [decodedId]);
  const [apiSpot, setApiSpot] = useState<LifestyleSpotItem | null>(initialSpot);
  const [isSpotLoading, setIsSpotLoading] = useState(!initialSpot);
  useEffect(() => {
    // The server already sent this place
    if (!decodedId || initialSpot) return;
    let active = true;
    fetch(`/api/spots/${encodeURIComponent(decodedId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.spot) setApiSpot(data.spot as LifestyleSpotItem);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsSpotLoading(false);
      });
    return () => {
      active = false;
    };
  }, [decodedId, initialSpot]);
  const spot: LifestyleSpotItem | undefined = apiSpot || staticSpot;
  const { spots: publishedSpots } = usePublishedSpots();

  // Gallery Photos (Adaptive resolution)
  const galleryImages: string[] = useMemo(() => {
    if (!spot) return [];
    return resolveSpotGallery(spot);
  }, [spot]);

  // Real-time open/closed status parsing
  const initialPlace: PlacePick | undefined = useMemo(
    () => spot ? { placeId: spot.id, name: spot.title, province: spot.province, district: spot.district, pin: spot.latitude && spot.longitude ? { latitude: spot.latitude, longitude: spot.longitude } : undefined } : undefined,
    [spot]
  );
  const openStatus = useMemo(() => parseSpotOpenStatus(spot?.openHours), [spot?.openHours]);

  // Nearby spots recommendation info (smart zonal & distance proximity)
  const recommendation = useMemo(() => {
    if (!spot) return { spots: [], sectionTitle: '', sectionSubtitle: '', zoneName: '' };
    return getNearbyRecommendationInfo(spot, 5, publishedSpots.length > 0 ? publishedSpots : MOCK_SPOTS);
  }, [spot, publishedSpots]);

  const nearbySpots = recommendation.spots;

  // ตี้ whose host picked this place when setting them up (placeId), still open: the place leads to people (owner 2026-10-25)
  const [placeTees, setPlaceTees] = useState<EventItem[]>([]);
  const placeKey = spot?.id;
  useEffect(() => {
    if (!placeKey) return;
    let active = true;
    fetch(`/api/events?type=community&placeId=${encodeURIComponent(placeKey)}&limit=8`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.events)) setPlaceTees(data.events);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [placeKey]);

  // Separate Public Transit & Private Car Info for real-world clarity (with clean text)
  // A seed place without transit info keeps a placeholder line; everything else shows what the source says
  const publicTransitText = !spot?.transitInfo && spot && spotOrigin(spot) === 'sample' ? 'เดินทางด้วยรถไฟฟ้าหรือรถประจำทางที่ผ่านบริเวณใกล้เคียง' : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLoggedIn) {
      setFavorites([]);
      setJoinedEventIds([]);
      return;
    }

    const savedFavs = localStorage.getItem('favorite_spots');
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
  }, [decodedId, isLoggedIn]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (spotId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกสถานที่ลงในสมุดบันทึกการเดินทาง (Travel Scrapbook)');
      setIsRequireMembershipOpen(true);
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(spotId);
      let updated: string[];
      if (isFav) {
        updated = prev.filter((id) => id !== spotId);
        showToast('นำออกจากสมุดบันทึกสถานที่เที่ยวแล้ว');
      } else {
        updated = [...prev, spotId];
        const addedSpotTitle = spotId === spot?.id ? spot?.title : (nearbySpots.find((s) => s.id === spotId)?.title || spot?.title);
        showToast(`เพิ่ม "${cleanText(addedSpotTitle)}" ลงในสมุดบันทึกสถานที่เที่ยวแล้ว`);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !spot) return;
    const url = window.location.href;
    const shareData = {
      title: `${spot.title} | Chill & Connect Hub`,
      text: `แนะนำจุดเช็คอิน & จุดฮีลใจ: ${spot.title} (${spot.province})`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('แชร์สถานที่เรียบร้อย');
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์สถานที่แล้ว ส่งให้เพื่อนได้เลย');
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

  if (!spot && isSpotLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">กำลังโหลดข้อมูลสถานที่...</p>
      </div>
    );
  }

  if (!spot) {
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
          onOpenCreateEvent={() => { setTeeItinerary(undefined); setIsCreateEventModalOpen(true); }}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ไม่พบข้อมูลสถานที่ท่องเที่ยวนี้</h1>
          <p className="text-sm text-slate-600">สถานที่นี้อาจถูกย้ายหรือไม่มีอยู่ในระบบ</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/spots"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้ารวมพิกัดเที่ยว</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>กลับสู่หน้าแรก</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isFavorite = isLoggedIn && favorites.includes(spot.id);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#2D5A3C] selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => { setTeeItinerary(undefined); setIsCreateEventModalOpen(true); }}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-16">
        <Link href="/spots" className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          ที่เที่ยวทั้งหมด
        </Link>

        {/* Header, drawn like the challenge page (components/detail/DetailHero.tsx): every fact here once */}
        <DetailHero
          pillar="spot"
          image={galleryImages[0] || resolveSpotImage(spot)}
          imageAlt={`${cleanText(spot.title)} ${spot.district || ''} ${spot.province || ''}`.trim()}
          photoCount={galleryImages.length}
          onOpenPhotos={() => {
            setActivePhotoIndex(0);
            setIsLightboxOpen(true);
          }}
          highlight={openStatus.badgeVariant === 'unspecified' ? undefined : { icon: Clock, text: [openStatus.statusText, openStatus.subText].filter(Boolean).join(' · '), tone: openStatus.isOpen ? 'open' : 'closed' }}
          title={cleanText(spot.title)}
          facts={[
            { icon: Clock, text: cleanText(spot.openHours) || 'เปิดทุกวัน' },
            { icon: MapPin, text: [spot.district, spot.province].filter(Boolean).join(', ') },
            // "ไม่ระบุ" is not a fact: leave it out rather than print it (as on the อีเวนต์ page)
            ...(cleanText(spot.price).startsWith('ไม่ระบุ') ? [] : [{ icon: Ticket, text: cleanText(spot.price) || 'เข้าฟรี' }]),
            ...(spot.rating > 0 ? [{ icon: Star, text: `${spot.rating}${spot.reviewsCount > 0 ? ` (${spot.reviewsCount} รีวิว)` : ''}` }] : []),
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => toggleFavorite(spot.id)}
                aria-pressed={isFavorite}
                className={isFavorite ? heroButton.done : heroButton.primary}
              >
                {isFavorite ? <Check className="w-5 h-5" aria-hidden="true" /> : <BookMarked className="w-5 h-5" aria-hidden="true" />}
                {isFavorite ? 'บันทึกแล้ว' : 'บันทึกที่นี่'}
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([spot.title, spot.district, spot.province].filter(Boolean).join(' '))}`}
                target="_blank"
                rel="noopener noreferrer"
                className={heroButton.quiet}
              >
                <Navigation className="w-4 h-4" aria-hidden="true" />
                นำทาง
              </a>
              <button type="button" onClick={handleShare} className={heroButton.quiet}>
                {isCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                {isCopied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}
              </button>
            </>
          }
          note={!isFavorite ? 'บันทึกลงสมุดท่องเที่ยว ไว้วางแผนไปทีหลัง' : undefined}
        />

        {/* Like the challenge page: the story, the details as a plain table and the map on the left; on the right
            how to reach the place, then moments and the challenge it counts toward, going together and a day plan */}
        <div className="mt-10 sm:mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-start">
          <aside className="lg:order-2 space-y-6">
            {(spot.contact?.phone || spot.contact?.website || spot.contact?.facebook || (spot.sourceName && spot.sourceUrl)) && (
              <section className="p-5 sm:p-6 rounded-3xl bg-[#EBF3ED] border border-slate-200 space-y-3">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">ติดต่อที่นี่</h2>
                {spot.contact?.phone && (
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    <a href={`tel:${spot.contact.phone.split(',')[0].replace(/[^\d+]/g, '')}`} className="hover:underline">{spot.contact.phone}</a>
                  </p>
                )}
                {(spot.contact?.website || spot.contact?.facebook) && (
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Globe className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    {spot.contact?.website && (
                      <a href={spot.contact.website} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline">เว็บไซต์</a>
                    )}
                    {spot.contact?.website && spot.contact?.facebook && <span className="text-slate-300" aria-hidden="true">·</span>}
                    {spot.contact?.facebook && (
                      <a href={spot.contact.facebook} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline">Facebook</a>
                    )}
                  </p>
                )}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
                  {spot.sourceName && spot.sourceUrl ? (
                    <a href={spot.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-800 hover:underline">
                      ข้อมูล: {spot.sourceName.replace(/\s*\(.*\)\s*$/, '')}
                    </a>
                  ) : (
                    <span />
                  )}
                  <button type="button" onClick={() => setIsReportModalOpen(true)} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer">
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                    แจ้งข้อมูลผิด
                  </button>
                </div>
              </section>
            )}

            {/* Moments from members here, and the challenge this counts toward (said once, here) */}
            <VisitPanel
              targetType="spot"
              targetId={spot.id}
              title={spot.title}
              location={spot.title}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => {
                setMembershipActionTitle('เพื่อบันทึกว่าคุณไปที่นี่มาแล้ว');
                setIsRequireMembershipOpen(true);
              }}
              onShowToast={showToast}
            />

            {/* Spot Buddy: shown only for places staff opened for meet-ups */}
            <SpotBuddyTrips
              spot={spot}
              isLoggedIn={isLoggedIn}
              onRequireLogin={() => {
                setMembershipActionTitle('เพื่อชวนเพื่อนไปที่นี่');
                setIsRequireMembershipOpen(true);
              }}
              onShowToast={showToast}
            />

            <SmartSpotPlanCard
              key={spot.id}
              currentSpot={spot}
              onStartTee={(plan) => {
                if (!isLoggedIn) {
                  setMembershipActionTitle('เพื่อชวนเพื่อนไปตามแผนนี้');
                  setIsRequireMembershipOpen(true);
                  return;
                }
                setTeeItinerary(plan.itinerary);
                setIsCreateEventModalOpen(true);
              }}
            />
          </aside>

          <div className="lg:order-1 min-w-0 space-y-10">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">เกี่ยวกับที่นี่</h2>
              {renderDescriptionContent(spot.description)}
            </section>

            <DetailTable
              title="สิ่งที่ควรทราบ"
              rows={[
                { label: 'ช่วงที่ดีที่สุด', value: spot.bestTime ? cleanText(spot.bestTime) : '' },
                {
                  label: 'จุดเด่น',
                  value: (spot.highlights ?? []).map((h) => cleanText(h)).filter((h) => h && h !== cleanText(spot.categoryLabel)).join(' · '),
                },
                // The Tourism Directory lists ways to get there, not public transport, and no parking detail
                { label: 'การเดินทาง', value: spot.transitInfo ? travelModes(cleanText(spot.transitInfo)) : publicTransitText ? cleanText(publicTransitText) : '' },
                { label: 'สิ่งอำนวยความสะดวก', value: visitorFacilities((spot.facilities ?? []).map((fac) => cleanText(fac))).join(' · ') },
              ]}
            />

            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">แผนที่</h2>
              <div className="relative w-full h-60 sm:h-72 rounded-3xl overflow-hidden bg-slate-100">
                <iframe
                  title={`Google Map - ${cleanText(spot.title)}`}
                  src={`https://maps.google.com/maps?q=${spot.latitude},${spot.longitude}&hl=th&z=15&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            {/* Ratings and tips from people who have been (the "จบ" phase of a place) */}
            <VisitReviews targetType="spot" targetId={spot.id} isLoggedIn={isLoggedIn} />

            {/* Cafés and restaurants close by */}
            <NearbyDiningSection spot={spot} />
          </div>
        </div>

        {placeTees.length > 0 && <RelatedCards title="ตี้ที่นัดที่นี่" allHref="/community" items={placeTees.slice(0, 4).map(teeCard)} />}

        <RelatedCards title={recommendation.sectionTitle.replace(/\s*\p{Extended_Pictographic}️?/gu, '').trim()} allHref={`/spots?province=${encodeURIComponent(spot.province)}`} items={nearbySpots.slice(0, 4).map(spotCard)} />

      </main>

      {/* =========================================================================
          INTERACTIVE FULLSCREEN PHOTO LIGHTBOX MODAL
         ========================================================================= */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
          
          {/* Top Bar: Title, Counter & Close Button */}
          <div className="flex items-center justify-between text-white pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md">{spot.title}</h3>
              <p className="text-xs text-slate-400">รูปที่ {activePhotoIndex + 1} จาก {galleryImages.length} รูป</p>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดหน้าต่างรูปภาพ (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo Center Container with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-2 max-h-[70vh]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10"
              title="รูปก่อนหน้า (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={galleryImages[activePhotoIndex]}
              alt={`${spot.title} บรรยากาศภาพที่ ${activePhotoIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10"
              title="รูปถัดไป (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {galleryImages.map((thumbUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative w-14 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activePhotoIndex === idx
                    ? 'border-emerald-400 scale-105 ring-2 ring-emerald-400/50'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Footer */}
      <SiteFooter className="bg-white mt-10" />

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย`);
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        initialLocation={spot ? `${spot.title}, ${[spot.district, spot.province].filter(Boolean).join(', ')}` : undefined}
        initialTitle={spot ? `ชวนไปเที่ยว ${spot.title}` : undefined}
        initialImage={spot?.image}
        initialPlace={initialPlace}
        initialItinerary={teeItinerary}
        initialType={teeItinerary ? 'community' : undefined}
        onCreateSuccess={(newEvent: EventItem) => {
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`ตั้งตี้ "${newEvent.title}" สำเร็จเรียบร้อย`);
          }
        }}
      />
      {spot && (
        <ReportSafetyModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="spot"
          targetId={spot.id}
          targetTitle={spot.title}
          onReportSubmitted={() => {
            showToast('ส่งรายงานข้อมูลสถานที่เรียบร้อย ทีมงานจะตรวจสอบโดยเร็ว');
          }}
        />
      )}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
      />

      {/* Toast */}
      <Toast message={toastMessage} />

    </div>
  );
}
