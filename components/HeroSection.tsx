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
  Users,
  ShieldCheck,
} from 'lucide-react';
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
  onSelectDiscoveryTab,
}) => {
  const [version, setVersion] = useState<HeroVersion>(initialVersion);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);
  const [activeModeTab, setActiveModeTab] = useState<'all' | 'spots' | 'community' | 'fairs'>('all');

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

  const handleTabClick = (tab: 'all' | 'spots' | 'community' | 'fairs') => {
    setActiveModeTab(tab);
    if (onSelectDiscoveryTab) {
      onSelectDiscoveryTab(tab);
    }
  };

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
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[70] text-left animate-fade-in max-h-[460px] overflow-y-auto divide-y divide-slate-100">
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
                  <div className={`space-y-1 ${matchedSpots.length > 0 ? 'pt-2 border-t border-slate-100' : ''}`}>
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
                  <div className={`space-y-1 ${matchedSpots.length > 0 || matchedCommunity.length > 0 ? 'pt-2 border-t border-slate-100' : ''}`}>
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

            {/* 1. 🌲 พิกัดเที่ยว 7 ไวบ์ทั่วไทย (Spots & Chill) */}
            {(activeModeTab === 'all' || activeModeTab === 'spots') && (
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
            )}

            {/* 2. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups) */}
            {(activeModeTab === 'all' || activeModeTab === 'community') && (
              <div className={`space-y-2 ${activeModeTab === 'all' ? 'pt-2 border-t border-slate-100' : ''}`}>
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

            {/* 3. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Venues) */}
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
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative z-30 pt-1 sm:pt-2 pb-1">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 relative space-y-2">

        {version === 'editorial' && (
          <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-xs pt-3 sm:pt-3.5 pb-3.5 sm:pb-4 px-4 sm:px-6 md:px-7">

            {/* Subtle Tri-Color Accent Line (The 3 Discovery Pillars) */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4A7C59] via-[#F26430] to-[#2B527A] rounded-t-3xl" />

            {/* Ambient Soft Glow in corner */}
            <div className="pointer-events-none absolute -top-14 -right-14 w-80 h-80 bg-gradient-to-br from-emerald-50/50 via-amber-50/20 to-transparent rounded-full blur-2xl -z-0" />

            {/* 1. Clean Minimal Mode Tabs at Top (Centered with comfortable breathing room) */}
            <div className="relative z-10 flex justify-center mb-4 sm:mb-5">
              <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 overflow-x-auto max-w-full no-scrollbar shadow-xs">
                {/* Tab 1: All */}
                <button
                  type="button"
                  onClick={() => handleTabClick('all')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeModeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>ทั้งหมด</span>
                </button>

                {/* Tab 2: Spots */}
                <button
                  type="button"
                  onClick={() => handleTabClick('spots')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeModeTab === 'spots'
                      ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-xs border border-emerald-200'
                      : 'text-slate-500 hover:text-[#2D5A3C] hover:bg-[#EBF3ED]/50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>พิกัดเที่ยว & จุดฮีลใจ</span>
                </button>

                {/* Tab 3: Community */}
                <button
                  type="button"
                  onClick={() => handleTabClick('community')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeModeTab === 'community'
                      ? 'bg-orange-50 text-orange-900 shadow-xs border border-orange-200'
                      : 'text-slate-500 hover:text-orange-900 hover:bg-orange-50/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#F26430]" />
                  <span>กิจกรรมคอมมูนิตี้</span>
                </button>

                {/* Tab 4: Fairs */}
                <button
                  type="button"
                  onClick={() => handleTabClick('fairs')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeModeTab === 'fairs'
                      ? 'bg-sky-50 text-blue-900 shadow-xs border border-blue-200'
                      : 'text-slate-500 hover:text-blue-900 hover:bg-sky-50/50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#2B527A]" />
                  <span>งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                </button>
              </div>
            </div>

            {/* 2. Editorial Headline & Dynamic Concept Subtitle (Flowing Inline) */}
            <div className="relative z-10 mb-2.5 sm:mb-3 text-left">
              <h1 className="text-slate-900 leading-snug">
                {/* Dynamic Main Headline */}
                <span className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight align-baseline mr-2 inline-block sm:inline">
                  {activeModeTab === 'spots' && (
                    <>วันหยุดนี้... <span className="text-[#2D5A3C]">ไปพักใจที่ไหนดี?</span></>
                  )}
                  {activeModeTab === 'community' && (
                    <>วันหยุดนี้... <span className="text-[#C2410C]">ไปจอยตี้ไหนดี?</span></>
                  )}
                  {activeModeTab === 'fairs' && (
                    <>วันหยุดนี้... <span className="text-[#2B527A]">ไปเดินงานไหนดี?</span></>
                  )}
                  {activeModeTab === 'all' && (
                    <>วันหยุดนี้... <span className="text-[#2D5A3C]">ไปไหนดี?</span></>
                  )}
                </span>

                {/* Dynamic Concept Storytelling Subtitle with About Link (Continuing Directly from Title) */}
                <span className="text-xs sm:text-sm text-slate-600 font-normal align-baseline inline">
                  <span className="text-slate-300 font-light mx-1.5 hidden sm:inline">•</span>
                  {activeModeTab === 'spots' && (
                    <span>รวมจุดพักใจ คาเฟ่ ชุมชนลับ และธรรมชาติ 77 จังหวัดทั่วไทย เที่ยวชิลล์ๆ ได้ด้วยตัวเอง</span>
                  )}
                  {activeModeTab === 'community' && (
                    <span>หาเพื่อนใหม่กลุ่มย่อย วิ่ง บอร์ดเกม เวิร์กช็อป ตี้กาแฟ ในคอมมูนิตี้ที่ปลอดภัยไร้แรงกดดัน</span>
                  )}
                  {activeModeTab === 'fairs' && (
                    <span>อัปเดตงานอีเวนต์ใหญ่ นิทรรศการ งานหนังสือ เทศกาลกาแฟ และเอ็กซ์โปทั่วประเทศ</span>
                  )}
                  {activeModeTab === 'all' && (
                    <span>ค้นพบสถานที่เที่ยว พิกัดฮีลใจ กิจกรรมสนุกๆ พร้อมเพื่อนใหม่ๆ ได้ที่นี่</span>
                  )}
                  {' '}
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-[#4A7C59] hover:text-[#386244] hover:underline transition-colors whitespace-nowrap ml-1.5 align-baseline"
                  >
                    <span>ทำความรู้จักเรา</span>
                    <ArrowRight className="w-3.5 h-3.5 inline" />
                  </Link>
                </span>
              </h1>
            </div>

            {/* Search Row (Full Width Discovery Capsule) */}
            <div className="relative z-30 w-full flex flex-col sm:flex-row items-stretch gap-2">

              {/* Search Capsule */}
              <div className="relative flex-1 flex flex-col sm:flex-row items-stretch bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#4A7C59] focus-within:ring-2 focus-within:ring-[#4A7C59]/15 transition-all divide-y sm:divide-y-0 sm:divide-x divide-slate-200">

                {/* Keyword */}
                <div className="flex items-center gap-2.5 px-4 py-2 sm:py-2.5 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getSearchPlaceholder()}
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
                <div className="flex items-center gap-2 px-3.5 py-2 sm:py-2.5 sm:w-[180px] shrink-0">
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
                  className="bg-[#4A7C59] hover:bg-[#3D6649] text-white px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  ค้นหา
                </button>
                {onOpenSurpriseModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSurpriseModal(activeModeTab)}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs border ${
                      activeModeTab === 'spots'
                        ? 'bg-[#EBF3ED] text-[#2D5A3C] border-emerald-200 hover:bg-[#dfeee3]'
                        : activeModeTab === 'community'
                        ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
                        : activeModeTab === 'fairs'
                        ? 'bg-sky-50 text-blue-900 border-blue-200 hover:bg-sky-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Dices className="w-4 h-4" />
                    <span>
                      {activeModeTab === 'spots' && 'สุ่มพิกัดเที่ยว'}
                      {activeModeTab === 'community' && 'สุ่มตี้กิจกรรม'}
                      {activeModeTab === 'fairs' && 'สุ่มงานแฟร์'}
                      {activeModeTab === 'all' && 'สุ่มให้เลย'}
                    </span>
                  </button>
                )}
              </div>

            </div>

            {/* Bottom Bar: Live Quest Ticker + Editorial Story Link */}
            <div className="relative z-10 mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
              {/* Left: Quest Ticker */}
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

              {/* Right: Actions */}
              <button
                type="button"
                onClick={handleScrollToQuests}
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-purple-700 hover:text-purple-900 transition-colors shrink-0 cursor-pointer self-end sm:self-auto"
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
