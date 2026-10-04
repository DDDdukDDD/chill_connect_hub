'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Heart, Bookmark } from 'lucide-react';

interface JourneyMomentCardProps {
  type: 'community' | 'fair' | 'spot';
  id: string;
  title: string;
  image: string;
  location: string;
  categoryLabel?: string;
  dateOrHours?: string;
  authorOrHost?: {
    name: string;
    avatar?: string;
  };
  metricBadge?: React.ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  href: string;
}

export const JourneyMomentCard: React.FC<JourneyMomentCardProps> = ({
  type,
  id,
  title,
  image,
  location,
  categoryLabel,
  dateOrHours,
  authorOrHost,
  metricBadge,
  isFavorite = false,
  onToggleFavorite,
  href,
}) => {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer w-full select-none"
    >
      {/* Full-bleed Photo */}
      <img
        src={image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';
        }}
      />

      {/* Subtle Top Shadow for Badges */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

      {/* Deep Bottom Shadow for Typography */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none" />

      {/* Top Badges Row */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 gap-2">
        {/* Location pill */}
        {location && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/95 bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 truncate max-w-[calc(100%-36px)]">
            <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        )}

        {/* Favorite / Bookmark Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(id);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shrink-0 ${
              isFavorite
                ? type === 'spot'
                  ? 'bg-[#4A7C59] text-white shadow-md'
                  : 'bg-rose-500 text-white shadow-md'
                : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60 border border-white/20'
            }`}
            title={isFavorite ? 'ลบออกจากรายการโปรด' : 'บันทึกลงรายการโปรด'}
          >
            {type === 'spot' ? (
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
            ) : (
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
            )}
          </button>
        )}
      </div>

      {/* Bottom Overlaid Details (Pure Moments Style) */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex flex-col justify-end space-y-1.5 z-10">
        {/* Optional Category / Date Tag */}
        {categoryLabel && (
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 drop-shadow-sm truncate">
            {categoryLabel}
          </div>
        )}

        {/* Title */}
        <h3 className="text-white text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-amber-200 transition-colors">
          {title}
        </h3>

        {/* Footer Meta Row with Top Divider */}
        <div className="pt-1.5 flex items-center justify-between text-white/90 border-t border-white/15 text-[10.5px]">
          {/* Left: Author / Host / Date */}
          <div className="flex items-center gap-1.5 min-w-0">
            {authorOrHost?.avatar && (
              <img
                src={authorOrHost.avatar}
                alt={authorOrHost.name}
                className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
              />
            )}
            <span className="truncate text-white/85 font-medium">
              {authorOrHost?.name || dateOrHours}
            </span>
          </div>

          {/* Right Metric */}
          {metricBadge && (
            <div className="shrink-0 font-bold text-white/95 flex items-center gap-1 text-[10.5px]">
              {metricBadge}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
