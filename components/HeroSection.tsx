'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Dices, Sparkles, MapPin, Zap, Award, ArrowRight, Camera } from 'lucide-react';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { MOCK_POSTS } from '@/data/mockData';
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
}) => {
  const [version, setVersion] = useState<HeroVersion>(initialVersion);
  const [isFocused, setIsFocused] = useState(false);
  const [localProvince, setLocalProvince] = useState(selectedProvince);

  useEffect(() => {
    setLocalProvince(selectedProvince);
  }, [selectedProvince]);

  const handleProvinceChange = (prov: string) => {
    setLocalProvince(prov);
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

  // 1. พิกัดเที่ยว & จุดฮีลใจทั่วไทย (Nationwide Spots)
  const SPOT_SUGGESTIONS = [
    { label: 'ภูเขา & ทะเลหมอก', query: 'เขา', sub: 'ดอยอินทนนท์, เขาค้อ, น่าน, แม่ฮ่องสอน' },
    { label: 'ทะเล & เกาะสวยทั่วไทย', query: 'ทะเล', sub: 'ภูเก็ต, กระบี่, เกาะสมุย, ชลบุรี, หัวหิน' },
    { label: 'ป่าธรรมชาติ & แคมปิ้ง', query: 'ป่า', sub: 'เขาใหญ่, สวนเบญจกิติ, กาญจนบุรี, อุทยานแห่งชาติ' },
    { label: 'คาเฟ่ & สเปซนั่งชิลล์', query: 'คาเฟ่', sub: 'สโลว์บาร์, อารีย์, ทรงวาด, เชียงใหม่' },
    { label: 'ย่านเก่า & วิถีชุมชน', query: 'ย่านเก่า', sub: 'ตลาดน้อย, ภูเก็ตโอลด์ทาวน์, อยุธยา, เชียงคาน' },
    { label: 'หอศิลป์ & สเปซศิลปะ', query: 'หอศิลป์', sub: 'BACC, MOCA Bangkok, แกลเลอรีสร้างสรรค์' },
  ];

  // 2. กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups)
  const COMMUNITY_SUGGESTIONS = [
    { label: 'งานวิ่ง & ฟิตเนส', query: 'วิ่ง', sub: 'ซิตี้รันสวนลุมฯ, ซ้อมวิ่งมาราธอน, HYROX' },
    { label: 'ฮีลใจ & สมาธิ', query: 'sound bath', sub: 'Sound Healing, โยคะสวน, พักผ่อนใจ' },
    { label: 'บอร์ดเกม & ปาร์ตี้เพื่อนใหม่', query: 'บอร์ดเกม', sub: 'ปาร์ตี้บอร์ดเกม, Catan, Pub Quiz' },
    { label: 'เวิร์กช็อปศิลปะ & คราฟต์', query: 'workshop', sub: 'ปั้นเซรามิก, วาดภาพสีน้ำ, ถักพรม' },
    { label: 'ท่องเที่ยว & เอาต์ดอร์', query: 'outdoor', sub: 'พายคายัค, ซับบอร์ด, กางเต็นท์, เดินป่า' },
  ];

  // 3. งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs)
  const FAIR_SUGGESTIONS = [
    { label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)', query: 'สิริกิติ์', sub: 'สัปดาห์หนังสือ, มหกรรมความรู้, คอนเสิร์ต' },
    { label: 'ไบเทค บางนา (BITEC)', query: 'ไบเทค', sub: 'มหกรรมสินค้า, Comic Con, Expo' },
    { label: 'อิมแพ็ค เมืองทองธานี (IMPACT)', query: 'อิมแพ็ค', sub: 'งานแสดงสินค้า, เทศกาลอาหาร, คอนเสิร์ตใหญ่' },
    { label: 'เทศกาลเมือง & งานศิลป์', query: 'เทศกาล', sub: 'Design Week, Biennale, เทศกาลสร้างสรรค์' },
  ];

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
                    value={localProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer truncate appearance-none"
                  >
                    <option value="all">ทุกจังหวัด</option>
                    <optgroup label="ยอดนิยม">
                      <option value="กรุงเทพฯ">กรุงเทพมหานคร</option>
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

                {/* Auto-Suggest Dropdown (3 Distinct Categories: Spots, Community, Fairs) */}
                {isFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-50 text-left animate-fade-in max-h-88 overflow-y-auto divide-y divide-slate-100">
                    
                    {/* 1. พิกัดเที่ยว & จุดฮีลใจทั่วไทย */}
                    <div className="pb-2">
                      <p className="px-4 py-1.5 text-[11px] font-extrabold text-[#4A7C59] uppercase tracking-wider flex items-center justify-between">
                        <span>พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด</span>
                        <span className="text-[10px] text-slate-400 font-medium">Spots & Chill</span>
                      </p>
                      {SPOT_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`spot-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-[#EBF3ED]/60 hover:text-[#2D5A3C] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate group-hover:text-[#2D5A3C]">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#4A7C59] px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 2. กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ */}
                    <div className="py-2">
                      <p className="px-4 py-1.5 text-[11px] font-extrabold text-[#F26430] uppercase tracking-wider flex items-center justify-between">
                        <span>กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
                        <span className="text-[10px] text-slate-400 font-medium">Meetups & Buddies</span>
                      </p>
                      {COMMUNITY_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`comm-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50/60 hover:text-[#C2410C] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate group-hover:text-[#C2410C]">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#F26430] px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 3. งานมหกรรม นิทรรศการ & เอ็กซ์โป */}
                    <div className="pt-2">
                      <p className="px-4 py-1.5 text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center justify-between">
                        <span>งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                        <span className="text-[10px] text-slate-400 font-medium">Major Fairs & Expo</span>
                      </p>
                      {FAIR_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`fair-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50/60 hover:text-blue-900 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate group-hover:text-blue-900">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-blue-700 px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                  </div>
                )}
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
                onClick={handleScrollToQuests}
                className="flex items-center gap-2 min-w-0 text-left group/ticker cursor-pointer"
                title="คลิกเพื่อดูรายละเอียดภารกิจนี้ด้านล่าง"
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
              >
                <span>ดูภารกิจ</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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

                {/* Auto-Suggest Dropdown (Classic Mode) */}
                {isFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-left space-y-3 animate-fade-in max-h-88 overflow-y-auto divide-y divide-slate-100">
                    {/* 1. Spots */}
                    <div className="space-y-1 pb-1">
                      <p className="text-[11px] font-extrabold text-[#4A7C59] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 flex items-center justify-between border-b border-emerald-100">
                        <span>พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด</span>
                        <span className="text-[10px] text-slate-400 font-medium">Spots & Chill</span>
                      </p>
                      {SPOT_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`classic-spot-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-[#EBF3ED]/60 hover:text-[#2D5A3C] transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <span className="font-bold block truncate group-hover:text-[#2D5A3C]">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#4A7C59] px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 2. Community */}
                    <div className="space-y-1 py-1">
                      <p className="text-[11px] font-extrabold text-[#F26430] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 flex items-center justify-between border-b border-orange-100">
                        <span>กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
                        <span className="text-[10px] text-slate-400 font-medium">Meetups & Buddies</span>
                      </p>
                      {COMMUNITY_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`classic-comm-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-orange-50/60 hover:text-[#C2410C] transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <span className="font-bold block truncate group-hover:text-[#C2410C]">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-[#F26430] px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 3. Fairs */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] font-extrabold text-blue-700 px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 flex items-center justify-between border-b border-blue-100">
                        <span>งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                        <span className="text-[10px] text-slate-400 font-medium">Major Fairs & Expo</span>
                      </p>
                      {FAIR_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`classic-fair-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50/60 hover:text-blue-900 transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <span className="font-bold block truncate group-hover:text-blue-900">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 group-hover:bg-white group-hover:text-blue-700 px-2 py-0.5 rounded-md font-medium shrink-0">
                            {sug.query}
                          </span>
                        </button>
                      ))}
                    </div>

                  </div>
                )}
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
    </section>
  );
};
