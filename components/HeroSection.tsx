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
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { ALL_THAI_PROVINCES, MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { ChallengeQuest, MOCK_EVENTS, EventItem } from '@/data/mockData';
import Link from 'next/link';

export type HeroVersion = 'editorial' | 'classic';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvince?: string;
  setSelectedProvince?: (province: string) => void;
  onSearchSubmit?: () => void;
  onOpenSurpriseModal?: () => void;
  initialVersion?: HeroVersion;
  onVersionChange?: (version: HeroVersion) => void;
  onJoinQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onCancelQuest?: (questTitle: string) => void;
}

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
}) => {
  const [version, setVersion] = useState<HeroVersion>(initialVersion);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);

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

  // =========================================================================
  // 🌟 Discovery Pillars Taxonomy Data (for Empty Search Suggestions Directory)
  // =========================================================================
  const PILLAR_SPOT_CATEGORIES = [
    { label: 'ภูเขา & ทะเลหมอก', query: 'เขา', icon: Mountain, sub: 'ดอย, เขาค้อ, น่าน, ชมวิว' },
    { label: 'ทะเล & เกาะสวย', query: 'ทะเล', icon: Waves, sub: 'ภูเก็ต, กระบี่, เกาะสมุย, หาด' },
    { label: 'ป่าธรรมชาติ & กางเต็นท์', query: 'ป่า', icon: Trees, sub: 'เขาใหญ่, กางเต็นท์, เดินป่า' },
    { label: 'คาเฟ่ & สเปซนั่งชิลล์', query: 'คาเฟ่', icon: Coffee, sub: 'สโลว์บาร์, ดริปกาแฟ, นั่งชิลล์' },
    { label: 'ย่านเก่า & วิถีชุมชน', query: 'ย่านเก่า', icon: Landmark, sub: 'ตลาดน้อย, ภูเก็ตเมืองเก่า, อยุธยา' },
    { label: 'หอศิลป์ & สเปซศิลปะ', query: 'หอศิลป์', icon: Palette, sub: 'BACC, MOCA, แกลเลอรีสร้างสรรค์' },
    { label: 'สปา & จุดฮีลใจ', query: 'สปา', icon: Sparkles, sub: 'ออนเซ็น, สมาธิ, ผ่อนคลาย' },
  ];

  const PILLAR_COMMUNITY_CATEGORIES = [
    { label: 'งานวิ่ง & ฟิตเนส', query: 'วิ่ง', icon: Flame, sub: 'ซิตี้รัน, มาราธอน, HYROX, กีฬา' },
    { label: 'ฮีลใจ & สมาธิ', query: 'sound bath', icon: Sparkles, sub: 'Sound Healing, โยคะ, พักผ่อนใจ' },
    { label: 'คาเฟ่ & พบปะชิลล์', query: 'กาแฟ', icon: Coffee, sub: 'Slow Bar, จิบกาแฟ, นัดคุย' },
    { label: 'บอร์ดเกม & ปาร์ตี้', query: 'บอร์ดเกม', icon: Dices, sub: 'ปาร์ตี้บอร์ดเกม, Catan, Pub Quiz' },
    { label: 'ศิลปะ & งานคราฟต์', query: 'workshop', icon: Palette, sub: 'ปั้นเซรามิก, วาดภาพสีน้ำ, คราฟต์' },
    { label: 'ท่องเที่ยว & เอาต์ดอร์', query: 'outdoor', icon: Trees, sub: 'พายคายัค, ซับบอร์ด, แคมปิ้ง' },
    { label: 'ทักษะ & เทคโนโลยี', query: 'tech', icon: Award, sub: 'Tech Meetup, Coding, AI, ธุรกิจ' },
    { label: 'สัตว์เลี้ยง & ครอบครัว', query: 'สัตว์เลี้ยง', icon: Compass, sub: 'พาน้องหมาแมวเที่ยว, นัดมีทติ้ง' },
  ];

  const PILLAR_FAIR_CATEGORIES = [
    { label: 'ศูนย์ประชุม & ฮอลล์ใหญ่', query: 'สิริกิติ์', icon: Building2, sub: 'QSNCC, ไบเทค บางนา, อิมแพ็ค' },
    { label: 'เทศกาลเมือง & งานศิลป์', query: 'เทศกาล', icon: Palette, sub: 'Design Week, Biennale, งานศิลป์' },
    { label: 'งานวิ่งมาราธอน & กีฬา', query: 'มาราธอน', icon: Flame, sub: 'วิ่งผ่าเมือง, ไตรกีฬา, แข่งขัน' },
    { label: 'งานประเพณี & งานประจำปี', query: 'ประเพณี', icon: Landmark, sub: 'งานกาชาด, เกษตรแฟร์, งานวัด' },
    { label: 'ตลาดนัด & คราฟต์แฟร์', query: 'ตลาดนัด', icon: ShoppingBag, sub: 'Flea Market, สินค้าทำมือ, Art Toy' },
    { label: 'สวนสาธารณะ & ลานดนตรี', query: 'ดนตรีในสวน', icon: Trees, sub: 'ดนตรีในสวน, Open-Air, คอนเสิร์ต' },
  ];

  // =========================================================================
  // 🔍 Dynamic Predictive Search Filters (Matched against real entities)
  // =========================================================================
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isTyping = trimmedQuery.length > 0;

  const matchedSpots = useMemo(() => {
    if (!isTyping) return [];
    return MOCK_SPOTS.filter((s) => {
      return (
        s.title?.toLowerCase().includes(trimmedQuery) ||
        s.province?.toLowerCase().includes(trimmedQuery) ||
        s.district?.toLowerCase().includes(trimmedQuery) ||
        s.categoryLabel?.toLowerCase().includes(trimmedQuery) ||
        s.vibeTags?.some((v) => v.toLowerCase().includes(trimmedQuery)) ||
        s.description?.toLowerCase().includes(trimmedQuery)
      );
    }).slice(0, 4);
  }, [trimmedQuery, isTyping]);

  const matchedCommunity = useMemo(() => {
    if (!isTyping) return [];
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
    }).slice(0, 4);
  }, [trimmedQuery, isTyping]);

  const matchedFairs = useMemo(() => {
    if (!isTyping) return [];
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
    }).slice(0, 4);
  }, [trimmedQuery, isTyping]);

  const totalMatches = matchedSpots.length + matchedCommunity.length + matchedFairs.length;

  const renderSearchSuggestions = () => {
    if (!isFocused) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 text-left animate-fade-in max-h-[460px] overflow-y-auto divide-y divide-slate-100">
        {/* CASE 1: Typing state (Dynamic Live Predictive Search grouped by 3 Core Pillars) */}
        {isTyping ? (
          <div className="p-2.5 sm:p-3 space-y-3">
            {totalMatches === 0 ? (
              <div className="py-6 px-4 text-center bg-slate-50/80 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  ไม่พบผลลัพธ์ที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ลองค้นหาด้วยคำสำคัญ เช่น คาเฟ่, วิ่ง, สวน, ทะเล หรือกดปุ่มค้นหาเพื่อดูผลทั้งหมดในระบบ
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
                {/* 1. 🌲 พิกัดเที่ยวที่พบ (Spots) */}
                {matchedSpots.length > 0 && (
                  <div className="space-y-1">
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

                {/* 2. 👥 กิจกรรมคอมมูนิตี้ที่พบ (Community) */}
                {matchedCommunity.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
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

                {/* 3. 🏛️ งานมหกรรม & เอ็กซ์โปที่พบ (Fairs) */}
                {matchedFairs.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
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
                    ค้นหาคำว่า <strong className="font-bold text-slate-900 group-hover:text-[#2D5A3C]">&ldquo;{searchQuery}&rdquo;</strong> ในหน้าฟีดหลัก
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white group-hover:bg-[#4A7C59] group-hover:text-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-transparent shrink-0">
                  กด Enter ↵
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* CASE 2: Empty Query State (Complete 3 Core Pillars Directory in 2-Column Grid) */
          <div className="p-2.5 sm:p-3 space-y-4">
            <div className="px-1 pt-0.5 flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>สำรวจตามหมวดหมู่ 3 เสาหลัก (3 Discovery Pillars)</span>
              </p>
              <span className="text-[10px] text-slate-400 font-medium">คลิกเพื่อกรองค้นหา</span>
            </div>

            {/* 1. 🌲 พิกัดเที่ยว 7 ไวบ์ทั่วไทย (Spots & Chill) */}
            <div className="space-y-2">
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

            {/* 2. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
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

            {/* 3. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Venues) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
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
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative z-30 pt-2 sm:pt-3 pb-1 sm:pb-2">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 relative space-y-2">

        {/* ================================================================ */}
        {/* OPTION 1: Minimal Discovery Bar                                  */}
        {/* ================================================================ */}
        {version === 'editorial' && (
          <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5">

            {/* Editorial Headline & Responsive Subtitle */}
            <div className="mb-3.5">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-normal flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="shrink-0">วันหยุดนี้...</span>
                <span className="text-[#2D5A3C] shrink-0 inline-block font-black">
                  ทำอะไรดี?
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-normal tracking-normal hidden md:inline">
                  • ค้นหากิจกรรมฮีลใจ ที่เที่ยวสุดชิลล์ และหาเพื่อนใหม่ทั่วไทย
                </span>
              </h1>
              {/* Mobile / Tablet Subtitle (Separate Line) */}
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 md:hidden">
                ค้นหากิจกรรมฮีลใจ ที่เที่ยวสุดชิลล์ และหาเพื่อนใหม่ทั่วไทย
              </p>
            </div>

            {/* Search Row */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">

              {/* Search Capsule */}
              <div className="relative flex-1 flex flex-col sm:flex-row items-stretch bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#4A7C59] focus-within:ring-2 focus-within:ring-[#4A7C59]/15 transition-all divide-y sm:divide-y-0 sm:divide-x divide-slate-200">

                {/* Keyword */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ค้นหาสถานที่ คาเฟ่ งานวิ่ง เวิร์กช็อป..."
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Province */}
                <div className="flex items-center gap-2 px-4 py-2.5 sm:w-[200px] shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer truncate appearance-none"
                  >
                    <option value="all">ทุกจังหวัด (ทั่วไทย)</option>
                    <option value="ออนไลน์">ออนไลน์ (ไม่จำกัดสถานที่)</option>
                    <optgroup label="ยอดนิยม">
                      <option value="กรุงเทพฯ">กรุงเทพมหานคร</option>
                      <option value="นนทบุรี">นนทบุรี</option>
                      <option value="เชียงใหม่">เชียงใหม่</option>
                      <option value="ชลบุรี">ชลบุรี</option>
                      <option value="ภูเก็ต">ภูเก็ต</option>
                      <option value="นครราชสีมา">นครราชสีมา</option>
                      <option value="น่าน">น่าน</option>
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

                {/* Auto-Suggest Dropdown (Dynamic Predictive & 3 Discovery Pillars Directory) */}
                {renderSearchSuggestions()}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsFocused(false);
                    if (onSearchSubmit) onSearchSubmit();
                  }}
                  className="bg-[#4A7C59] hover:bg-[#3D6649] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  ค้นหา
                </button>
                {onOpenSurpriseModal && (
                  <button
                    type="button"
                    onClick={onOpenSurpriseModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-[#2D5A3C] bg-slate-100 hover:bg-[#EBF3ED] border border-slate-200 hover:border-emerald-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    🎲 สุ่มให้เลย
                  </button>
                )}
              </div>

            </div>

            {/* ⚡ Live Quest Ticker Capsule (Subtle, Minimal & Unified Muted Violet) */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedQuestForModal(COMMUNITY_PUBLIC_QUESTS[currentQuestIndex])}
                className="flex items-center gap-2 min-w-0 text-left group/ticker cursor-pointer"
                title="คลิกเพื่อเปิดดูรายละเอียดและเงื่อนไขภารกิจนี้ทันที"
              >
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/80 font-black text-[10px] uppercase tracking-wider shrink-0">
                  <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                  <span>ชาเลนจ์</span>
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-700 group-hover/ticker:text-purple-800 transition-colors truncate text-xs">
                    {COMMUNITY_PUBLIC_QUESTS[currentQuestIndex]?.title}
                  </span>
                  <span className="hidden md:inline-block text-[10.5px] font-bold text-purple-700 bg-purple-50/80 border border-purple-200/60 px-1.5 py-0.2 rounded shrink-0">
                    +{COMMUNITY_PUBLIC_QUESTS[currentQuestIndex]?.rewardPoints} XP
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleScrollToQuests}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-purple-900 transition-colors shrink-0 cursor-pointer"
                title="เลื่อนลงไปสำรวจภารกิจทั้งหมดใน Section 4"
              >
                <span>ดูภารกิจทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
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
                src="/hero-bg-lifestyle.jpg"
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
                    className="bg-[#F26430] hover:bg-[#D95322] text-white px-3.5 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition-all shadow-md shadow-[#F26430]/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
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
                    onClick={onOpenSurpriseModal}
                    className="text-[10px] sm:text-xs font-extrabold px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#F26430] border border-slate-200 hover:border-[#F26430]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                  >
                    <Dices className="w-3.5 h-3.5 text-[#F26430] group-hover:rotate-180 transition-transform duration-500" />
                    <span>คิดไม่ออก? <span className="text-[#F26430] underline underline-offset-2">สุ่มกิจกรรมให้ฉัน</span> ✨</span>
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
