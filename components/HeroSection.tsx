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
    { label: '📚 งานสัปดาห์หนังสือแห่งชาติ ครั้งที่ 52', tag: 'หนังสือ' },
    { label: '🏃 Bangkok City Night Marathon 2026', tag: 'วิ่ง' },
    { label: '🎲 Board Game Night & Chill (Introvert Friendly)', tag: 'บอร์ดเกม' },
    { label: '🏛️ BITEC Pop Culture & Anime Expo 2026', tag: 'BITEC' },
    { label: '🧘 Sound Bath Meditation ฮีลจิตใจ', tag: 'Sound Bath' },
    { label: '🎨 Workshop ปั้นเซรามิกทำมือ', tag: 'งานคราฟต์' },
  ];

  return (
    <section className="relative z-30 pt-3 pb-2 md:pt-4 md:pb-3 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Full Hero Banner Container with 70% Center Space */}
        <div className="relative rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8]/60 shadow-sm min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
          
          {/* Full-bleed Background Image with 70% Empty Center */}
          <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden">
            <img
              src="/hero-bg-70.png"
              alt="Chill & Connect Hero Background with 70% Safe Zone"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Centered Safe Zone for Text & Search Bar (Guaranteed 70% Center Clearance) */}
          <div className="relative z-10 text-center space-y-4 max-w-xl mx-auto px-4 py-8 sm:py-12 w-full">
            
            {/* Dynamic Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              วันหยุดนี้... <span className="text-[#F26430] inline-block hover:scale-105 transition-transform cursor-default">ทำอะไรดี?</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#334155] font-semibold max-w-xl mx-auto drop-shadow-xs">
              ค้นหากิจกรรมฮีลใจ หาเพื่อนใหม่ และความสนุก!
            </p>

            {/* Large Pill Search Bar with Auto-Suggest */}
            <div className="pt-2 max-w-xl mx-auto relative z-30">
              <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full p-2 shadow-xl shadow-black/5 border border-[#E2DCD2] focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/10 transition-all z-20">
                
                {/* Search Icon */}
                <div className="pl-4 pr-2 text-[#94A3B8]">
                  <Search className="w-5 h-5" />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ค้นหากิจกรรม, สถานที่ หรือแท็กที่สนใจ..."
                  className="w-full bg-transparent text-sm sm:text-base text-[#1E293B] placeholder-[#94A3B8] focus:outline-none pr-2 font-medium"
                />

                {/* Clear Query Button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 text-[#94A3B8] hover:text-[#475569] mr-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Coral CTA Button */}
                <button
                  onClick={() => {
                    setIsFocused(false);
                    if (onSearchSubmit) onSearchSubmit();
                  }}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all shadow-md shadow-[#F26430]/25 flex items-center gap-2 shrink-0 active:scale-95"
                >
                  <span>ค้นหาเลย</span>
                </button>
              </div>

              {/* Auto-Suggest Dropdown Menu */}
              {isFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E8E2D8] p-3 z-50 text-left space-y-3 animate-fade-in max-h-80 overflow-y-auto">
                  
                  {/* Section 1: Popular Search Suggestions */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider sticky top-0 bg-white z-10 border-b border-slate-100 flex items-center justify-between">
                      <span>⚡ ผลการค้นหาแนะนำยอดฮิต</span>
                    </p>
                    {SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => {
                          setSearchQuery(sug.tag);
                          setIsFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#FAF7F2] hover:text-[#F26430] transition-colors flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{sug.label}</span>
                        <span className="text-[10px] text-[#4A7C59] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 font-bold">
                          {sug.tag}
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
                          className="hover:bg-[#F26430] hover:text-white hover:border-[#F26430] text-[#475569] transition-all bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/80 shadow-2xs"
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
    </section>
  );
};
