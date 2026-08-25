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

  const SUGGESTIONS = [
    { label: '🏛️ งานอีเวนต์ & มหกรรมใหญ่', query: 'งานอีเวนต์ & มหกรรมใหญ่', sub: 'สัปดาห์หนังสือ, ไบเทค, อิมแพ็ค, สิริกิติ์' },
    { label: '🏃‍♂️ งานวิ่ง & มาราธอน', query: 'งานวิ่ง & มาราธอน', sub: 'ซิตี้รัน, ไนท์มาราธอน, สวนเบญฯ, สวนรถไฟ' },
    { label: '🏋️‍♀️ ฟิตเนส & ไฮร็อกซ์ (HYROX)', query: 'ฟิตเนส & ไฮร็อกซ์ (HYROX)', sub: 'เวิร์กเอาต์กลุ่ม, ฟิตเนส, บูตแคมป์, เทรนนิ่ง' },
    { label: '🧘 โยคะ & สมาธิเสียงคลื่น (Sound Bath)', query: 'โยคะ & สมาธิเสียงคลื่น (Sound Bath)', sub: 'Sound Bath, โยคะสวน, ฝึกสมาธิ, บำบัดจิตใจ' },
    { label: '☕ คาเฟ่ & ดนตรีอะคูสติก', query: 'คาเฟ่ & ดนตรีอะคูสติก', sub: 'สโลว์บาร์, ดนตรีสด, แจ๊ส, จิบกาแฟคุยชิลล์' },
    { label: '🎲 บอร์ดเกม & กิจกรรมเพื่อนใหม่', query: 'บอร์ดเกม & กิจกรรมเพื่อนใหม่', sub: 'ปาร์ตี้บอร์ดเกม, Pub Quiz, ทำความรู้จักเพื่อนใหม่' },
    { label: '🎨 เวิร์กช็อปศิลปะ & งานคราฟต์', query: 'เวิร์กช็อปศิลปะ & งานคราฟต์', sub: 'ปั้นเซรามิก, ระบายสีน้ำ, เทียนหอม, เย็บหนัง, ยิงพรม' },
    { label: '🍵 ชงชา & เวิร์กช็อปทำอาหาร', query: 'ชงชา & เวิร์กช็อปทำอาหาร', sub: 'ชงมัทฉะ, อบขนมปังซาวร์โด, ทำขนม, เบเกอรี่' },
    { label: '📷 เดินถ่ายรูป & สำรวจเมือง', query: 'เดินถ่ายรูป & สำรวจเมือง', sub: 'กล้องฟิล์ม, สตรีทโฟโต้, Photo Walk, เดินตลาดเก่า' },
    { label: '🏄‍♂️ กิจกรรมกีฬา & เอาต์ดอร์', query: 'กิจกรรมกีฬา & เอาต์ดอร์', sub: 'ปีนหน้าผาจำลอง, ตีแบด, ปั่นจักรยาน, พิกเคิลบอล, มวยไทย' },
  ];

  return (
    <section className="relative z-30 pt-1 pb-1 md:pt-2 md:pb-2 bg-[#FAF7F2]">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Full Hero Banner Container with Modern Lifestyle Photography - Responsive & Clean */}
        <div className="relative rounded-3xl border border-slate-200/90 shadow-md min-h-[270px] sm:min-h-[310px] flex items-center justify-center">
          
          {/* Full-bleed Background Image with Cinematic Golden Hour Vibe (Clipped to Rounded Corners) */}
          <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden">
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

          {/* Centered Safe Zone for Text & Search Bar */}
          <div className="relative z-10 text-center space-y-3.5 max-w-3xl mx-auto px-4 py-7 sm:py-9 w-full">
            
            {/* Dynamic Headline (Pure White with Coral Highlight & Strong Contrast) */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              วันหยุดนี้... <span className="text-[#FFA07A] inline-block hover:scale-105 transition-transform cursor-default">ทำอะไรดี?</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-white font-bold max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
              ค้นหากิจกรรมฮีลใจ หาเพื่อนใหม่ และความสนุกในกรุงเทพฯ ✨
            </p>

            {/* High-Contrast Floating Pill Search Bar (Expanded & Spacious) */}
            <div className="pt-1.5 max-w-2xl mx-auto relative z-30">
              <div className="relative flex items-center bg-white rounded-full p-1.5 sm:p-2 shadow-2xl shadow-black/35 border-2 border-white/95 focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/25 transition-all z-20">
                
                {/* Search Icon */}
                <div className="pl-3.5 sm:pl-4 pr-2 sm:pr-2.5 text-[#94A3B8]">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ค้นหากิจกรรม, สถานที่ หรือแท็ก..."
                  className="w-full bg-transparent text-sm sm:text-base text-[#1E293B] placeholder-[#94A3B8] focus:outline-none pr-2 font-medium"
                />

                {/* Clear Query Button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#94A3B8] hover:text-[#475569] mr-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Coral CTA Button (Prominent & Easy to Click) */}
                <button
                  onClick={() => {
                    setIsFocused(false);
                    if (onSearchSubmit) onSearchSubmit();
                  }}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-4 sm:px-7 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm md:text-base transition-all shadow-md shadow-[#F26430]/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 sm:hidden" />
                  <span className="hidden sm:inline">ค้นหาเลย</span>
                  <span className="sm:hidden text-xs">ค้นหา</span>
                </button>
              </div>

              {/* Auto-Suggest Dropdown Menu */}
              {isFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E8E2D8] p-3 z-50 text-left space-y-3 animate-fade-in max-h-72 overflow-y-auto">
                  
                  {/* Section 1: Popular Search Suggestions */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-slate-100 flex items-center justify-between">
                      <span>🔥 10 หมวดหมู่กิจกรรมยอดนิยม</span>
                    </p>
                    {SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => {
                          setSearchQuery(sug.query);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#FAF7F2] hover:text-[#F26430] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#F26430] transition-colors truncate">
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

                </div>
              )}
            </div>

            {/* Single Clean Surprise Me Discovery Button */}
            {onOpenSurpriseModal && (
              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onOpenSurpriseModal}
                  className="text-xs sm:text-[13px] font-extrabold px-4 sm:px-5 py-2 rounded-full bg-white/95 hover:bg-white text-[#1E293B] hover:text-[#F26430] border border-[#E8E2D8] hover:border-[#F26430]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 group"
                  title="สุ่มกิจกรรมวันหยุดให้ฉันทันที"
                >
                  <Dices className="w-4 h-4 text-[#F26430] group-hover:rotate-180 transition-transform duration-500" />
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
