'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventItem } from '@/data/mockData';
import {
  getSpotById,
  getNearbySpots,
  LifestyleSpotItem,
  MOCK_SPOTS
} from '@/data/spotsData';
import { resolveSpotGallery, resolveSpotImage } from '@/lib/spotImageResolver';
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
  Tag
} from 'lucide-react';

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [activeNavTab, setActiveNavTab] = useState('spots');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  // Lightbox State
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

  // Nearby spots
  const nearbySpots = useMemo(() => {
    if (!spot) return [];
    return getNearbySpots(spot, 4);
  }, [spot]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavs = localStorage.getItem('favorite_spots');
      if (savedFavs) {
        try {
          setFavorites(JSON.parse(savedFavs));
        } catch {
          // ignore
        }
      }
    }
  }, [decodedId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (spotId: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(spotId);
      let updated: string[];
      if (isFav) {
        updated = prev.filter((id) => id !== spotId);
        showToast('ลบออกจากรายการโปรดแล้ว');
      } else {
        updated = [...prev, spotId];
        showToast('บันทึกสถานที่นี้ในรายการโปรดเรียบร้อย! ❤️');
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
        showToast('แชร์สถานที่เรียบร้อย! 🎉');
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('คัดลอกลิงก์สถานที่แล้ว ส่งให้เพื่อนได้เลย! 📋✨');
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
          <div className="w-16 h-16 bg-orange-50 text-[#F26430] rounded-2xl flex items-center justify-center mx-auto text-2xl">
            📍
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลสถานที่ท่องเที่ยวนี้</h1>
          <p className="text-sm text-slate-600">สถานที่นี้อาจถูกย้ายหรือไม่มีอยู่ในระบบ</p>
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

  const isFavorite = favorites.includes(spot.id);

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
            <Link href="/" className="hover:text-[#F26430] transition-colors font-semibold py-2 px-1">หน้าแรก</Link>
            <span className="py-2">/</span>
            <Link href="/?tab=spots" className="hover:text-[#F26430] transition-colors py-2 px-1 font-semibold">สถานที่เที่ยว & จุดฮีลใจ</Link>
            <span className="py-2">/</span>
            <span className="text-slate-700 font-semibold py-2 px-1">{spot.province}</span>
            <span className="py-2">/</span>
            <span className="text-slate-900 font-bold truncate py-2 px-1">{spot.title}</span>
          </nav>

          {/* Right: Favorite & Share Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavorite(spot.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              <span>{isFavorite ? 'บันทึกแล้ว' : 'บันทึก'}</span>
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
          </div>

        </div>

        {/* =========================================================================
            EDITORIAL 5-8 PHOTO MOSAIC GALLERY
           ========================================================================= */}
        <section className="space-y-2">
          
          {/* Photo Mosaic Grid (Desktop 5-Photo Hero, Mobile 1 Main + Carousel) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 rounded-3xl overflow-hidden bg-slate-100 max-h-[460px] relative group">
            
            {/* Main Big Photo (Left - 2 Cols x 2 Rows) */}
            <div
              onClick={() => {
                setActivePhotoIndex(0);
                setIsLightboxOpen(true);
              }}
              className="md:col-span-2 md:row-span-2 relative h-64 md:h-[460px] overflow-hidden cursor-pointer bg-slate-200"
            >
              <img
                src={galleryImages[0] || spot.image}
                alt={`${spot.title} บรรยากาศ 1`}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 hover:opacity-20 transition-opacity" />
              
              {/* Badge Over Photo */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md text-xs font-black text-[#F26430] border border-white/60">
                <MapPin className="w-3.5 h-3.5" />
                <span>{spot.categoryLabel}</span>
              </div>
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
                  className="hidden md:block relative h-[225px] overflow-hidden cursor-pointer bg-slate-200"
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
            <span>💡 แตะที่รูปเพื่อเปิดดูภาพบรรยากาศขนาดใหญ่ (Fullscreen Lightbox)</span>
            <span className="hidden sm:inline">คลังภาพบรรยากาศ {galleryImages.length} มุมมอง</span>
          </div>

        </section>

        {/* =========================================================================
            CORE CONTENT: 2-COLUMN EDITORIAL LAYOUT
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-2">
          
          {/* LEFT COLUMN: PRIMARY DETAILS (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Title & Ratings */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-orange-50 text-[#F26430] border border-orange-200">
                  {spot.categoryLabel}
                </span>

                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  spot.price.includes('ฟรี')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {spot.price.includes('ฟรี') ? '🎉 เข้าฟรีไม่มีค่าใช้จ่าย' : `🏷️ ${spot.price}`}
                </span>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{spot.rating}</span>
                  <span className="text-slate-400 font-normal">({spot.reviewsCount || 480} รีวิว)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {spot.title}
              </h1>

              {/* Vibe Tags */}
              {spot.vibeTags && spot.vibeTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {spot.vibeTags.map((vibe, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-xl transition-colors"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* About / Description Section */}
            <div className="space-y-2.5 pt-2">
              <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                <Compass className="w-4 h-4 text-[#4A7C59]" />
                <span>เกี่ยวกับสถานที่นี้</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {spot.description}
              </p>
            </div>

            {/* Highlights Section */}
            {spot.highlights && spot.highlights.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#F26430]" />
                  <span>จุดเด่น & ไฮไลท์ที่ไม่ควรพลาด</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {spot.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50/50 border border-orange-100 text-xs sm:text-sm text-slate-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#F26430] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities & Transit Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2 tracking-wider">
                <Car className="w-4 h-4 text-[#2B527A]" />
                <span>สิ่งอำนวยความสะดวก & การเดินทาง</span>
              </h2>

              {spot.transitInfo && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block font-bold mb-0.5">การเดินทาง:</strong>
                  {spot.transitInfo}
                </div>
              )}

              {spot.facilities && spot.facilities.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {spot.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold text-slate-700 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{fac}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Moments & Photos Community Feed Link */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span>แชร์ภาพโมเมนต์ & ดูรีวิวจากคอมมูนิตี้</span>
                </div>
                <p className="text-xs text-slate-600">
                  มีผู้เช็คอินและบันทึกโมเมนต์ที่ <strong>{spot.title}</strong> แล้วกว่า <strong>{spot.interestedCount || 52} คน</strong>
                </p>
              </div>

              <Link
                href={`/moments?location=${encodeURIComponent(spot.title)}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 active:scale-95"
              >
                <span>เปิดดู Moments ฟีด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY PLACE SUMMARY & DIRECTIONS CARD (1 Col) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">
            
            {/* Quick Info Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">เปิดให้บริการ</span>
                </div>
                <span className="text-xs font-black text-slate-900">{spot.price}</span>
              </div>

              {/* Operating Hours */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>เวลาเปิด-ปิด</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900">{spot.openHours}</p>
              </div>

              {/* Best Time to Visit */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                  <span>ช่วงเวลาแนะนำ</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{spot.bestTime}</p>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                  <span>พิกัด & ย่าน</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{spot.district}, {spot.province}</p>
              </div>

              {/* Google Maps Button */}
              <a
                href={spot.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#F26430] hover:bg-[#D95322] text-white py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>นำทางด้วย Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Quest Banner Helper */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-900 truncate">มีเควสต์สะสม XP ที่นี่</span>
                </div>
                <Link
                  href="/challenges"
                  className="font-extrabold text-amber-900 hover:text-amber-950 underline shrink-0 text-[11px]"
                >
                  ดูเควสต์ ➔
                </Link>
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================================
            NEARBY RECOMMENDED SPOTS IN THE SAME PROVINCE
           ========================================================================= */}
        {nearbySpots.length > 0 && (
          <section className="pt-10 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  สถานที่แนะนำอื่นๆ ใน {spot.province} 🌿
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  จุดเช็คอินและที่เที่ยวยอดฮิตที่น่าแวะไปต่อในทริปเดียวกัน
                </p>
              </div>

              <Link
                href={`/?province=${encodeURIComponent(spot.province)}`}
                className="text-xs font-extrabold text-[#F26430] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>ดูทั้งหมดใน {spot.province}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbySpots.map((item) => (
                <Link
                  key={item.id}
                  href={`/spots/${encodeURIComponent(item.id)}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={resolveSpotImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                      <Star className="w-2.5 h-2.5 fill-slate-950" />
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>{item.categoryLabel}</span>
                        <span className="text-[#F26430]">{item.price.includes('ฟรี') ? 'เข้าฟรี' : item.price}</span>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#F26430] transition-colors mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        📍 {item.district}, {item.province}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#F26430]">
                      <span>ดูข้อมูลสถานที่</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
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
                    ? 'border-[#F26430] scale-105 ring-2 ring-[#F26430]/40'
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
