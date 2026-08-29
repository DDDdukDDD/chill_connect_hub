'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Dices, Sparkles, MapPin } from 'lucide-react';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';

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

  const SPOT_SUGGESTIONS = [
    { label: 'สวนสาธารณะ & ป่าใจกลางเมือง', query: 'สวน', sub: 'สวนเบญจกิติ, สวนลุมฯ, สวนรถไฟ, อ่างแก้ว มช.' },
    { label: 'หอศิลป์ & สเปซงานคราฟต์', query: 'หอศิลป์', sub: 'BACC, MOCA Bangkok, บ้านข้างวัด' },
    { label: 'คาเฟ่ Slow Bar & วิวธรรมชาติ', query: 'คาเฟ่', sub: 'ย่านอารีย์, ทรงวาด, เขาใหญ่' },
    { label: 'ย่านเก่า & ชุมชนประวัติศาสตร์', query: 'ย่านเก่า', sub: 'ตลาดน้อย, เมืองเก่าภูเก็ต, ท่าแพ' },
    { label: 'จุดชมวิว ทะเล & ริมน้ำ', query: 'จุดชมวิว', sub: 'บางแสน, แหลมพรหมเทพ, เกาะล้าน' },
  ];

  const EVENT_SUGGESTIONS = [
    { label: 'งานอีเวนต์ & มหกรรมใหญ่', query: 'งานอีเวนต์ & มหกรรมใหญ่', sub: 'สัปดาห์หนังสือ, ไบเทค, อิมแพ็ค' },
    { label: 'งานวิ่ง, HYROX & เอาต์ดอร์', query: 'งานวิ่ง', sub: 'ซิตี้รัน, ไนท์มาราธอน, เทรนนิ่ง' },
    { label: 'โยคะ & สมาธิเสียงคลื่น', query: 'โยคะ', sub: 'Sound Bath, โยคะสวน, ฝึกสมาธิ' },
    { label: 'บอร์ดเกม & กิจกรรมเพื่อนใหม่', query: 'บอร์ดเกม', sub: 'ปาร์ตี้บอร์ดเกม, Pub Quiz' },
    { label: 'เวิร์กช็อปศิลปะ & ทำอาหาร', query: 'เวิร์กช็อป', sub: 'ปั้นเซรามิก, ชงมัทฉะ, ระบายสีน้ำ' },
  ];

  return (
    <section className="relative z-30 pt-2 sm:pt-3 pb-1 sm:pb-2">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 relative space-y-2">

        {/* Version Switcher */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-[#F26430] animate-pulse" />
            <span className="hidden sm:inline">โหมดมุมมองหน้าแรก:</span>
            <span className="sm:hidden">สลับมุมมอง:</span>
          </div>
          <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleSwitchVersion('editorial')}
              className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                version === 'editorial'
                  ? 'bg-white text-[#4A7C59] shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => handleSwitchVersion('classic')}
              className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                version === 'classic'
                  ? 'bg-white text-[#F26430] shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Classic
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* OPTION 1: Minimal Discovery Bar                                  */}
        {/* ================================================================ */}
        {version === 'editorial' && (
          <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5">

            {/* Headline */}
            <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight mb-3">
              วันหยุดนี้... ทำอะไรดี?
              <span className="text-slate-400 font-normal text-sm sm:text-base ml-2 hidden sm:inline">
                สำรวจกว่า 460+ สถานที่ & กิจกรรมทั่วไทย
              </span>
            </h1>

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

                {/* Auto-Suggest */}
                {isFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-left animate-fade-in max-h-80 overflow-y-auto">
                    <p className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">สถานที่แนะนำ</p>
                    {SPOT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={`spot-${idx}`}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#4A7C59] transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">{sug.label}</span>
                          <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium shrink-0">{sug.query}</span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <p className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">กิจกรรม & อีเวนต์</p>
                      {EVENT_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`event-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#F26430] transition-colors cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium shrink-0">{sug.query}</span>
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
                  className="bg-[#4A7C59] hover:bg-[#3D6649] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  ค้นหา
                </button>
                {onOpenSurpriseModal && (
                  <button
                    type="button"
                    onClick={onOpenSurpriseModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-[#F26430] bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    🎲 สุ่มให้เลย
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* OPTION 2: Classic Banner Hero                                    */}
        {/* ================================================================ */}
        {version === 'classic' && (
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md min-h-[150px] sm:min-h-[195px] md:min-h-[225px] flex items-center justify-center overflow-hidden transition-all duration-300">

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

                {/* Auto-Suggest */}
                {isFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-left space-y-3 animate-fade-in max-h-72 sm:max-h-80 overflow-y-auto">
                    <div className="space-y-1">
                      <p className="text-[11px] font-extrabold text-[#4A7C59] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-emerald-100">
                        สถานที่แนะนำ
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
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A7C59] transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-bold block truncate">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium shrink-0">{sug.query}</span>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <p className="text-[11px] font-extrabold text-[#F26430] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-orange-100">
                        กิจกรรม & อีเวนต์
                      </p>
                      {EVENT_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={`classic-event-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#F26430] transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-bold block truncate">{sug.label}</span>
                            <span className="text-xs text-slate-400 block truncate">{sug.sub}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium shrink-0">{sug.query}</span>
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
