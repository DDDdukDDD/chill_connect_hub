'use client';

import React from 'react';
import { SponsoredBadge } from './SponsoredBadge';
import Link from 'next/link';
import { MapPin, Heart, Star } from 'lucide-react';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { optimizedImage } from '@/lib/optimizedImage';
import { formatSpotBadgePrice } from '@/components/SpotCard';

// "เขตพระนคร · กรุงเทพฯ", or the province alone when the district is missing or repeats it
function areaOf(spot: LifestyleSpotItem) {
  const province = spot.province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : spot.province;
  const district = (spot.district || '').trim();
  return district && district !== spot.province && district !== province ? `${district} · ${province}` : province;
}

const hasPrice = (price?: string) => Boolean(price?.trim()) && !/ไม่ระบุ|ไม่ทราบ/.test(price!);

/**
 * A place as /spots lists it, built like the ตี้ and อีเวนต์ tiles so the three tabs feel like one page:
 * a square photo with one badge (what it costs to get in, when known), the title, then distance or rating with the area.
 * No frame; the whole tile is one link.
 */
export function SpotTile({
  spot,
  isSaved = false,
  onToggleSave,
  sponsored = false,
}: {
  spot: LifestyleSpotItem & { distanceKm?: number };
  isSaved?: boolean;
  onToggleSave?: (spotId: string) => void;
  /** A paid-for place in a list (lib/sponsored): "สนับสนุน" on the photo */
  sponsored?: boolean;
}) {
  return (
    <Link href={`/spots/${encodeURIComponent(spot.id)}`} className="group block">
      <span className="relative block aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-md">
        <img
          src={optimizedImage(spot.image, 384)}
          alt={spot.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {sponsored && <SponsoredBadge />}
        {/* What it costs to get in; no badge when the source does not say, rather than "ไม่ระบุ" on the photo */}
        {hasPrice(spot.price) && (
          <span className="absolute right-2.5 bottom-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm bg-[#4A7C59] text-white">
            {formatSpotBadgePrice(spot.price)}
          </span>
        )}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(spot.id);
            }}
            aria-label={isSaved ? 'เลิกบันทึกที่เที่ยวนี้' : 'บันทึกที่เที่ยวนี้'}
            aria-pressed={isSaved}
            className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#4A7C59] text-[#4A7C59]' : 'text-slate-900'}`} aria-hidden="true" />
          </button>
        )}
      </span>
      <span className="mt-3 text-sm font-bold leading-snug line-clamp-2 text-slate-900 group-hover:underline" title={spot.title}>
        {spot.title}
      </span>
      {/* One line, as on a ตี้: how far (when sorted near me) or the rating leads in the pillar's green, the area after it */}
      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {spot.distanceKm !== undefined ? (
          <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-[#4A7C59]">{spot.distanceKm.toFixed(1)} กม. ·</span>
        ) : spot.rating > 0 ? (
          <span className="shrink-0 flex items-center gap-0.5 font-semibold tabular-nums text-[#4A7C59]">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {spot.rating} ·
          </span>
        ) : null}
        <span className="truncate">{areaOf(spot)}</span>
      </span>
    </Link>
  );
}

/** The grey stand-in while places load: same square and two lines */
export function SpotTileSkeleton() {
  return (
    <div>
      <div className="aspect-square rounded-3xl bg-slate-100 animate-pulse" />
      <div className="mt-3 h-4 w-4/5 rounded-full bg-slate-100 animate-pulse" />
      <div className="mt-2 h-3 w-3/5 rounded-full bg-slate-100 animate-pulse" />
    </div>
  );
}
