'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      setIsFocused(false);
      onSearchSubmit();
    }
  };

  const SUGGESTIONS = [
    { label: '🏛️ งานอีเวนต์ & มหกรรมใหญ่', query: 'งานใหญ่', sub: 'สัปดาห์หนังสือ, ไบเทค, อิมแพ็ค, สิริกิติ์' },
    { label: '🏃‍♂️ งานวิ่ง & มาราธอน', query: 'วิ่ง', sub: 'ซิตี้รัน, ไนท์มาราธอน, สวนเบญฯ' },
    { label: '🏋️‍♀️ ฟิตเนส & ไฮร็อกซ์ (HYROX)', query: 'Hyrox', sub: 'เวิร์กเอาต์กลุ่ม, ฟิตเนส, เทรนนิ่ง' },
    { label: '🧘 โยคะ & สมาธิเสียงคลื่น (Sound Bath)', query: 'ฮีลใจ', sub: 'Sound Bath, โยคะสวน, ฝึกสมาธิ' },
    { label: '☕ คาเฟ่ & ดนตรีอะคูสติก', query: 'กาแฟ', sub: 'สโลว์บาร์, ดนตรีสด, จิบกาแฟคุยชิลล์' },
    { label: '🎲 บอร์ดเกม & กิจกรรมเพื่อนใหม่', query: 'บอร์ดเกม', sub: 'ปาร์ตี้บอร์ดเกม, Pub Quiz, ทำความรู้จักเพื่อนใหม่' },
    { label: '🎨 เวิร์กช็อปศิลปะ & งานคราฟต์', query: 'งานคราฟต์', sub: 'ปั้นเซรามิก, ระบายสีน้ำ, เทียนหอม, เย็บหนัง' },
    { label: '🍵 ชงชา & เวิร์กช็อปทำอาหาร', query: 'ชงชา', sub: 'ชงมัทฉะ, อบขนมปังซาวร์โด, ทำขนม' },
    { label: '📷 เดินถ่ายรูป & สำรวจเมือง', query: 'ถ่ายรูป', sub: 'กล้องฟิล์ม, สตรีทโฟโต้, เดินลุยตลาดเก่า' },
    { label: '🏄‍♂️ กิจกรรมกีฬา & เอาต์ดอร์', query: 'กีฬา', sub: 'พาย SUP Board, ปีนหน้าผาจำลอง, ตีแบด' },
  ];

  return (
    <section className="relative z-30 pt-1 pb-1 md:pt-2 md:pb-2 bg-[#FAF7F2]">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Full Hero Banner Container with 70% Center Space - Compact Height */}
        <div className="relative rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8]/60 shadow-sm min-h-[250px] sm:min-h-[280px] flex items-center justify-center">
          
          {/* Full-bleed Background Image with 70% Empty Center */}
          <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden">
            <img
              src="/hero-bg-70.png"
              alt="Chill & Connect Hero Background with 70% Safe Zone"
              className="w-full h-full object-cover object-center opacity-40 sm:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* Centered Safe Zone for Text & Search Bar - Compact & Clean on Mobile */}
          <div className="relative z-10 text-center space-y-2.5 sm:space-y-3 max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full">
            <div className="bg-white/80 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none rounded-3xl p-4 sm:p-0 shadow-xs sm:shadow-none border border-white/60 sm:border-none space-y-2 sm:space-y-3">
              
              {/* Dynamic Headline */}
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-xs">
                วันหยุดนี้... <span className="text-[#F26430] inline-block hover:scale-105 transition-transform cursor-default">ทำอะไรดี?</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-[#334155] font-semibold max-w-xl mx-auto drop-shadow-xs">
                ค้นหากิจกรรมฮีลใจ หาเพื่อนใหม่ และความสนุก!
              </p>

              {/* Compact Pill Search Bar with Auto-Suggest */}
              <div className="pt-1 max-w-lg mx-auto relative z-30">
                <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full p-1 sm:p-1.5 shadow-lg shadow-black/5 border border-[#E2DCD2] focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/10 transition-all z-20">
                  
                  {/* Search Icon */}
                  <div className="pl-3 sm:pl-3.5 pr-1.5 sm:pr-2 text-[#94A3B8]">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Input Field */}
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ค้นหากิจกรรม, สถานที่..."
                    className="w-full bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none pr-1 sm:pr-2 font-medium"
                  />

                  {/* Clear Query Button */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-[#94A3B8] hover:text-[#475569] mr-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Coral CTA Button (Compact on Mobile) */}
                  <button
                    onClick={() => {
                      setIsFocused(false);
                      if (onSearchSubmit) onSearchSubmit();
                    }}
                    className="bg-[#F26430] hover:bg-[#D95322] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#F26430]/25 flex items-center justify-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Search className="w-3 h-3 sm:hidden" />
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

                  {/* Section 2: Popular Hashtags embedded inside dropdown */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-2 px-2 pb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      🔥 แท็กค้นหายอดฮิต
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { tag: '#Hyrox', query: 'Hyrox' },
                        { tag: '#Introvert-friendly', query: 'Introvert-friendly' },
                        { tag: '#Beginner', query: 'Beginner' },
                        { tag: '#BoardGame', query: 'บอร์ดเกม' },
                        { tag: '#SoundBath', query: 'Sound Bath' },
                      ].map((item) => (
                        <button
                          key={item.tag}
                          onMouseDown={() => {
                            setSearchQuery(item.query);
                            setIsFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="hover:bg-[#F26430] hover:text-white hover:border-[#F26430] text-[#475569] transition-all bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/80 shadow-2xs cursor-pointer"
                        >
                          {item.tag}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        </div>

      </div>
    </section>
  );
};
