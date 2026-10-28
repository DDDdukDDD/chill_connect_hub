'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Star, ExternalLink } from 'lucide-react';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { NearbyDiningItem, getNearbyDining, getNearbyDiningSync } from '@/lib/nearbyDiningService';

interface NearbyDiningSectionProps {
  spot: LifestyleSpotItem;
  /** Places near this one, picked by the server page (lib/spotBrowse.ts nearbyPool) */
  pool?: LifestyleSpotItem[];
}

/** "Near" for cafés around a place: a short ride (the Google search radius is 3 km too) */
const NEAR_KM = 3;

export const NearbyDiningSection: React.FC<NearbyDiningSectionProps> = ({ spot, pool: nearbyPool }) => {
  // Nearby cafes come from the live catalog (imported places carry real coordinates)
  const pool = useMemo(() => nearbyPool ?? [], [nearbyPool]);
  const localItems = useMemo(() => getNearbyDiningSync(spot, 6, pool), [spot, pool]);
  const [liveItems, setLiveItems] = useState<NearbyDiningItem[] | null>(null);
  const diningItems = liveItems ?? localItems;
  const [isLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    getNearbyDining(spot, 6, pool)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setLiveItems(items);
        }
      })
      .catch((err) => {
        console.warn('Failed to load live nearby dining:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [spot, pool]);

  const liveSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent('คาเฟ่ ร้านอาหาร')}/@${spot.latitude},${spot.longitude},15z`;

  // Only places a short ride away, nearest first ("รอบย่าน" means close; the catalog fallback had no limit)
  const nearby = diningItems.filter((item) => item.distanceKm <= NEAR_KM).sort((a, b) => a.distanceKm - b.distanceKm);
  if (isLoading || nearby.length === 0) return null;
  const fromGoogle = nearby.some((item) => item.reviewsSource === 'google');

  return (
    <section className="space-y-3 pt-5 border-t border-slate-100">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">ร้านกาแฟและร้านอร่อยใกล้ๆ</h2>
        <a href={liveSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0">
          ดูเพิ่มบนแผนที่
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>

      {/* One column of rows: names and details have room to be read in full */}
      <ul className="divide-y divide-slate-100">
        {nearby.map((item) => {
          const internal = Boolean(item.spotId);
          const distance = item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} ม.` : `${item.distanceKm.toFixed(1)} กม.`;
          const row = (
            <span className="flex items-center gap-3 py-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the catalog or a neutral placeholder */}
              <img src={item.image} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:underline">{item.name}</span>
                  {!internal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />}
                </span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                  {item.rating > 0 && (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                  {item.rating > 0 && <span aria-hidden="true">·</span>}
                  <span className="whitespace-nowrap">{item.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{distance}</span>
                </span>
                {item.specialty && <span className="block text-xs text-slate-500 line-clamp-1">{item.specialty}</span>}
              </span>
            </span>
          );
          return (
            <li key={item.id}>
              {internal ? (
                <Link href={`/spots/${encodeURIComponent(item.spotId!)}`} className="block">{row}</Link>
              ) : (
                <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block" title={`เปิด "${item.name}" บน Google Maps`}>{row}</a>
              )}
            </li>
          );
        })}
      </ul>
      {fromGoogle && <p className="text-[11px] text-slate-400">ข้อมูลร้านและคะแนน: Google Maps</p>}
    </section>
  );
};
