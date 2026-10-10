'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Heart, ArrowRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_POSTS } from '@/data/mockData';

interface CommunityMomentsStripProps {
  minimalHeader?: boolean;
}

export const CommunityMomentsStrip: React.FC<CommunityMomentsStripProps> = ({
  minimalHeader = false,
}) => {
  const displayPosts = MOCK_POSTS;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [displayPosts.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 240;
    const gap = 14;
    const scrollAmount = cardWidth + gap;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-3 scroll-mt-20">
      {/* Header Bar: Editorial Section 05 Banner or Minimal Header */}
      {minimalHeader ? (
        <div className="flex items-center justify-between gap-4 pb-1 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs font-black shrink-0 border border-rose-500/20">
              <Camera className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>โมเมนต์ & บรรยากาศจริงจากชุมชน</span>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {MOCK_POSTS.length} เรื่องราว
              </span>
            </h2>
          </div>
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/80 hover:border-rose-500 rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer active:scale-95 leading-none"
          >
            <span>ดูโมเมนต์ทั้งหมด ({MOCK_POSTS.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-rose-50/60 via-pink-50/30 to-transparent p-3 sm:p-3.5 rounded-2xl border border-rose-100/70 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center text-xs font-black shrink-0 border border-rose-500/20">
                05
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>โมเมนต์ & บรรยากาศจริงจากชุมชน</span>
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {displayPosts.length} เรื่องราว
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
              ภาพถ่ายความประทับใจ บรรยากาศคาเฟ่ และมิตรภาพใหม่ๆ ที่เกิดขึ้นจริงจากผู้ร่วมทริป
            </p>
          </div>

          {/* Action Link: Jump to /moments */}
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/80 hover:border-rose-500 rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <span>ดูโมเมนต์ทั้งหมด ({MOCK_POSTS.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Manual Scrollable Container with Floating Mid-Arrows */}
      <div className="relative group/carousel">
        {/* Floating Left Arrow (Vertically Centered on Cards) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          title="เลื่อนไปทางซ้าย"
          aria-label="Previous moments"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Arrow (Vertically Centered on Cards) */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          className="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          title="เลื่อนไปทางขวา"
          aria-label="Next moments"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-3.5 pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scroll-smooth"
        >
          {displayPosts.map((post) => (
            <div
              key={post.id}
              className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-2*14px)/3)] md:w-[calc((100%-3*14px)/4)] lg:w-[calc((100%-4*14px)/5)] shrink-0 snap-start"
            >
              <Link
                href="/moments"
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full select-none"
              >
                {/* Full-bleed Photo */}
                <img
                  src={post.images[0] || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Subtle Top Shadow for Location Badge */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                {/* Deep Bottom Shadow for Text & Info */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

                {/* Top Location Badge */}
                {post.location && (
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 truncate max-w-full">
                      <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </span>
                  </div>
                )}

                {/* Bottom Overlaid Caption and Author Details (Borderless) */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end space-y-1.5 z-10">
                  <p className="text-white text-xs font-semibold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-amber-200 transition-colors">
                    {post.caption}
                  </p>

                  <div className="pt-1.5 flex items-center justify-between text-white/90 border-t border-white/15">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={post.userName}
                        className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
                      />
                      <span className="truncate text-[10.5px] font-medium text-white/90">
                        {post.userName.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-rose-300 font-bold text-[10.5px] shrink-0 ml-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{post.likesCount}</span>
                    </div>
                  </div>
                </div>

              </Link>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
