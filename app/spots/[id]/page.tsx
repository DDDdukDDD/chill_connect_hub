'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import {
  getSpotById,
  getNearbySpots,
  getNearbyRecommendationInfo,
  LifestyleSpotItem,
  MOCK_SPOTS
} from '@/data/spotsData';
import { SpotCard, formatSpotBadgePrice } from '@/components/SpotCard';
import { resolveSpotGallery, resolveSpotImage } from '@/lib/spotImageResolver';
import { renderDescriptionContent } from '@/components/RichTextEditor';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { SpotBuddyGatheringModal, SpotBuddyPostItem } from '@/components/SpotBuddyGatheringModal';
import {
  MapPin,
  Clock,
  Heart,
  Star,
  Share2,
  Check,
  CheckCircle2,
  Sparkles,
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
  Users,
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

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('spots');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isSpotBuddyModalOpen, setIsSpotBuddyModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  // Fullscreen Photo Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Retrieve spot
  const spot: LifestyleSpotItem | undefined = useMemo(() => {
    if (!decodedId) return undefined;
    return getSpotById(decodedId) || MOCK_SPOTS.find((s) => s.id === decodedId || s.title === decodedId);
  }, [decodedId]);

  // Gallery Photos (5-8 images guaranteed)
  const galleryImages: string[] = useMemo(() => {
    if (!spot) return [];
    return resolveSpotGallery(spot);
  }, [spot]);

  // Nearby spots recommendation info (smart zonal & distance proximity)
  const recommendation = useMemo(() => {
    if (!spot) return { spots: [], sectionTitle: '', sectionSubtitle: '', zoneName: '' };
    return getNearbyRecommendationInfo(spot, 4);
  }, [spot]);

  const nearbySpots = recommendation.spots;

  // Related community meetups / spot buddy circles (Dynamic state merging user_created_events + mock)
  const [spotMeetups, setSpotMeetups] = useState<EventItem[]>([]);

  const loadSpotMeetups = useCallback(() => {
    if (!spot) return;
    const spotName = spot.title.toLowerCase();
    const spotProv = (spot.province || '').toLowerCase();

    let userCreated: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_created_events');
        if (saved) userCreated = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading user_created_events:', e);
      }
    }

    const combined = [...userCreated, ...MOCK_EVENTS];
    const matched = combined.filter((ev) => {
      if (ev.eventType && ev.eventType !== 'community') return false;
      const loc = (ev.location || '').toLowerCase();
      const prov = (ev.province || '').toLowerCase();
      const sId = (ev as any).spotId;
      return (
        sId === spot.id ||
        loc.includes(spotName) ||
        spotName.includes(loc) ||
        (prov && spotProv && (prov.includes(spotProv) || spotProv.includes(prov)))
      );
    });

    const seen = new Set<string>();
    const unique = matched.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    setSpotMeetups(unique.slice(0, 4));
  }, [spot]);

  useEffect(() => {
    loadSpotMeetups();
  }, [loadSpotMeetups]);

  // Separate Public Transit & Private Car Info for real-world clarity (with clean text)
  const { publicTransitText, parkingText } = useMemo(() => {
    if (!spot?.transitInfo) {
      return {
        publicTransitText: 'เดินทางด้วยรถไฟฟ้าหรือรถประจำทางที่ผ่านบริเวณใกล้เคียง',
        parkingText: 'มีพื้นที่จอดรถสำหรับผู้มาติดต่อ หรือจุดจอดรถบริเวณใกล้เคียง'
      };
    }

    const raw = cleanText(spot.transitInfo);
    const parts = raw.split(/,|และ|พร้อม/).map((s) => s.trim()).filter(Boolean);
    const publicParts = parts.filter((p) =>
      /bts|mrt|รถไฟฟ้า|เรือ|แอร์พอร์ต|รถเมล์|รถสองแถว|สถานี|เดินต่อ|สาย/i.test(p)
    );
    const parkingParts = parts.filter((p) =>
      /จอด|รถยนต์|ลานจอด|ถนน|ทางหลวง|ขับรถ|อาคารจอด/i.test(p)
    );

    return {
      publicTransitText: publicParts.length > 0 ? publicParts.join(', ') : raw,
      parkingText: parkingParts.length > 0 ? parkingParts.join(', ') : 'มีจุดจอดรถยนต์บริเวณสถานที่ หรือเดินทางตามพิกัด GPS'
    };
  }, [spot]);

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

  const handleOpenSpotBuddyModal = () => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อเปิดตี้ชวนเพื่อนไปเที่ยวด้วยกัน');
      setIsRequireMembershipOpen(true);
      return;
    }
    setIsSpotBuddyModalOpen(true);
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
          onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-slate-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลสถานที่ท่องเที่ยวนี้</h1>
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
            TOP BREADCRUMBS & ACTION BAR
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1.5 border-b border-slate-100">
          
          {/* Left: Clean Breadcrumbs */}
          <nav className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#4A7C59] transition-colors font-semibold py-2 px-1">หน้าแรก</Link>
            <span className="py-2">/</span>
            <Link href="/spots" className="hover:text-[#4A7C59] transition-colors py-2 px-1 font-semibold">พิกัดเที่ยว & จุดฮีลใจ</Link>
            <span className="py-2">/</span>
            <span className="text-slate-700 font-semibold py-2 px-1">{spot.province}</span>
            <span className="py-2">/</span>
            <span className="text-slate-900 font-bold truncate py-2 px-1">{cleanText(spot.title)}</span>
          </nav>

          {/* Right: Favorite & Share Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavorite(spot.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                isFavorite
                  ? 'bg-[#EBF3ED] text-[#2D5A3C] border-[#C5DEC9]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#4A7C59]'
              }`}
            >
              <BookMarked className={`w-3.5 h-3.5 ${isFavorite ? 'text-[#2D5A3C]' : 'text-slate-500'}`} />
              <span>{isFavorite ? 'บันทึกในสมุดแล้ว' : 'บันทึกในสมุด'}</span>
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
                  <span>แชร์สถานที่</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="w-8 h-8 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="รายงานข้อมูลสถานที่ปิด / พิกัดไม่ถูกต้อง"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* =========================================================================
            EDITORIAL 5-8 PHOTO MOSAIC GALLERY
           ========================================================================= */}
        <section className="space-y-2">
          
          {/* Photo Mosaic Grid (Desktop 5-Photo Hero, Mobile 1 Main + Carousel) */}
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
                src={galleryImages[0] || spot.image}
                alt={`${spot.title} บรรยากาศ 1`}
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
                    alt={`${spot.title} บรรยากาศ ${photoIdx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />

                  {/* View All Photos Button Overlay on the 4th Thumbnail */}
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

            {/* Floating Mobile View All Button */}
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
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>แตะที่รูปเพื่อเปิดดูภาพบรรยากาศขนาดใหญ่ (Fullscreen Lightbox)</span>
            </span>
            <span className="hidden sm:inline">คลังภาพบรรยากาศ {galleryImages.length} มุมมอง</span>
          </div>

        </section>

        {/* =========================================================================
            CORE CONTENT: 2-COLUMN EDITORIAL LAYOUT (Clean Editorial Flow)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start pt-3">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols - Editorial Focus) */}
          <div className="lg:col-span-2 space-y-7">
            
            {/* 1. Header Title, Badges & Ratings */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Badge - Forest Green */}
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#EBF3ED] text-[#2D5A3C] border border-emerald-200">
                  {spot.categoryLabel}
                </span>

                {/* Star Rating & Reviews */}
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs ml-auto sm:ml-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{spot.rating}</span>
                  <span className="text-slate-400 font-normal">({spot.reviewsCount || 480} รีวิว)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {cleanText(spot.title)}
              </h1>

              {/* Location & District */}
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {spot.district}, จังหวัด{spot.province}
              </p>

              {/* Vibe Tags */}
              {spot.vibeTags && spot.vibeTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {spot.vibeTags.map((vibe, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-xl transition-colors"
                    >
                      {cleanText(vibe)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Sleek Inline Metadata Ribbon (Clean text with vertical divider) */}
            <div className="py-3.5 px-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">เวลาเปิด-ปิด:</span>
                <span className="font-bold text-slate-900">{cleanText(spot.openHours) || 'เปิดทุกวัน'}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">ช่วงเวลาแนะนำ:</span>
                <span className="font-bold text-slate-900">{cleanText(spot.bestTime) || '16:30 - 18:30 น.'}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">ค่าเข้าชม:</span>
                <span className="font-bold text-slate-900">{cleanText(spot.price) || 'เข้าฟรี'}</span>
              </div>
            </div>

            {/* 3. About / Story Section (Clean Editorial Paragraphs & Rich Content) */}
            <div className="space-y-3 pt-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                เกี่ยวกับสถานที่นี้
              </h2>
              {renderDescriptionContent(spot.description)}
            </div>

            {/* 4. Highlights Section (Clean Minimal Bullets) */}
            {spot.highlights && spot.highlights.length > 0 && (
              <div className="space-y-3.5 pt-5 border-t border-slate-100">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  จุดเด่น & ไฮไลต์ที่ไม่ควรพลาด
                </h2>
                <ul className="space-y-3 pt-1">
                  {spot.highlights.map((h, idx) => (
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

            {/* 5. Transit & Facilities Section (2-Column Structured Rhythm) */}
            <div className="space-y-4 pt-5 border-t border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                การเดินทาง & สิ่งอำนวยความสะดวก
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* 1. Public Transit */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    รถสาธารณะ & รถไฟฟ้า
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(publicTransitText)}
                  </p>
                </div>

                {/* 2. Private Car & Parking */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    รถยนต์ส่วนตัว & ที่จอดรถ
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {cleanText(parkingText)}
                  </p>
                </div>
              </div>

              {/* Facilities tags */}
              {spot.facilities && spot.facilities.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    สิ่งอำนวยความสะดวก
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {spot.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl"
                      >
                        {cleanText(fac)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Interactive Google Map */}
            <div className="space-y-3.5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  พิกัดแผนที่ & เส้นทาง
                </h3>

                <a
                  href={spot.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#4A7C59] hover:underline shrink-0"
                >
                  <span>เปิดดูใน Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                <iframe
                  title={`Google Map - ${cleanText(spot.title)}`}
                  src={`https://maps.google.com/maps?q=${spot.latitude},${spot.longitude}&hl=th&z=15&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY PLACE SUMMARY & DIRECTIONS CARD (1 Col) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            
            {/* Quick Info Action Box */}
            <div className={`p-5 sm:p-6 rounded-3xl transition-all space-y-4 ${
              isFavorite
                ? 'bg-gradient-to-b from-[#EBF3ED]/40 via-white to-white border-2 border-[#4A7C59] shadow-md ring-2 ring-[#4A7C59]/25'
                : 'bg-white border border-slate-200/90 shadow-sm'
            }`}>
              
              {/* Header Status & District */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-emerald-800 whitespace-nowrap">เปิดให้บริการวันนี้</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[130px]" title={`${spot.district}, จังหวัด${spot.province}`}>
                  {spot.district}
                </span>
              </div>

              {/* Operating Hours Summary */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  เวลาทำการ
                </span>
                <p className="text-sm font-black text-slate-900">{cleanText(spot.openHours)}</p>
              </div>

              {/* Location Address */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  ที่ตั้ง & ย่าน
                </span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">{spot.district}, จังหวัด{spot.province}</p>
              </div>

              {/* Centralized Two-Tier / 3-Level Button System */}
              <div className="space-y-2 pt-1">
                {/* 1. Primary Action: Google Maps External Directions (Royal Blue) */}
                <a
                  href={spot.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  <span>นำทางด้วย Google Maps</span>
                </a>

                {/* 2. Community Gathering CTA: Spot Buddy Dialog (Slate Black) */}
                <button
                  type="button"
                  onClick={handleOpenSpotBuddyModal}
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>ชวนเพื่อนไปที่นี่ (เปิดตี้ / หาบัดดี้)</span>
                </button>

                {/* 3. Personal Scrapbook Save */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(spot.id)}
                  className={`group w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border ${
                    isFavorite
                      ? 'bg-[#EBF3ED] text-[#2D5A3C] border-[#C5DEC9] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isFavorite ? (
                    <>
                      <span className="flex items-center gap-2 group-hover:hidden">
                        <Check className="w-4 h-4 text-[#2D5A3C]" />
                        <span>บันทึกในสมุดท่องเที่ยวแล้ว</span>
                      </span>
                      <span className="hidden items-center gap-2 group-hover:flex text-rose-600">
                        <X className="w-4 h-4 text-rose-500" />
                        <span>นำออกจากสมุดท่องเที่ยว</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <BookMarked className="w-4 h-4 text-slate-500" />
                      <span>บันทึกลงสมุดท่องเที่ยว</span>
                    </>
                  )}
                </button>

                {isFavorite && (
                  <Link
                    href="/myhub?tab=scrapbook"
                    className="w-full text-center inline-flex items-center justify-center gap-1 text-[11px] font-extrabold text-[#4A7C59] hover:text-[#2D5A3C] hover:underline pt-0.5"
                  >
                    <span>เปิดดูสมุดบันทึกเที่ยวของฉันใน MyHub</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

            </div>

            {/* Sub-Card: Spot Buddy Meetup Circles */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F26430]" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    ตี้เพื่อนใหม่ & นัดพบในพื้นที่
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenSpotBuddyModal}
                  className="text-[11px] font-bold text-[#F26430] hover:text-[#D04A1B] hover:underline cursor-pointer"
                >
                  + เปิดตี้ใหม่
                </button>
              </div>

              {spotMeetups.length > 0 ? (
                <div className="space-y-2">
                  {spotMeetups.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/community`}
                      className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-orange-50/40 border border-slate-200/70 hover:border-orange-200 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={ev.hostAvatar || ev.image}
                          alt={ev.hostName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-[#F26430] transition-colors truncate">
                            {cleanText(ev.title)}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                            <span>{ev.date}</span>
                            <span>•</span>
                            <span>{ev.participantsCount}/{ev.maxParticipants} คน</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0 group-hover:border-orange-300">
                        ดูตี้
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">ยังไม่มีตี้เปิดรับสมัครสำหรับจุดนี้</p>
                  <button
                    type="button"
                    onClick={handleOpenSpotBuddyModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-[#F26430] transition-colors cursor-pointer"
                  >
                    <span>เป็นผู้นำเปิดตี้ชวนเพื่อนเที่ยวคนแรก</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Native Travel Perks & Partner Deals (Curated Lifestyle Affiliate Block) */}
            <div className="bg-gradient-to-b from-white to-slate-50/60 p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    สิทธิพิเศษ & ดีลการเดินทาง
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Travel Perks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                บริการพาร์ทเนอร์และสิทธิพิเศษสำหรับการเดินทางไปพิกัด {cleanText(spot.title)}
              </p>

              <div className="space-y-2">
                {/* 1. Grab / Transit Affiliate */}
                <a
                  href="https://www.grab.com/th/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-black shrink-0">
                      <Car className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        เรียกรถไปจุดนี้ รับส่วนลด 15%
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        GrabCar ไปยัง {spot.district}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0 inline-flex items-center gap-1">
                    <span>รับสิทธิ์</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </a>

                {/* 2. Agoda / Hotels nearby */}
                <a
                  href={`https://www.agoda.com/search?city=${encodeURIComponent(spot.province)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center text-sm font-black shrink-0">
                      <Building2 className="w-4 h-4 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        ค้นหาที่พัก & โฮสเทลใกล้เคียง
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        ในย่าน {spot.district || spot.province}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg shrink-0 inline-flex items-center gap-1">
                    <span>ดูราคา</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </a>

                {/* 3. Klook / Workshop & Passes */}
                <a
                  href="https://www.klook.com/th/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-black shrink-0">
                      <Ticket className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                        บัตรกิจกรรม & เวิร์กช็อปพิเศษ
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        ดีลไลฟ์สไตล์ Klook ประจำย่าน
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg shrink-0 inline-flex items-center gap-1">
                    <span>สำรวจ</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </a>
              </div>

              <div className="pt-0.5 text-center">
                <span className="text-[10px] text-slate-400">
                  สิทธิพิเศษพาร์ทเนอร์อย่างเป็นทางการ สนับสนุนคอมมูนิตี้ท่องเที่ยว
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================================
            NEARBY RECOMMENDED SPOTS (SMART ZONAL & PROXIMITY DISCOVERY)
           ========================================================================= */}
        {nearbySpots.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {recommendation.sectionTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {recommendation.sectionSubtitle}
                </p>
              </div>

              <Link
                href={`/spots?province=${encodeURIComponent(spot.province)}`}
                className="text-xs font-extrabold text-[#4A7C59] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>ดูทั้งหมดใน {spot.province}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbySpots.map((item) => (
                <SpotCard
                  key={item.id}
                  spot={item}
                  isFavorite={isLoggedIn && favorites.includes(item.id)}
                  isJoined={isLoggedIn && joinedEventIds.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* =========================================================================
          INTERACTIVE FULLSCREEN PHOTO LIGHTBOX MODAL
         ========================================================================= */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
          
          {/* Top Bar: Title, Counter & Close Button */}
          <div className="flex items-center justify-between text-white pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-md">{spot.title}</h3>
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
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 space-y-1.5 mt-10">
        <p className="font-medium text-slate-600 text-xs">Lifestyle Discovery & Community Engagement Platform ระดับประเทศ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

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
      {spot && (
        <SpotBuddyGatheringModal
          isOpen={isSpotBuddyModalOpen}
          onClose={() => setIsSpotBuddyModalOpen(false)}
          spotTitle={cleanText(spot.title)}
          spotLocation={`${spot.district}, จังหวัด${spot.province}`}
          spotImage={resolveSpotImage(spot)}
          spotId={spot.id}
          spotProvince={spot.province}
          spotDistrict={spot.district}
          mode="spot"
          onSuccess={(newTrip: SpotBuddyPostItem) => {
            const newEventId = newTrip.id;
            const newSubActivity = {
              eventId: newEventId,
              eventTitle: newTrip.title,
              eventDate: newTrip.date,
              eventTime: newTrip.time,
              eventLocation: newTrip.meetingPoint ? `${spot.title} (${newTrip.meetingPoint})` : spot.title,
              eventImage: newTrip.image || resolveSpotImage(spot),
              eventPrice: newTrip.price,
              creatorName: newTrip.hostName,
              creatorAvatar: newTrip.hostAvatar,
              subTitle: newTrip.title,
              meetupPoint: newTrip.meetingPoint,
              eventType: 'community',
              category: 'chill',
              participantsCount: 1,
              maxParticipants: newTrip.maxParticipants,
              spotId: spot.id,
            };

            const newEventItem: EventItem = {
              id: newEventId,
              title: newTrip.title,
              description: newTrip.description,
              date: newTrip.date,
              time: newTrip.time,
              location: newTrip.meetingPoint ? `${spot.title} (${newTrip.meetingPoint})` : spot.title,
              province: spot.province,
              tag: newTrip.tag || 'ตี้เที่ยว',
              category: 'chill',
              eventType: 'community',
              image: newTrip.image || resolveSpotImage(spot),
              hostName: newTrip.hostName,
              hostAvatar: newTrip.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
              participantsCount: 1,
              maxParticipants: newTrip.maxParticipants,
              price: newTrip.price || 'ฟรี',
              createdAtTimestamp: Date.now(),
              whatToBring: newTrip.whatToBring,
              meetingPoint: newTrip.meetingPoint,
              itinerary: newTrip.itinerary,
            };

            if (typeof window !== 'undefined') {
              try {
                // 1. user_created_events
                const savedCreated = localStorage.getItem('user_created_events');
                const createdList = savedCreated ? JSON.parse(savedCreated) : [];
                localStorage.setItem(
                  'user_created_events',
                  JSON.stringify([
                    { ...newEventItem, spotId: spot.id },
                    ...createdList.filter((e: any) => e.id !== newEventId),
                  ])
                );

                // 2. joined_event_ids
                const savedJoined = localStorage.getItem('joined_event_ids');
                const joinedList = savedJoined ? JSON.parse(savedJoined) : [];
                if (!joinedList.includes(newEventId)) {
                  localStorage.setItem('joined_event_ids', JSON.stringify([newEventId, ...joinedList]));
                }

                // 3. joinedSubActivities
                const savedSubs = localStorage.getItem('joinedSubActivities');
                const currentSubs = savedSubs ? JSON.parse(savedSubs) : {};
                currentSubs[newEventId] = newSubActivity;
                localStorage.setItem('joinedSubActivities', JSON.stringify(currentSubs));
              } catch (e) {
                console.error(e);
              }
            }

            // Immediately update the on-page state!
            setSpotMeetups((prev) => [newEventItem, ...prev.filter((e) => e.id !== newEventId)]);
            setJoinedEventIds((prev) => [newEventId, ...prev]);
            showToast(`เปิดตี้ชวนเที่ยว "${newTrip.title}" สำเร็จเรียบร้อย`);
          }}
        />
      )}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        initialLocation={spot ? `${spot.title}, ${spot.district}, จังหวัด${spot.province}` : undefined}
        initialTitle={spot ? `ชวนไปเที่ยว ${spot.title}` : undefined}
        initialImage={spot?.image}
        onCreateSuccess={(newEvent: EventItem) => {
          setSpotMeetups((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย`);
        }}
      />
      {spot && (
        <ReportSafetyModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetTitle={spot.title}
          targetHostName={spot.province}
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
