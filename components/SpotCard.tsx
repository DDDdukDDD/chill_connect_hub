'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Heart,
  Star,
  ArrowRight
} from 'lucide-react';
import { LifestyleSpotItem } from '@/data/spotsData';

/**
 * Formats lengthy spot price details into a clean, compact badge string for card views.
 */
export function formatSpotBadgePrice(price: string | undefined | null): string {
  if (!price) return 'เข้าฟรี';
  const clean = price.trim();

  // 1. Check if free
  if (clean.startsWith('เข้าฟรี') || clean === 'ฟรี') {
    return 'เข้าฟรี';
  }
  if (clean.startsWith('คนไทยเข้าฟรี')) {
    return 'คนไทยฟรี';
  }
  if (clean.includes('เข้าฟรี') && !clean.includes('฿') && !clean.includes('บาท')) {
    return 'เข้าฟรี';
  }

  // 2. Remove parenthetical remarks like (เช่าเรือ...), (ต่างชาติ...), (กางเต็นท์...)
  const basePrice = clean.replace(/\s*\([^)]*\)/g, '').trim();

  // 3. Extract numbers for concise display
  const numberMatches = basePrice.match(/\d[\d,]*/g);

  if (numberMatches && numberMatches.length > 0) {
    const nums = numberMatches
      .map(n => parseInt(n.replace(/,/g, ''), 10))
      .filter(n => !isNaN(n) && n > 0 && n < 10000);

    if (nums.length >= 2 && (basePrice.includes('/') || basePrice.includes('-') || basePrice.includes('ถึง') || basePrice.includes(','))) {
      const primaryNums = nums.slice(0, 2);
      const min = Math.min(...primaryNums);
      const max = Math.max(...primaryNums);
      if (min === max) return `฿${min}`;
      return `฿${min} - ฿${max}`;
    }

    if (nums.length >= 1) {
      return `฿${nums[0]}`;
    }
  }

  if (basePrice.length > 12) {
    return basePrice.slice(0, 10) + '...';
  }
  return basePrice || 'มีค่าเข้า';
}

interface SpotCardProps {
  spot: LifestyleSpotItem;
  onSelect?: (spot: LifestyleSpotItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <Link
      href={`/spots/${encodeURIComponent(spot.id)}`}
      id={`spot-${spot.id}`}
      onClick={() => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('chill_last_viewed_spot', spot.id);
            sessionStorage.setItem('chill_active_tab', 'spots');
          } catch (e) {}
        }
        if (onSelect) onSelect(spot);
      }}
      className="group bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={spot.image}
          alt={spot.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient Overlay for bottom text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-11 flex items-center gap-1.5 flex-wrap z-10">
          <span className="text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 px-2.5 py-0.5 rounded-full shadow-xs">
            {spot.categoryLabel}
          </span>

          {(spot as any).distanceKm !== undefined && (
            <span className="text-[10px] font-medium bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
              {((spot as any).distanceKm).toFixed(1)} กม.
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(spot.id);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-xs flex items-center justify-center text-slate-400 hover:text-[#F26430] hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
          title={isFavorite ? 'ยกเลิกบันทึก' : 'บันทึกสถานที่นี้'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#F26430] text-[#F26430]' : ''
            }`}
          />
        </button>

        {/* Rating */}
        <div className="absolute bottom-2 right-2.5 flex items-center gap-1 text-white z-10">
          <span className="text-[11px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{spot.rating}</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
        <div className="space-y-1.5">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#4A7C59] transition-colors leading-snug flex-1">
              {spot.title}
            </h3>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                spot.price.includes('ฟรี')
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {formatSpotBadgePrice(spot.price)}
            </span>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{spot.openHours}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{spot.district}, {spot.province}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
