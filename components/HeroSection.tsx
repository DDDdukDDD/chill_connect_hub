'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Dices, 
  Sparkles, 
  MapPin, 
  Zap, 
  Award, 
  ArrowRight, 
  Camera,
  Compass,
  Trees,
  Mountain,
  Waves,
  Coffee,
  Landmark,
  Palette,
  Flame,
  Building2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trophy,
  ShoppingBag,
  ExternalLink,
  Users,
  ShieldCheck,
  Ticket,
  Gift,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { ALL_THAI_PROVINCES, MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { ChallengeQuest, MOCK_EVENTS, EventItem } from '@/data/mockData';
import {
  MASTER_SPOT_CATEGORIES,
  MASTER_COMMUNITY_LIFESTYLE_CATEGORIES,
  MASTER_FAIR_CATEGORIES,
} from '@/data/masterHub';
import Link from 'next/link';

export type HeroVersion = 'editorial' | 'classic';

export interface HeroSlideItem {
  id: string;
  pillar: 'spots' | 'community' | 'fairs' | 'challenges';
  tag: string;
  titleLead: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
}

export const HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-community',
    pillar: 'community',
    tag: 'กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่',
    titleLead: 'วันหยุดนี้...',
    titleHighlight: 'ไปจอยตี้ไหนดี?',
    subtitle: 'หาเพื่อนใหม่กลุ่มย่อย วิ่ง บอร์ดเกม เวิร์กช็อป ตี้กาแฟ ในคอมมูนิตี้ที่ปลอดภัยไร้แรงกดดัน',
    imageUrl: '/hero-bkk-community-golden.jpg',
    imageAlt: 'วิ่งออกกำลังกายและคอมมูนิตี้ริมทะเลสาบสวนสาธารณะกรุงเทพฯ ท่ามกลางแสงแดดอบอุ่น',
  },
  {
    id: 'slide-fairs',
    pillar: 'fairs',
    tag: 'งานมหกรรม & เอ็กซ์โป',
    titleLead: 'วันหยุดนี้...',
    titleHighlight: 'ไปเดินงานไหนดี?',
    subtitle: 'อัปเดตงานอีเวนต์ใหญ่ นิทรรศการ งานหนังสือ เทศกาลกาแฟ และเอ็กซ์โปทั่วประเทศ',
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'งานนิทรรศการ อาร์ตสเปซ และงานเอ็กซ์โปทั่วไทย',
  },
  {
    id: 'slide-spots',
    pillar: 'spots',
    tag: 'พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด',
    titleLead: 'วันหยุดนี้...',
    titleHighlight: 'ไปพักใจที่ไหนดี?',
    subtitle: 'รวมจุดพักใจ คาเฟ่ ชุมชนลับ และธรรมชาติ 77 จังหวัดทั่วไทย เที่ยวชิลล์ๆ ได้ด้วยตัวเอง',
    imageUrl: '/hero-bkk-park-sunny.jpg',
    imageAlt: 'สวนสาธารณะใจกลางกรุงเทพฯ ท้องฟ้าโปร่ง แสงแดดสดใส วิวเมืองและทะเลสาบฮีลใจ',
  },
  {
    id: 'slide-challenges',
    pillar: 'challenges',
    tag: 'ชาเลนจ์ & พิกัดทะเล 77 จังหวัด',
    titleLead: 'วันหยุดนี้...',
    titleHighlight: 'ไปเที่ยวทะเลไหนดี?',
    subtitle: 'เช็กลิสต์พิกัดเกาะพีพีและทะเล 77 จังหวัด พิชิตเควสต์สะสมแต้ม XP แลกรับสิทธิ์ฟรี',
    imageUrl: '/hero-koh-phi-phi.jpg',
    imageAlt: 'ทะเลเกาะพีพี อ่าวมาหยา น้ำทะเลสีมรกตใส เรือหางยาวและหน้าผาหินปูน',
  },
];

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvince?: string;
  setSelectedProvince?: (province: string) => void;
  onSearchSubmit?: () => void;
  onOpenSurpriseModal?: (mode?: 'all' | 'spots' | 'community' | 'fairs') => void;
  initialVersion?: HeroVersion;
  onVersionChange?: (version: HeroVersion) => void;
  onJoinQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onCancelQuest?: (questTitle: string) => void;
  onSelectDiscoveryTab?: (tab: 'all' | 'spots' | 'community' | 'fairs') => void;
  timeFilter?: string;
  setTimeFilter?: (time: any) => void;
  startDate?: string;
  endDate?: string;
  onOpenDatePicker?: () => void;
  onClearCustomDate?: () => void;
}

const parseDateParts = (dateStr?: string) => {
  if (!dateStr) return null;
  const monthNames = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  if (dateStr.includes('/')) {
    const p = dateStr.split('/');
    const d = parseInt(p[0], 10);
    const m = monthNames[parseInt(p[1], 10)] || '';
    return { d, m };
  }
  if (dateStr.includes('-')) {
    const p = dateStr.split('-');
    if (p[0].length === 4) {
      const d = parseInt(p[2], 10);
      const m = monthNames[parseInt(p[1], 10)] || '';
      return { d, m };
    }
    const d = parseInt(p[0], 10);
    const m = monthNames[parseInt(p[1], 10)] || '';
    return { d, m };
  }
  return null;
};

const formatDateDisplay = (start?: string, end?: string): string => {
  const p1 = parseDateParts(start);
  if (!p1) return '';
  const p2 = parseDateParts(end);
  if (!p2 || (p1.d === p2.d && p1.m === p2.m)) {
    return `${p1.d} ${p1.m}`;
  }
  return p1.m === p2.m ? `${p1.d} - ${p2.d} ${p1.m}` : `${p1.d} ${p1.m} - ${p2.d} ${p2.m}`;
};


export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedProvince = 'all',
  setSelectedProvince,
  onSearchSubmit,
  onOpenSurpriseModal,
  initialVersion = 'editorial',
  onVersionChange,
  onJoinQuest,
  joinedQuestTitles = [],
  onCancelQuest,
  onSelectDiscoveryTab,
  timeFilter = 'all',
  setTimeFilter,
  startDate,
  endDate,
  onOpenDatePicker,
  onClearCustomDate,
}) => {
  const { isLoggedIn } = useAuth();
  const [version, setVersion] = useState<HeroVersion>(initialVersion);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);
  const [activeModeTab, setActiveModeTab] = useState<'all' | 'spots' | 'community' | 'fairs'>('all');
  const [showcaseTab, setShowcaseTab] = useState<'vouchers' | 'rewards'>('vouchers');
  const [internalTimeFilter, setInternalTimeFilter] = useState('all');
  const activeTime = timeFilter !== undefined ? timeFilter : internalTimeFilter;

  const handleTimeChange = (t: string) => {
    setInternalTimeFilter(t);
    if (setTimeFilter) setTimeFilter(t);
  };

  const handleProvinceChange = (prov: string) => {
    if (setSelectedProvince) setSelectedProvince(prov);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlHero = urlParams.get('hero');
      if (urlHero === 'editorial' || urlHero === 'classic') {
        setVersion(urlHero);
        if (onVersionChange) onVersionChange(urlHero);
        return;
      }
      const savedVersion = localStorage.getItem('chill_hero_version') as HeroVersion | null;
      if (savedVersion === 'editorial' || savedVersion === 'classic') {
        setVersion(savedVersion);
        if (onVersionChange) onVersionChange(savedVersion);
      }
    }
  }, []);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Klook-Style Auto-slide every 5.5s, pauses gracefully on hover or search focus
  useEffect(() => {
    if (isHeroHovered || isFocused) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHeroHovered, isFocused]);

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);

  // Auto-cycle through quests calmly every 10 seconds (Zero visual distraction)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuestIndex((q) => (q + 1) % COMMUNITY_PUBLIC_QUESTS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleScrollToQuests = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('community-quests-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('ring-4', 'ring-purple-500/40', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-purple-500/40');
        }, 2000);
      }
    }
  };

  const handleScrollToWhySection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const el = document.getElementById('why-chill-and-connect');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSwitchVersion = (newVersion: HeroVersion) => {
    setVersion(newVersion);
    if (onVersionChange) onVersionChange(newVersion);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chill_hero_version', newVersion);
      const url = new URL(window.location.href);
      url.searchParams.set('hero', newVersion);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      setIsFocused(false);
      onSearchSubmit();
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeModeTab) {
      case 'spots':
        return 'ค้นหาจุดพักใจ คาเฟ่ ชุมชนลับ เชียงใหม่ อารีย์ น่าน...';
      case 'community':
        return 'ค้นหาตี้วิ่งสวนเบญ บอร์ดเกมสยาม เวิร์กช็อปศิลปะ ตี้กาแฟ...';
      case 'fairs':
        return 'ค้นหางานสัปดาห์หนังสือ งานกาแฟ งานสัตว์เลี้ยง QSNCC BITEC...';
      default:
        return 'ค้นหาพิกัดฮีลใจ, ตี้วิ่ง, บอร์ดเกม, งานแฟร์ทั่วไทย...';
    }
  };

  const handleTabClick = (tab: 'all' | 'community' | 'fairs' | 'spots') => {
    setActiveModeTab(tab);
    if (tab === 'community') setCurrentSlideIndex(0);
    else if (tab === 'fairs') setCurrentSlideIndex(1);
    else if (tab === 'spots') setCurrentSlideIndex(2);
    if (onSelectDiscoveryTab) {
      onSelectDiscoveryTab(tab);
    }
  };

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  const displayTitleLead = 'วันหยุดนี้...';

  const displayTitleHighlight = activeModeTab === 'all'
    ? 'ไปไหนดี'
    : activeModeTab === 'community'
    ? 'ไปจอยตี้ไหนดี?'
    : activeModeTab === 'fairs'
    ? 'ไปเดินงานไหนดี?'
    : activeModeTab === 'spots'
    ? 'ไปพักใจที่ไหนดี?'
    : currentSlide.titleHighlight;

  const displaySubtitle = activeModeTab === 'all'
    ? 'รวมจุดพักใจ คาเฟ่ ตี้เพื่อนใหม่ เวิร์กช็อป และงานอีเวนต์ทั่วไทย ครบจบในที่เดียว'
    : activeModeTab === 'community'
    ? 'หาเพื่อนใหม่กลุ่มย่อย วิ่ง บอร์ดเกม เวิร์กช็อป ตี้กาแฟ ในคอมมูนิตี้ที่ปลอดภัยไร้แรงกดดัน'
    : activeModeTab === 'fairs'
    ? 'อัปเดตงานอีเวนต์ใหญ่ นิทรรศการ งานหนังสือ เทศกาลกาแฟ และเอ็กซ์โปทั่วประเทศ'
    : activeModeTab === 'spots'
    ? 'รวมจุดพักใจ คาเฟ่ ชุมชนลับ และธรรมชาติ 77 จังหวัดทั่วไทย เที่ยวชิลล์ๆ ได้ด้วยตัวเอง'
    : currentSlide.subtitle;

  // 3 Micro Trust Badges mapped dynamically to the active discovery tab
  const heroTrustBadges = useMemo(() => {
    switch (activeModeTab) {
      case 'community':
        return [
          {
            id: 'b1',
            icon: <span className="text-emerald-400 font-extrabold">✓</span>,
            text: 'รวมกิจกรรมสำหรับออกไปใช้ชีวิต',
          },
          {
            id: 'b2',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            text: 'คอมมูนิตี้ปลอดภัย',
          },
          {
            id: 'b3',
            icon: <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
            text: 'พบเพื่อน มิตรภาพใหม่',
          },
        ];
      case 'fairs':
        return [
          {
            id: 'b1',
            icon: <span className="text-emerald-400 font-extrabold">✓</span>,
            text: 'รวมกิจกรรมสาธารณะ',
          },
          {
            id: 'b2',
            icon: <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
            text: 'ตอบโจทย์ กิจกรรมวันหยุด',
          },
          {
            id: 'b3',
            icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            text: 'คัดสรรค์ข้อมูลผ่านระบบ AI คุณภาพสูง',
          },
        ];
      case 'spots':
        return [
          {
            id: 'b1',
            icon: <span className="text-emerald-400 font-extrabold">✓</span>,
            text: 'คัดสรรพิกัดเที่ยวทั่วไทย',
          },
          {
            id: 'b2',
            icon: <Trees className="w-3.5 h-3.5 text-emerald-300 shrink-0" />,
            text: 'ตอบโจทย์การพักผ่อน',
          },
          {
            id: 'b3',
            icon: <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
            text: 'สถานที่ฮีลใจ ผ่อนคลาย',
          },
        ];
      case 'all':
      default:
        return [
          {
            id: 'b1',
            icon: <span className="text-emerald-400 font-extrabold">✓</span>,
            text: 'คัดสรรกิจกรรมและสถานที่คุณภาพ',
          },
          {
            id: 'b2',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            text: 'คอมมูนิตี้ปลอดภัย',
          },
          {
            id: 'b3',
            icon: <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />,
            text: 'สิทธิพิเศษ & รางวัลไลฟ์สไตล์',
          },
        ];
    }
  }, [activeModeTab]);

  // =========================================================================
  // 🌟 Dynamic Discovery Pillars Taxonomy (Derived from Master Taxonomy Hub)
  // =========================================================================
  const PILLAR_SPOT_CATEGORIES = useMemo(() => {
    return MASTER_SPOT_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.name,
      query: c.keywords[1] || c.keywords[0] || c.name,
      icon: c.icon,
      sub: c.description || c.nameEn,
    }));
  }, []);

  const PILLAR_COMMUNITY_CATEGORIES = useMemo(() => {
    return MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.name,
      query: c.keywords[0] || c.name,
      icon: c.icon,
      sub: c.desc || c.nameEn,
    }));
  }, []);

  const PILLAR_FAIR_CATEGORIES = useMemo(() => {
    return MASTER_FAIR_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.name,
      query: c.keywords[0] || c.name,
      icon: c.icon,
      sub: c.nameEn || (c.keywords && c.keywords.slice(0, 3).join(', ')),
    }));
  }, []);

  // =========================================================================
  // 🔍 Dynamic Predictive Search Filters (Matched against real entities)
  // =========================================================================
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isTyping = trimmedQuery.length > 0;

  const matchedSpots = useMemo(() => {
    if (!isTyping) return [];
    if (activeModeTab !== 'all' && activeModeTab !== 'spots') return [];
    return MOCK_SPOTS.filter((s) => {
      return (
        s.title?.toLowerCase().includes(trimmedQuery) ||
        s.province?.toLowerCase().includes(trimmedQuery) ||
        s.district?.toLowerCase().includes(trimmedQuery) ||
        s.categoryLabel?.toLowerCase().includes(trimmedQuery) ||
        s.vibeTags?.some((v) => v.toLowerCase().includes(trimmedQuery)) ||
        s.description?.toLowerCase().includes(trimmedQuery)
      );
    }).slice(0, activeModeTab === 'spots' ? 6 : 4);
  }, [trimmedQuery, isTyping, activeModeTab]);

  const matchedCommunity = useMemo(() => {
    if (!isTyping) return [];
    if (activeModeTab !== 'all' && activeModeTab !== 'community') return [];
    return MOCK_EVENTS.filter((e) => {
      if (e.eventType === 'public_venue') return false;
      return (
        e.title?.toLowerCase().includes(trimmedQuery) ||
        e.location?.toLowerCase().includes(trimmedQuery) ||
        e.tag?.toLowerCase().includes(trimmedQuery) ||
        e.province?.toLowerCase().includes(trimmedQuery) ||
        e.hostName?.toLowerCase().includes(trimmedQuery) ||
        e.description?.toLowerCase().includes(trimmedQuery)
      );
    }).slice(0, activeModeTab === 'community' ? 6 : 4);
  }, [trimmedQuery, isTyping, activeModeTab]);

  const matchedFairs = useMemo(() => {
    if (!isTyping) return [];
    if (activeModeTab !== 'all' && activeModeTab !== 'fairs') return [];
    return MOCK_EVENTS.filter((e) => {
      if (e.eventType !== 'public_venue') return false;
      return (
        e.title?.toLowerCase().includes(trimmedQuery) ||
        e.location?.toLowerCase().includes(trimmedQuery) ||
        e.tag?.toLowerCase().includes(trimmedQuery) ||
        e.province?.toLowerCase().includes(trimmedQuery) ||
        e.venueTag?.toLowerCase().includes(trimmedQuery) ||
        e.hostName?.toLowerCase().includes(trimmedQuery) ||
        e.description?.toLowerCase().includes(trimmedQuery)
      );
    }).slice(0, activeModeTab === 'fairs' ? 6 : 4);
  }, [trimmedQuery, isTyping, activeModeTab]);

  const totalMatches = matchedSpots.length + matchedCommunity.length + matchedFairs.length;

  const renderSearchSuggestions = () => {
    if (!isFocused) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[100] text-left animate-fade-in max-h-[460px] overflow-y-auto divide-y divide-slate-100">
        {/* CASE 1: Typing state (Dynamic Live Predictive Search grouped by 3 Core Pillars) */}
        {isTyping ? (
          <div className="p-2.5 sm:p-3 space-y-3">
            {totalMatches === 0 ? (
              <div className="py-6 px-4 text-center bg-slate-50/80 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  ไม่พบผลลัพธ์ที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                  {activeModeTab === 'spots' && ' ในหมวดพิกัดเที่ยว'}
                  {activeModeTab === 'community' && ' ในหมวดกิจกรรมคอมมูนิตี้'}
                  {activeModeTab === 'fairs' && ' ในหมวดงานมหกรรม & เอ็กซ์โป'}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {activeModeTab === 'spots'
                    ? 'ลองค้นหาด้วยคำสำคัญ เช่น คาเฟ่, ธรรมชาติ, น่าน, วิวเขา หรือกดปุ่มค้นหาเพื่อดูพิกัดทั้งหมด'
                    : activeModeTab === 'community'
                    ? 'ลองค้นหาด้วยคำสำคัญ เช่น วิ่ง, บอร์ดเกม, กาแฟ, เวิร์กช็อป หรือกดปุ่มค้นหาเพื่อดูกิจกรรมทั้งหมด'
                    : activeModeTab === 'fairs'
                    ? 'ลองค้นหาด้วยคำสำคัญ เช่น หนังสือ, สัตว์เลี้ยง, กาแฟ, QSNCC หรือกดปุ่มค้นหาเพื่อดูงานแฟร์ทั้งหมด'
                    : 'ลองค้นหาด้วยคำสำคัญ เช่น คาเฟ่, วิ่ง, สวน, ทะเล หรือกดปุ่มค้นหาเพื่อดูผลทั้งหมดในระบบ'}
                </p>
                <button
                  type="button"
                  onMouseDown={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-[#4A7C59] hover:underline cursor-pointer"
                >
                  ล้างคำค้นหา
                </button>
              </div>
            ) : (
              <>
                {/* 1. 👥 กิจกรรมคอมมูนิตี้ที่พบ (Community) */}
                {matchedCommunity.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#F26430]" />
                        <span>กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                        พบ {matchedCommunity.length} กิจกรรม
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchedCommunity.map((comm) => (
                        <Link
                          key={`matched-comm-${comm.id}`}
                          href={`/community/${comm.id}`}
                          onMouseDown={() => setIsFocused(false)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50/70 transition-colors group cursor-pointer"
                        >
                          <img
                            src={comm.image}
                            alt={comm.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 group-hover:text-[#C2410C] truncate">
                              {comm.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{comm.province || comm.location}</span>
                              <span>•</span>
                              <span>{comm.date}</span>
                              {comm.hostName && (
                                <>
                                  <span>•</span>
                                  <span>โดย {comm.hostName}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2 py-1 rounded-md shrink-0 border border-orange-100 group-hover:border-orange-200 flex items-center gap-1">
                            <span>ดูกิจกรรม</span>
                            <ChevronRight className="w-3 h-3 text-[#F26430]" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. 🏛️ งานมหกรรม & เอ็กซ์โปที่พบ (Fairs) */}
                {matchedFairs.length > 0 && (
                  <div className={`space-y-1 ${matchedCommunity.length > 0 ? 'pt-2 border-t border-slate-100' : ''}`}>
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>งานมหกรรม & เอ็กซ์โป</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                        พบ {matchedFairs.length} งาน
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchedFairs.map((fair) => (
                        <Link
                          key={`matched-fair-${fair.id}`}
                          href={`/fairs/${fair.id}`}
                          onMouseDown={() => setIsFocused(false)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/70 transition-colors group cursor-pointer"
                        >
                          <img
                            src={fair.image}
                            alt={fair.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 group-hover:text-blue-900 truncate">
                              {fair.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{fair.location}</span>
                              <span>•</span>
                              <span>{fair.date}</span>
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md shrink-0 border border-blue-100 group-hover:border-blue-200 flex items-center gap-1">
                            <span>ดูงานแฟร์</span>
                            <ChevronRight className="w-3 h-3 text-blue-700" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. 🌲 พิกัดเที่ยวที่พบ (Spots) */}
                {matchedSpots.length > 0 && (
                  <div className={`space-y-1 ${matchedCommunity.length > 0 || matchedFairs.length > 0 ? 'pt-2 border-t border-slate-100' : ''}`}>
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#2D5A3C] uppercase tracking-wider flex items-center gap-1.5">
                        <Mountain className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>พิกัดเที่ยว & จุดฮีลใจ</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#2D5A3C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        พบ {matchedSpots.length} แห่ง
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchedSpots.map((spot) => (
                        <Link
                          key={`matched-spot-${spot.id}`}
                          href={`/spots/${spot.id}`}
                          onMouseDown={() => setIsFocused(false)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#EBF3ED]/70 transition-colors group cursor-pointer"
                        >
                          <img
                            src={spot.image}
                            alt={spot.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 group-hover:text-[#2D5A3C] truncate">
                              {spot.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{spot.province}</span>
                              <span>•</span>
                              <span>{spot.categoryLabel || spot.vibeTags?.[0] || 'พิกัดเที่ยว'}</span>
                              {spot.openHours && (
                                <>
                                  <span>•</span>
                                  <span>{spot.openHours}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-1 rounded-md shrink-0 border border-emerald-100 group-hover:border-emerald-200 flex items-center gap-1">
                            <span>ดูพิกัด</span>
                            <ChevronRight className="w-3 h-3 text-[#4A7C59]" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Row: Full Search Submit */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onMouseDown={() => {
                  setIsFocused(false);
                  if (onSearchSubmit) onSearchSubmit();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-[#EBF3ED] text-slate-700 hover:text-[#2D5A3C] transition-all cursor-pointer group text-left border border-slate-200/70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4A7C59] shrink-0" />
                  <span className="text-xs font-semibold truncate">
                    ค้นหาคำว่า <strong className="font-bold text-slate-900 group-hover:text-[#2D5A3C]">&ldquo;{searchQuery}&rdquo;</strong>
                    {activeModeTab === 'spots' && ' ในหมวดพิกัดเที่ยว & จุดฮีลใจ'}
                    {activeModeTab === 'community' && ' ในหมวดกิจกรรมคอมมูนิตี้'}
                    {activeModeTab === 'fairs' && ' ในหมวดงานมหกรรม & เอ็กซ์โป'}
                    {activeModeTab === 'all' && ' ในหน้าฟีดหลัก'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white group-hover:bg-[#4A7C59] group-hover:text-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-transparent shrink-0">
                  กด Enter ↵
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* CASE 2: Empty Query State (Categorized Directory Filtered by Active Tab) */
          <div className="p-2.5 sm:p-3 space-y-4">
            <div className="px-1 pt-0.5 flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>
                  {activeModeTab === 'all' && 'สำรวจตามหมวดหมู่ 3 เสาหลัก (3 Discovery Pillars)'}
                  {activeModeTab === 'spots' && 'หมวดหมู่พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด'}
                  {activeModeTab === 'community' && 'หมวดหมู่กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่'}
                  {activeModeTab === 'fairs' && 'หมวดหมู่งานมหกรรม นิทรรศการ & เอ็กซ์โป'}
                </span>
              </p>
              <span className="text-[10px] text-slate-400 font-medium">คลิกเพื่อกรองค้นหา</span>
            </div>

            {/* 1. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups) */}
            {(activeModeTab === 'all' || activeModeTab === 'community') && (
              <div className="space-y-2">
                <div className="px-1 flex items-center justify-between">
                  <p className="text-[11px] font-black text-[#C2410C] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F26430]" />
                    <span>กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
                  </p>
                  <span className="text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/50">
                    8 สไตล์กิจกรรม
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PILLAR_COMMUNITY_CATEGORIES.map((sug, idx) => {
                    const IconComponent = sug.icon;
                    return (
                      <button
                        key={`comm-cat-${idx}`}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 hover:border-orange-200/90 hover:bg-orange-50/70 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-orange-50 text-[#F26430] group-hover:bg-[#F26430] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-[#C2410C] block truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#C2410C] px-1.5 py-0.5 rounded shrink-0 border border-slate-200/60">
                          {sug.query}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Venues) */}
            {(activeModeTab === 'all' || activeModeTab === 'fairs') && (
              <div className={`space-y-2 ${activeModeTab === 'all' ? 'pt-2 border-t border-slate-100' : ''}`}>
                <div className="px-1 flex items-center justify-between">
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                    <span>งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                  </p>
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                    6 ศูนย์จัดแสดง & ธีม
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PILLAR_FAIR_CATEGORIES.map((sug, idx) => {
                    const IconComponent = sug.icon;
                    return (
                      <button
                        key={`fair-cat-${idx}`}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 hover:border-blue-200/90 hover:bg-blue-50/70 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 block truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-blue-900 px-1.5 py-0.5 rounded shrink-0 border border-slate-200/60">
                          {sug.query}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. 🌲 พิกัดเที่ยว 7 ไวบ์ทั่วไทย (Spots & Chill) */}
            {(activeModeTab === 'all' || activeModeTab === 'spots') && (
              <div className={`space-y-2 ${activeModeTab === 'all' ? 'pt-2 border-t border-slate-100' : ''}`}>
                <div className="px-1 flex items-center justify-between">
                  <p className="text-[11px] font-black text-[#2D5A3C] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                    <span>พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด</span>
                  </p>
                  <span className="text-[10px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-md border border-emerald-200/50">
                    7 ไวบ์ยอดนิยม
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PILLAR_SPOT_CATEGORIES.map((sug, idx) => {
                    const IconComponent = sug.icon;
                    return (
                      <button
                        key={`spot-cat-${idx}`}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 hover:border-emerald-200/90 hover:bg-[#EBF3ED]/70 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#4A7C59] group-hover:bg-[#4A7C59] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-[#2D5A3C] block truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#2D5A3C] px-1.5 py-0.5 rounded shrink-0 border border-slate-200/60">
                          {sug.query}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative z-30 pt-1 sm:pt-2 pb-1">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative space-y-2">

        {version === 'editorial' && (
          <div 
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
            className="group relative transition-all duration-300"
          >
            {/* 1. Immersive Panoramic Lifestyle Carousel Window (Bright Luxury View - Fixed Equal Height) */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md h-[320px] sm:h-[350px] md:h-[370px] pb-24 sm:pb-28 md:pb-32 pt-6 sm:pt-8 px-4 sm:px-8 flex flex-col justify-start text-center">
              
              {/* Background Photos with Cross-fade */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                {HERO_SLIDES.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      currentSlideIndex === idx ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.imageAlt}
                      className="w-full h-full object-cover object-center scale-105 filter brightness-[1.02] contrast-[1.05] saturate-[1.08]"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
                {/* Luminous Overlays - High Clarity & Vibrant Nature (Crisp & Bright, No Muddy Filter) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-slate-950/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Prev / Next Carousel Navigation Arrows */}
              <button
                type="button"
                onClick={goToPrevSlide}
                className="absolute left-2 sm:left-4 top-1/3 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 border border-white/20"
                aria-label="สไลด์ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={goToNextSlide}
                className="absolute right-2 sm:right-4 top-1/3 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 border border-white/20"
                aria-label="สไลด์ถัดไป"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Centerpiece Content */}
              <div className="relative z-10 text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto w-full">
                {/* Headline (Crisp Bold White with Bright Accent) */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight [text-shadow:_0_2px_14px_rgba(0,0,0,0.85),_0_1px_3px_rgba(0,0,0,0.9)]">
                  {displayTitleLead}{' '}
                  <span className="text-[#FFD166] inline-block transition-all duration-300">
                    {displayTitleHighlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-white font-medium max-w-xl mx-auto [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]">
                  {displaySubtitle}
                </p>

                {/* Micro Trust Bar (Luxury Frosted Glass Capsules - Dynamically synced with Active Tab) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pt-1 text-[11px] sm:text-xs font-bold text-white transition-all duration-300">
                  {heroTrustBadges.map((badge) => (
                    <span
                      key={`${activeModeTab}-${badge.id}`}
                      className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xs animate-fade-in"
                    >
                      {badge.icon}
                      <span>{badge.text}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-1.5">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={`dot-${slide.id}`}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      currentSlideIndex === idx
                        ? 'w-6 h-1.5 bg-white shadow-sm'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                    }`}
                    aria-label={`ไปที่สไลด์ ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* 2. Floating All-in-One Lifestyle Search Console (Trip.com Luxury Booking Portal Style) */}
            <div className="relative -mt-[92px] sm:-mt-[106px] md:-mt-[116px] lg:-mt-[120px] z-50 w-[95%] sm:w-[92%] md:w-[90%] lg:w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[1200px] mx-auto px-2 sm:px-4">
              <div className="relative z-50 bg-white rounded-3xl p-3.5 sm:p-4 md:p-5 pb-2.5 sm:pb-3 md:pb-3.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18),0_4px_16px_rgba(15,23,42,0.04)] border border-slate-200/90 space-y-3 sm:space-y-3.5">
                
                {/* Trip.com Signature Navigation Tabs: Icon Above Label with Active Underline Bar */}
                <div className="flex items-end justify-between border-b border-slate-200/90 px-1 sm:px-2 overflow-x-auto overflow-y-hidden no-scrollbar gap-4 sm:gap-8 select-none">
                  <div className="flex items-end gap-4 sm:gap-8 shrink-0">
                    {/* Tab 1: ทั้งหมด */}
                    <button
                      type="button"
                      onClick={() => handleTabClick('all')}
                      className="flex flex-col items-center gap-1.5 pt-1 pb-3 sm:pb-3.5 relative group cursor-pointer transition-all shrink-0"
                    >
                      <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        activeModeTab === 'all' ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span className={`text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        activeModeTab === 'all' ? 'font-black text-[#2563EB]' : 'font-semibold text-slate-500 group-hover:text-slate-800'
                      }`}>
                        ทั้งหมด
                      </span>
                      {activeModeTab === 'all' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2563EB] rounded-full" />
                      )}
                    </button>

                    {/* Tab 2: กิจกรรมคอมมูนิตี้ (Section 1) */}
                    <button
                      type="button"
                      onClick={() => handleTabClick('community')}
                      className="flex flex-col items-center gap-1.5 pt-1 pb-3 sm:pb-3.5 relative group cursor-pointer transition-all shrink-0"
                    >
                      <Users className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        activeModeTab === 'community' ? 'text-[#F26430]' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span className={`text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        activeModeTab === 'community' ? 'font-black text-[#F26430]' : 'font-semibold text-slate-500 group-hover:text-slate-800'
                      }`}>
                        กิจกรรมคอมมูนิตี้
                      </span>
                      {activeModeTab === 'community' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F26430] rounded-full" />
                      )}
                    </button>

                    {/* Tab 3: งานมหกรรม & เอ็กซ์โป (Section 2) */}
                    <button
                      type="button"
                      onClick={() => handleTabClick('fairs')}
                      className="flex flex-col items-center gap-1.5 pt-1 pb-3 sm:pb-3.5 relative group cursor-pointer transition-all shrink-0"
                    >
                      <Building2 className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        activeModeTab === 'fairs' ? 'text-[#2B527A]' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span className={`text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        activeModeTab === 'fairs' ? 'font-black text-[#2B527A]' : 'font-semibold text-slate-500 group-hover:text-slate-800'
                      }`}>
                        งานมหกรรม & เอ็กซ์โป
                      </span>
                      {activeModeTab === 'fairs' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2B527A] rounded-full" />
                      )}
                    </button>

                    {/* Tab 4: พิกัดเที่ยว & จุดฮีลใจ (Section 3) */}
                    <button
                      type="button"
                      onClick={() => handleTabClick('spots')}
                      className="flex flex-col items-center gap-1.5 pt-1 pb-3 sm:pb-3.5 relative group cursor-pointer transition-all shrink-0"
                    >
                      <Compass className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                        activeModeTab === 'spots' ? 'text-[#2D5A3C]' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span className={`text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        activeModeTab === 'spots' ? 'font-black text-[#2D5A3C]' : 'font-semibold text-slate-500 group-hover:text-slate-800'
                      }`}>
                        พิกัดเที่ยว & จุดฮีลใจ
                      </span>
                      {activeModeTab === 'spots' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2D5A3C] rounded-full" />
                      )}
                    </button>
                  </div>

                  {/* Right Tab: สุ่มให้ฉันที */}
                  {onOpenSurpriseModal && (
                    <button
                      type="button"
                      onClick={() => onOpenSurpriseModal(activeModeTab === 'all' && currentSlideIndex === 3 ? 'all' : activeModeTab)}
                      className="flex flex-col items-center gap-1.5 pt-1 pb-3 sm:pb-3.5 relative group cursor-pointer transition-all shrink-0 text-amber-700 hover:text-amber-800"
                    >
                      <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                        สุ่มให้ฉันที
                      </span>
                    </button>
                  )}
                </div>

                {/* Console Search Inputs (Luxury Booking Portal Responsive Layout - 20% Compact Height) */}
                <div className="relative grid grid-cols-1 md:grid-cols-12 lg:flex lg:flex-row items-stretch bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-1 sm:p-1.5 transition-all focus-within:ring-4 focus-within:ring-[#2563EB]/10 focus-within:border-[#2563EB] divide-y md:divide-y-0 lg:divide-x divide-slate-200 shadow-2xs">
                  
                  {/* Column 1: Keyword Input (Full width on iPad md, flexible on lg desktop) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 md:col-span-12 lg:flex-1 lg:min-w-[280px] md:border-b md:border-slate-200 lg:border-b-0">
                    <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <label className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        ค้นหาอะไรดี?
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getSearchPlaceholder()}
                        className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none truncate leading-normal"
                      />
                    </div>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Column 2: Province / Area (5 cols on iPad md, reduced 10% on desktop) */}
                  <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 md:col-span-5 lg:w-[195px] xl:w-[225px] shrink-0 text-left md:border-r md:border-slate-200 lg:border-r-0">
                    <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#4A7C59] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        จุดหมาย / จังหวัด
                      </label>
                      <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate appearance-none leading-normal"
                      >
                        <option value="all">ทุกจังหวัด (ทั่วไทย)</option>
                        <option value="ออนไลน์">ออนไลน์ (ไม่จำกัดสถานที่)</option>
                        <optgroup label="ยอดนิยม">
                          <option value="กรุงเทพฯ">กรุงเทพมหานคร</option>
                          <option value="นนทบุรี">นนทบุรี</option>
                          <option value="เชียงใหม่">เชียงใหม่</option>
                          <option value="ชลบุรี">ชลบุรี</option>
                          <option value="ภูเก็ต">ภูเก็ต</option>
                          <option value="ประจวบคีรีขันธ์">ประจวบคีรีขันธ์</option>
                          <option value="ขอนแก่น">ขอนแก่น</option>
                        </optgroup>
                        <optgroup label="ทั้งหมด 77 จังหวัด">
                          {ALL_THAI_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Column 3: Time Filter (4 cols on iPad md, reduced 10% on desktop) */}
                  <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 md:col-span-4 lg:w-[185px] xl:w-[205px] shrink-0 text-left md:border-r md:border-slate-200 lg:border-r-0">
                    <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2B527A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">
                        ช่วงเวลา
                      </label>
                      {timeFilter === 'custom' && startDate ? (
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={onOpenDatePicker}
                            className="text-xs sm:text-sm font-bold text-[#2B527A] truncate hover:underline text-left cursor-pointer"
                            title="คลิกเพื่อเปลี่ยนวันที่"
                          >
                            {formatDateDisplay(startDate, endDate)}
                          </button>
                          {onClearCustomDate && (
                            <button
                              type="button"
                              onClick={onClearCustomDate}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <select
                            value={activeTime}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                if (onOpenDatePicker) onOpenDatePicker();
                              } else {
                                handleTimeChange(e.target.value);
                                if (onClearCustomDate) onClearCustomDate();
                              }
                            }}
                            className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate appearance-none leading-normal"
                          >
                            <option value="all">ทุกช่วงเวลา</option>
                            <option value="today">วันนี้</option>
                            <option value="tomorrow">พรุ่งนี้</option>
                            <option value="weekend">สุดสัปดาห์นี้</option>
                            <option value="next_month">เดือนนี้</option>
                            <option value="custom">ระบุวันที่เอง...</option>
                          </select>
                          {activeTime === 'weekend' && (
                            <span className="text-[9.5px] font-black text-[#2B527A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                              ส.-อา.
                            </span>
                          )}
                          {activeTime === 'today' && (
                            <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                              วันนี้
                            </span>
                          )}
                          {activeTime === 'tomorrow' && (
                            <span className="text-[9.5px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 shrink-0">
                              พรุ่งนี้
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 4: Primary Action Search Button (3 cols on iPad md) */}
                  <div className="p-1 md:col-span-3 lg:w-auto shrink-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFocused(false);
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                      className="w-full lg:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer leading-normal"
                    >
                      <Search className="w-4 h-4" />
                      <span>ค้นหา</span>
                    </button>
                  </div>

                </div>

                {/* Under Search Box: Right-aligned Link under Search Button */}
                <div className="flex justify-end pt-0 px-1 -mt-0.5 -mb-0.5">
                  <a
                    href="#why-chill-and-connect"
                    onClick={handleScrollToWhySection}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-[12.5px] font-semibold text-slate-500 hover:text-[#2563EB] transition-colors group cursor-pointer"
                  >
                    <span className="hover:underline underline-offset-4 decoration-slate-300 group-hover:decoration-[#2563EB]">
                      ทำไมต้อง Chill & Connect Hub?
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-y-0.5 transition-transform duration-200" />
                  </a>
                </div>

                {/* Suggestions Dropdown (Positioned cleanly relative to console) */}
                {renderSearchSuggestions()}

              </div>
            </div>

            {/* 3. New User Exclusive & Privilege Ticket Strip (Compact & Refined Luxury Ticket Bar) */}
            <div className="mt-2.5 sm:mt-3.5 w-full space-y-2.5">
              
              {/* Section Header */}
              <div className="flex items-end justify-between gap-3 px-1 flex-wrap">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Member Privileges
                  </h2>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                    สิทธิประโยชน์ และของรางวัลไลฟ์สไตล์ เพื่อการออกไปใช้ชีวิตอย่างมีความหมาย
                  </p>
                </div>
                
                {/* Tab Switcher (Compact Segmented Control) */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowcaseTab('vouchers')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      showcaseTab === 'vouchers'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Gift className="w-3 h-3 text-blue-600" />
                    <span>สิทธิ์ต้อนรับ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowcaseTab('rewards')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      showcaseTab === 'rewards'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-3 h-3 text-blue-600" />
                    <span>XP แลกรางวัล</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: New User Exclusive Real Perforated Ticket Vouchers */}
              {showcaseTab === 'vouchers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 animate-fade-in">
                  
                  {/* Card 1: Trip.com Promo Callout Banner Card (Compact) */}
                  <div className="relative rounded-xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-indigo-50/70 border border-blue-100/90 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs group hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[92px] sm:min-h-[98px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block leading-none">
                          Welcome Privilege
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate">
                          สิทธิ์พิเศษสำหรับ สมาชิก
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          สร้างโปรไฟล์ สมัครสมาชิกฟรี เพื่อปลดล็อกสิทธิ์พิเศษมากมาย
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-blue-600 shadow-xs flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                        <Gift className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <Link
                        href={isLoggedIn ? '/rewards' : '/onboarding'}
                        className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer gap-1 leading-none"
                      >
                        <span>{isLoggedIn ? 'ดูสิทธิ์ของคุณ' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: 10% off Specialty Coffee (Compact Perforated Ticket) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            ลด 10%
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                            เครื่องดื่ม
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          Specialty Coffee 77 จังหวัด
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/rewards"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          เก็บสิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Amber Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-amber-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-amber-800 mt-1 text-center truncate">
                        คาเฟ่
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Free Community Meetup Pass (Compact Perforated Ticket) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            จอยตี้ฟรี
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                            ตี้แรก
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          คอมมูนิตี้ & เพื่อนใหม่
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/community"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          เก็บสิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Orange Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-orange-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-orange-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-orange-800 mt-1 text-center truncate">
                        มีตอัป
                      </span>
                    </div>
                  </div>

                  {/* Card 4: 15% off Craft Workshop (Compact Perforated Ticket) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            ลด 15%
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                            เวิร์กช็อป
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          คราฟต์ & ศิลปะเซรามิก
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/rewards"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          เก็บสิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Emerald Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-emerald-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-emerald-800 mt-1 text-center truncate">
                        เวิร์กช็อป
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: XP Store Rewards Real Perforated Ticket Vouchers */}
              {showcaseTab === 'rewards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 animate-fade-in">
                  
                  {/* Card 1: XP Store Callout Banner Card (Compact) */}
                  <div className="relative rounded-xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-indigo-50/70 border border-blue-100/90 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs group hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[92px] sm:min-h-[98px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block leading-none">
                          XP Rewards Hub
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate">
                          รวมของรางวัลไลฟ์สไตล์
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          สะสมแต้ม XP จากชาเลนจ์มาแลกรับสิทธิ์
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-blue-600 shadow-xs flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                        <Award className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <Link
                        href="/rewards"
                        className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer gap-1 leading-none"
                      >
                        <span>ดูของรางวัลทั้งหมด</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: ฿50 Specialty Coffee (150 XP - Compact) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            ลด ฿50
                          </span>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                            150 XP
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          Specialty Coffee อารีย์ & สุขุมวิท
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/rewards"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          ใช้สิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Amber Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-amber-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-amber-800 mt-1 text-center truncate">
                        กาแฟ
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Free Board Game Day Pass (250 XP - Compact) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            เล่นฟรี 1 วัน
                          </span>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                            250 XP
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          Siam Board Game Lounge
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/rewards"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          ใช้สิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Indigo/Blue Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-blue-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Dices className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-blue-800 mt-1 text-center truncate">
                        บอร์ดเกม
                      </span>
                    </div>
                  </div>

                  {/* Card 4: 15% off Craft Workshop (350 XP - Compact) */}
                  <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[92px] sm:min-h-[98px]">
                    <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                            ลด 15%
                          </span>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                            350 XP
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          Clay & Craft Studio สุขุมวิท
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <Link
                          href="/rewards"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[10.5px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                        >
                          ใช้สิทธิ์
                        </Link>
                      </div>
                    </div>

                    {/* Perforated Vertical Divider with Scallop Notches */}
                    <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Right Stub: Emerald Category Icon */}
                    <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-emerald-50/70 rounded-r-xl border-l border-dashed border-slate-200">
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 group-hover:scale-105 transition-transform" />
                      <span className="text-[9.5px] font-bold text-emerald-800 mt-1 text-center truncate">
                        เวิร์กช็อป
                      </span>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* OPTION 2: Classic Banner Hero                                    */}
        {/* ================================================================ */}
        {version === 'classic' && (
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md min-h-[150px] sm:min-h-[195px] md:min-h-[225px] flex items-center justify-center transition-all duration-300 z-30">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl sm:rounded-3xl overflow-hidden">
              <img
                src={HERO_SLIDES[currentSlideIndex].imageUrl}
                alt="Chill & Connect Bangkok Lifestyle Community"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-slate-900/35" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-slate-900/20 to-slate-900/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto px-3.5 sm:px-4 py-3 sm:py-4 md:py-5 w-full">

              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                วันหยุดนี้... <span className="text-[#FFA07A] inline-block hover:scale-105 transition-transform cursor-default drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">ทำอะไรดี?</span>
              </h1>

              <p className="text-[11px] sm:text-xs md:text-sm text-white font-bold max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                ค้นหากิจกรรมฮีลใจ ที่เที่ยวสุดชิลล์ และหาเพื่อนใหม่ทั่วไทย ✨
              </p>

              {/* Search Bar */}
              <div className="pt-1 max-w-2xl mx-auto relative z-30">
                <div className="relative flex items-center bg-white rounded-full p-1 sm:p-1.5 shadow-2xl shadow-black/35 border-2 border-white/95 focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/25 transition-all z-20">
                  <div className="pl-3 sm:pl-3.5 pr-1.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ค้นหากิจกรรม, สถานที่เที่ยว หรือแท็ก..."
                    className="w-full bg-transparent text-xs sm:text-sm md:text-base text-[#1E293B] placeholder-slate-400 focus:outline-none pr-2 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 mr-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocused(false);
                      if (onSearchSubmit) onSearchSubmit();
                    }}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 sm:hidden" />
                    <span className="hidden sm:inline">ค้นหาเลย</span>
                    <span className="sm:hidden text-xs font-bold">ค้นหา</span>
                  </button>
                </div>

                {/* Auto-Suggest Dropdown (Dynamic Predictive & 3 Discovery Pillars Directory) */}
                {renderSearchSuggestions()}
              </div>

              {/* Surprise Me */}
              {onOpenSurpriseModal && (
                <div className="pt-0.5 sm:pt-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenSurpriseModal(activeModeTab)}
                    className="text-[10px] sm:text-xs font-extrabold px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#F26430] border border-slate-200 hover:border-[#F26430]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                  >
                    <Dices className="w-3.5 h-3.5 text-[#F26430] group-hover:rotate-180 transition-transform duration-500" />
                    <span>
                      คิดไม่ออก?{' '}
                      <span className="text-[#F26430] underline underline-offset-2">
                        {activeModeTab === 'spots' && 'สุ่มพิกัดเที่ยวให้ฉัน'}
                        {activeModeTab === 'community' && 'สุ่มตี้กิจกรรมให้ฉัน'}
                        {activeModeTab === 'fairs' && 'สุ่มงานแฟร์ให้ฉัน'}
                        {activeModeTab === 'all' && 'สุ่มกิจกรรมให้ฉัน'}
                      </span>{' '}
                      ✨
                    </span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Detail & Confirmation Modal for Quest Selected from Hero Ticker */}
      <JoinChallengeModal
        isOpen={Boolean(selectedQuestForModal)}
        onClose={() => setSelectedQuestForModal(null)}
        quest={selectedQuestForModal}
        onConfirmJoin={(q) => {
          if (onJoinQuest) onJoinQuest(q.title);
        }}
        isAlreadyJoined={selectedQuestForModal ? (joinedQuestTitles || []).includes(selectedQuestForModal.title) : false}
        onCancelQuest={(q) => {
          if (onCancelQuest) onCancelQuest(q.title);
        }}
      />
    </section>
  );
};
