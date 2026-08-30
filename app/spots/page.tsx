'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  LocateFixed,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SpotCard } from '@/components/SpotCard';
import { Pagination } from '@/components/Pagination';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { MOCK_SPOTS, SPOT_CATEGORIES, ALL_THAI_PROVINCES, LifestyleSpotItem } from '@/data/spotsData';
import { SpotCategoryRail, NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { EventItem } from '@/data/mockData';

const ITEMS_PER_PAGE = 24;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function SpotsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedRailCategory, setSelectedRailCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState<string>(searchParams.get('province') || 'all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free'>((searchParams.get('price') as any) || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'favorites'>('newest');
  const [sortByNearMe, setSortByNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>(['spot-bkk-1']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกสถานที่โปรด');
      setIsRequireMembershipOpen(true);
      return;
    }
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      if (isFav) {
        showToast('ลบออกจากรายการบันทึกแล้ว');
        return prev.filter((id) => id !== spotId);
      } else {
        showToast('บันทึกสถานที่เรียบร้อยแล้ว');
        return [...prev, spotId];
      }
    });
  };

  const handleToggleNearMe = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
      setUserLocation(null);
      showToast('ปิดการค้นหาตามระยะทางแล้ว');
      return;
    }
    setIsLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('เรียงสถานที่จากใกล้คุณไปไกลเรียบร้อย');
        },
        (err) => {
          setUserLocation({ lat: 13.7466, lng: 100.5349 });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('เรียงสถานที่จากโซนใจกลางเมืองให้เรียบร้อย');
        },
        { timeout: 8000 }
      );
    }
  };

  const filteredSpots = useMemo(() => {
    let result = MOCK_SPOTS.filter((spot) => {
      if (selectedRailCategory && selectedRailCategory !== 'all') {
        const catDef = NATIONWIDE_SPOT_CATEGORIES.find((c) => c.id === selectedRailCategory);
        if (catDef) {
          const text = `${spot.title} ${spot.category} ${spot.categoryLabel} ${spot.description} ${spot.province} ${(spot.vibeTags || []).join(' ')} ${(spot.highlights || []).join(' ')}`.toLowerCase();
          const matches = catDef.keywords.some((kw) => text.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }
      if (selectedCategory !== 'all' && spot.category !== selectedCategory) return false;
      if (selectedProvince !== 'all') {
        const pLower = selectedProvince.toLowerCase();
        const spotProv = spot.province.toLowerCase();
        if (!spotProv.includes(pLower) && !pLower.includes(spotProv)) return false;
      }
      if (sortBy === 'favorites' && !favoriteSpots.includes(spot.id)) return false;
      if (priceFilter === 'free' && !spot.price.includes('ฟรี')) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = spot.title.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        const matchVibeTags = (spot.vibeTags || []).some((t: string) => t.toLowerCase().includes(q));
        const matchDistrict = (spot.district || '').toLowerCase().includes(q);
        const matchProv = spot.province.toLowerCase().includes(q);
        const matchHighlights = (spot.highlights || []).some((h: string) => h.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchVibeTags && !matchDistrict && !matchProv && !matchHighlights) return false;
      }
      return true;
    }).map((spot) => {
      if (sortByNearMe && userLocation && spot.latitude && spot.longitude) {
        return {
          ...spot,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude),
        };
      }
      return spot;
    });

    if (sortByNearMe) {
      result.sort((a, b) => ((a as any).distanceKm ?? 999) - ((b as any).distanceKm ?? 999));
    } else {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [selectedRailCategory, selectedCategory, selectedProvince, priceFilter, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery]);

  const spotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of NATIONWIDE_SPOT_CATEGORIES) {
      counts[cat.id] = MOCK_SPOTS.filter((spot) => {
        const text = `${spot.title} ${spot.category} ${spot.categoryLabel} ${spot.description} ${spot.province} ${(spot.vibeTags || []).join(' ')} ${(spot.highlights || []).join(' ')}`.toLowerCase();
        return cat.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).length;
    }
    return counts;
  }, []);

  const totalPages = Math.ceil(filteredSpots.length / ITEMS_PER_PAGE) || 1;
  const paginatedSpots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSpots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSpots, currentPage]);

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
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setIsAuthModalOpen(true);
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Bar with Breadcrumb */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900">พิกัดเที่ยว & จุดฮีลใจทั่วไทย</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                พิกัดเที่ยว & จุดฮีลใจทั่วไทย
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                ค้นพบสถานที่ท่องเที่ยว คาเฟ่ สวนสาธารณะ และสเปซพักผ่อนกว่า {filteredSpots.length} แห่งใน 77 จังหวัด
              </p>
            </div>
          </div>
        </div>

        {/* Nationwide Spot Category Rail */}
        <SpotCategoryRail
          selectedCategoryId={selectedRailCategory}
          onSelectCategory={(catId) => {
            setSelectedRailCategory(catId);
            setCurrentPage(1);
          }}
          spotCounts={spotCounts}
        />

        {/* Filter & Search Bar */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          
          {/* Top: Search Input + Dropdowns */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 flex items-center bg-white rounded-xl border border-slate-200 px-3 py-2 focus-within:border-[#4A7C59]">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่อสถานที่ ย่าน หรือคีย์เวิร์ด..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-48 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกหมวดหมู่สถานที่"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none pr-8"
              >
                {SPOT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Province Select */}
            <div className="relative w-full md:w-48 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="เลือกจังหวัด"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none pr-8"
              >
                <option value="all">ทุกจังหวัด (77 จังหวัด)</option>
                {ALL_THAI_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Free Button */}
            <button
              type="button"
              onClick={() => {
                setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                priceFilter === 'free'
                  ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              เข้าฟรี
            </button>

            {/* Near Me Button */}
            <button
              type="button"
              onClick={handleToggleNearMe}
              disabled={isLocating}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortByNearMe
                  ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{isLocating ? 'กำลังหาพิกัด...' : sortByNearMe ? 'ใกล้ฉัน (เปิด)' : 'ใกล้ฉัน'}</span>
            </button>

            {/* Favorites Button */}
            <button
              type="button"
              onClick={() => {
                setSortBy(sortBy === 'favorites' ? 'newest' : 'favorites');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                sortBy === 'favorites'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white' : 'text-slate-400'}`} />
              <span>ที่บันทึกไว้ ({favoriteSpots.length})</span>
            </button>

          </div>

          {/* Result Count & Reset */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
            <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredSpots.length}</strong> แห่ง</span>
            {(searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all' || priceFilter !== 'all' || sortBy === 'favorites' || sortByNearMe) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedProvince('all');
                  setPriceFilter('all');
                  setSortBy('newest');
                  setSortByNearMe(false);
                  setCurrentPage(1);
                  showToast('ล้างตัวกรองทั้งหมดแล้ว');
                }}
                className="text-xs text-slate-500 hover:text-[#4A7C59] hover:underline cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

        </div>

        {/* High-Density Spots Grid (4 cols on desktop, 5 cols on 2xl) */}
        {filteredSpots.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
              {paginatedSpots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  isFavorite={favoriteSpots.includes(spot.id)}
                  onToggleFavorite={(id) => toggleFavoriteSpot(id)}
                />
              ))}
            </div>

            {/* Pagination Bar */}
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                totalItems={filteredSpots.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemUnit="สถานที่"
              />
            </div>
          </>
        ) : (
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
                  ยังไม่พบสถานที่ตามเงื่อนไขนี้
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  ลองปรับเปลี่ยนคำค้นหา หรือเลือกจังหวัดอื่นๆ เพื่อสำรวจสถานที่เพิ่มเติม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRailCategory(null);
                setSelectedCategory('all');
                setSelectedProvince('all');
                setPriceFilter('all');
                setSortBy('newest');
                setSortByNearMe(false);
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
            >
              <span>ดูสถานที่ทั้งหมด</span>
            </button>
          </div>
        )}

      </main>

      {/* Modals & Helpers */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จ!`);
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
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favoriteSpots.length}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default function SpotsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-sm">กำลังโหลดข้อมูลสถานที่...</div>}>
      <SpotsPageContent />
    </Suspense>
  );
}
