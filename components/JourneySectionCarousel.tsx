'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface JourneySectionCarouselProps {
  number?: string;
  numberBg?: string;
  numberText?: string;
  borderTheme?: string;
  gradientTheme?: string;
  title: string;
  badgeText?: string;
  badgeStyle?: string;
  subtitle?: string;
  moreLink: string;
  moreText: string;
  totalCount?: number;
  children: React.ReactNode;
}

export const JourneySectionCarousel: React.FC<JourneySectionCarouselProps> = ({
  title,
  moreLink,
  moreText,
  children,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = React.useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Ensure initial scroll position is 0
    el.scrollLeft = 0;
    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Schedule check after layout render
    const timer = setTimeout(checkScroll, 80);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

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
      {/* Header Row: Minimal & Unboxed without subtitle/badge/boxes */}
      <div className="flex items-center justify-between gap-4 pb-1 pt-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h2>

        {/* More / See All Button */}
        <Link
          href={moreLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer active:scale-95 leading-none"
        >
          <span>{moreText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Manual Scrollable Container (5 Items Max) with Floating Mid-Arrows */}
      <div className="relative group/carousel">
        {/* Floating Left Arrow (Vertically Centered on Cards) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          title="เลื่อนไปทางซ้าย"
          aria-label="Previous items"
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
          aria-label="Next items"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-3.5 pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scroll-smooth"
        >
          {children}
        </div>
      </div>
    </section>
  );
};
