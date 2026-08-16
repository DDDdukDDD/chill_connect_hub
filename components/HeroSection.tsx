'use client';

import React from 'react';
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <section className="relative overflow-hidden pt-3 pb-2 md:pt-4 md:pb-3 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Full Hero Banner Container with 70% Center Space */}
        <div className="relative rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E8E2D8]/60 shadow-sm min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
          
          {/* Full-bleed Background Image with 70% Empty Center */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/hero-bg-70.png"
              alt="Chill & Connect Hero Background with 70% Safe Zone"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Centered Safe Zone for Text & Search Bar (Guaranteed 70% Center Clearance) */}
          <div className="relative z-10 text-center space-y-4 max-w-xl mx-auto px-4 py-8 sm:py-12">
            
            {/* Dynamic Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              วันหยุดนี้... <span className="text-[#F26430] inline-block hover:scale-105 transition-transform cursor-default">ทำอะไรดี?</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#334155] font-semibold max-w-xl mx-auto drop-shadow-xs">
              ค้นหากิจกรรมฮีลใจ หาเพื่อนใหม่ และความสนุก!
            </p>

            {/* Large Pill Search Bar */}
            <div className="pt-2 max-w-xl mx-auto">
              <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full p-2 shadow-xl shadow-black/5 border border-[#E2DCD2] focus-within:border-[#F26430] focus-within:ring-4 focus-within:ring-[#F26430]/10 transition-all">
                
                {/* Search Icon */}
                <div className="pl-4 pr-2 text-[#94A3B8]">
                  <Search className="w-5 h-5" />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
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
                  onClick={onSearchSubmit}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all shadow-md shadow-[#F26430]/25 flex items-center gap-2 shrink-0 active:scale-95"
                >
                  <span>ค้นหาเลย</span>
                </button>
              </div>

              {/* Popular Tags */}
              <div className="mt-3.5 flex items-center justify-center gap-2 flex-wrap text-xs text-[#475569] font-medium">
                <span className="font-bold text-[#1E293B]">ค้นหายอดฮิต:</span>
                {['#Hyrox', '#Introvert-friendly', '#Beginner', '#BoardGame', '#SoundBath'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag.replace('#', ''))}
                    className="hover:text-[#F26430] transition-colors underline decoration-dotted bg-white/70 px-2.5 py-0.5 rounded-full border border-[#E2DCD2]"
                  >
                    {tag}
                  </button>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
