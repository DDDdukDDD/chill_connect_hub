'use client';

import React, { useState } from 'react';
import { Search, X, Dices } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: () => void;
  onOpenSurpriseModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenSurpriseModal,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      setIsFocused(false);
      onSearchSubmit();
    }
  };

  const SPOT_SUGGESTIONS = [
    { label: '🌳 สวนสาธารณะ & ป่าใจกลางเมือง', query: 'สวน', sub: 'สวนเบญจกิติ, สวนลุมฯ, สวนรถไฟ, อ่างแก้ว มช.' },
    { label: '🎨 หอศิลป์ & สเปซงานคราฟต์', query: 'หอศิลป์', sub: 'BACC, MOCA Bangkok, บ้านข้างวัด, โคลัมโบ' },
    { label: '☕ คาเฟ่ Slow Bar & วิวธรรมชาติ', query: 'คาเฟ่', sub: 'ย่านอารีย์, ทรงวาด, เขาใหญ่, ภูลังกา' },
    { label: '🏛️ ย่านเก่า & ชุมชนประวัติศาสตร์', query: 'ย่านเก่า', sub: 'ตลาดน้อย, เมืองเก่าภูเก็ต, ท่าแพ, สะพานมอญ' },
    { label: '🌅 จุดชมวิว ทะเล & ริมน้ำ', query: 'จุดชมวิว', sub: 'บางแสน, แหลมพรหมเทพ, เกาะล้าน, สกายพาร์ค' },
  ];

  const EVENT_SUGGESTIONS = [
    { label: '🏛️ งานอีเวนต์ & มหกรรมใหญ่', query: 'งานอีเวนต์ & มหกรรมใหญ่', sub: 'สัปดาห์หนังสือ, ไบเทค, อิมแพ็ค, สิริกิติ์' },
    { label: '🏃‍♂️ งานวิ่ง, HYROX & เอาต์ดอร์', query: 'งานวิ่ง', sub: 'ซิตี้รัน, ไนท์มาราธอน, ฟิตเนส, เทรนนิ่ง, ปีนผา' },
    { label: '🧘 โยคะ & สมาธิเสียงคลื่น (Sound Bath)', query: 'โยคะ', sub: 'Sound Bath, โยคะสวน, ฝึกสมาธิ, บำบัดจิตใจ' },
    { label: '🎲 บอร์ดเกม & กิจกรรมเพื่อนใหม่', query: 'บอร์ดเกม', sub: 'ปาร์ตี้บอร์ดเกม, Pub Quiz, พบปะเพื่อนใหม่' },
    { label: '🎨 เวิร์กช็อปศิลปะ & ชงชาทำอาหาร', query: 'เวิร์กช็อป', sub: 'ปั้นเซรามิก, ชงมัทฉะ, อบขนมปัง, ระบายสีน้ำ' },
  ];

  return (
    <section className="relative z-30 pt-3 sm:pt-4 md:pt-5 pb-1 sm:pb-2 bg-white">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 relative">
        
        {/* Full Hero Banner Container with Modern Lifestyle Photography - Sleek Balanced Profile */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md min-h-[150px] sm:min-h-[195px] md:min-h-[225px] flex items-center justify-center">
          
          {/* Full-bleed Background Image with Cinematic Golden Hour Vibe (Clipped to Rounded Corners) */}
          <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl sm:rounded-3xl overflow-hidden">
            <img
              src="/hero-bg-lifestyle.jpg"
              alt="Chill & Connect Bangkok Lifestyle Community"
              className="w-full h-full object-cover object-center"
            />
            {/* Cinematic Gradient Overlays to ensure center text & search bar pop prominently */}
            <div className="absolute inset-0 bg-slate-900/35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-slate-900/20 to-slate-900/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/40" />
          </div>

          {/* Centered Safe Zone for Text & Search Bar - Airy & Balanced Vertical Spacing */}
          <div className="relative z-10 text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto px-3.5 sm:px-4 py-3 sm:py-4 md:py-5 w-full">
            
            {/* Dynamic Headline (Prominent, Bold & Punchy with Golden-Coral Accent) */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
              วันหยุดนี้... <span className="text-[#FFA07A] inline-block hover:scale-105 transition-transform cursor-default drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">ทำอะไรดี?</span>
            </h1>

            {/* Subtitle (Clear, Crisp & Legible) */}
            <p className="text-[11px] sm:text-xs md:text-sm text-white font-bold max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
              ค้นหากิจกรรมฮีลใจ ที่เที่ยวสุดชิลล์ และหาเพื่อนใหม่ทั่วไทย ✨
            </p>

            {/* High-Contrast Floating Pill Search Bar (Slim, Sleek & Modern) */}
            <div className="pt-1 max-w-2xl mx-auto relative z-30">
              <div className="relative flex items-center bg-white rounded-full p-1 sm:p-1.5 shadow-2xl shadow-black/35 border-2 border-white/95 focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/25 transition-all z-20">
                
                {/* Search Icon */}
                <div className="pl-3 sm:pl-3.5 pr-1.5 text-[#94A3B8]">
                  <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400" />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ค้นหากิจกรรม, สถานที่เที่ยว หรือแท็ก..."
                  className="w-full bg-transparent text-xs sm:text-sm md:text-base text-[#1E293B] placeholder-[#94A3B8] focus:outline-none pr-2 font-medium"
                />

                {/* Clear Query Button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#94A3B8] hover:text-[#475569] mr-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}

                {/* Coral CTA Button (Slim, Punchy & Click-friendly) */}
                <button
                  onClick={() => {
                    setIsFocused(false);
                    if (onSearchSubmit) onSearchSubmit();
                  }}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-3.5 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm md:text-base transition-all shadow-md shadow-[#F26430]/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 sm:hidden" />
                  <span className="hidden sm:inline">ค้นหาเลย</span>
                  <span className="sm:hidden text-xs font-bold">ค้นหา</span>
                </button>
              </div>

              {/* Auto-Suggest Dropdown Menu (Balanced: 5 Spots + 5 Events) */}
              {isFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E8E2D8] p-3 z-50 text-left space-y-3 animate-fade-in max-h-72 sm:max-h-80 overflow-y-auto">
                  
                  {/* Group 1: สถานที่เที่ยว & พิกัดฮีลใจ */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-[#4A7C59] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-emerald-100 flex items-center justify-between">
                      <span>📍 พิกัดเที่ยว & จุดฮีลใจยอดนิยม</span>
                    </p>
                    {SPOT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={`spot-sug-${idx}`}
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#FAF7F2] hover:text-[#4A7C59] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#4A7C59] transition-colors truncate">
                            {sug.label}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal truncate mt-0.5">
                            {sug.sub}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#4A7C59] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 font-bold">
                          {sug.query}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Group 2: กิจกรรม & อีเวนต์ */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-[#F26430] px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-orange-100 flex items-center justify-between">
                      <span>🎪 กิจกรรม & อีเวนต์ยอดฮิต</span>
                    </p>
                    {EVENT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={`event-sug-${idx}`}
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#FAF7F2] hover:text-[#F26430] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#F26430] transition-colors truncate">
                            {sug.label}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal truncate mt-0.5">
                            {sug.sub}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#D95322] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 shrink-0 font-bold">
                          {sug.query}
                        </span>
                      </button>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* Single Clean Surprise Me Discovery Button */}
            {onOpenSurpriseModal && (
              <div className="pt-0.5 sm:pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onOpenSurpriseModal}
                  className="text-[10px] sm:text-xs md:text-xs font-extrabold px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-[#1E293B] hover:text-[#F26430] border border-[#E8E2D8] hover:border-[#F26430]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                  title="สุ่มกิจกรรมวันหยุดให้ฉันทันที"
                >
                  <Dices className="w-3.5 h-3.5 text-[#F26430] group-hover:rotate-180 transition-transform duration-500" />
                  <span>คิดไม่ออก? <span className="text-[#F26430] underline underline-offset-2">สุ่มกิจกรรมให้ฉัน</span> ✨</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
