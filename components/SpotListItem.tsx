'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import { LifestyleSpotItem } from '@/data/spotsData';
import { formatSpotBadgePrice } from '@/components/SpotCard';
import { motion } from 'framer-motion';

interface SpotListItemProps {
  spot: LifestyleSpotItem;
  onSelect?: (spot: LifestyleSpotItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isJoined?: boolean;
  index?: number;
}

/**
 * Editorial List Row for Lifestyle Spots.
 * Designed with Global Luxury aesthetics: high scannability, compact 80-120px thumbnail,
 * crisp typographic hierarchy, and responsive action placement.
 */
export const SpotListItem: React.FC<SpotListItemProps> = ({
  spot,
  onSelect,
  isFavorite,
  onToggleFavorite,
  isJoined = false,
  index = 0,
}) => {
  return (
    <motion.div
      id={`spot-list-${spot.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
      className="block"
    >
      <Link
        href={`/spots/${encodeURIComponent(spot.id)}`}
        onClick={() => {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('chill_last_viewed_spot', spot.id);
              sessionStorage.setItem('chill_active_tab', 'spots');
            } catch (e) {}
          }
          if (onSelect) onSelect(spot);
        }}
        className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-3.5 gap-3.5 sm:gap-4 relative overflow-hidden cursor-pointer ${
          isJoined || isFavorite
            ? 'border-2 border-[#4A7C59] ring-2 ring-[#4A7C59]/25 shadow-md'
            : 'border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md'
        }`}
      >
        {/* Left & Middle: Thumbnail + Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            <img
              src={spot.image}
              alt={spot.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

            {/* Distance Pill */}
            {(spot as any).distanceKm !== undefined && (
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold bg-slate-900/80 backdrop-blur-md text-white px-1.5 py-0.5 rounded-full shadow-2xs">
                {((spot as any).distanceKm).toFixed(1)} กม.
              </span>
            )}

            {/* Mobile Bookmark Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(spot.id);
              }}
              className={`sm:hidden absolute top-1.5 right-1.5 w-6 h-6 rounded-full shadow-xs flex items-center justify-center transition-all z-20 cursor-pointer ${
                isFavorite
                  ? 'bg-[#4A7C59] text-white'
                  : 'bg-white/90 text-slate-400'
              }`}
              title={isFavorite ? 'นำออกจากสมุดท่องเที่ยว' : 'บันทึกลงสมุดท่องเที่ยว'}
            >
              <Bookmark className={`w-3 h-3 ${isFavorite ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Top Row: Rating & Category / Highlights */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {spot.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/50 px-1.5 py-0.2 rounded-md shrink-0">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{spot.rating.toFixed(1)}</span>
                </span>
              )}

              {spot.categoryLabel && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                  {spot.categoryLabel}
                </span>
              )}

              {spot.vibeTags && spot.vibeTags.length > 0 && (
                <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                  #{spot.vibeTags[0]}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#4A7C59] transition-colors leading-snug tracking-tight line-clamp-1 sm:line-clamp-2"
              title={spot.title}
            >
              {spot.title}
            </h3>

            {/* Location & Open Hours */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs text-slate-600 font-medium">
                  {spot.district}, {spot.province}
                </span>
              </div>

              {spot.openHours && (
                <div className="flex items-center gap-1 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs text-slate-400">
                    {spot.openHours}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Price & Bookmark CTA */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:pl-4 sm:border-l sm:border-slate-100/80 min-w-[130px]">
          {/* Price Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
              spot.price.includes('ฟรี')
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {formatSpotBadgePrice(spot.price)}
          </span>

          {/* Desktop Bookmark & Link */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(spot.id);
              }}
              className={`w-7 h-7 rounded-full shadow-2xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-[#4A7C59] text-white shadow-[#4A7C59]/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
              }`}
              title={isFavorite ? 'นำออกจากสมุดท่องเที่ยว' : 'บันทึกลงสมุดท่องเที่ยว'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : ''}`} />
            </button>

            <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#4A7C59] flex items-center gap-0.5 transition-colors">
              <span>ดูพิกัด</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
