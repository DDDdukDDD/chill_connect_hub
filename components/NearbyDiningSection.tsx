'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Coffee, Star, ExternalLink, Clock, ArrowRight, Navigation, Sparkles } from 'lucide-react';
import { LifestyleSpotItem, MOCK_SPOTS } from '@/data/spotsData';
import { NearbyDiningItem, getNearbyDining, getNearbyDiningSync } from '@/lib/nearbyDiningService';
import { usePublishedSpots } from '@/lib/usePublishedSpots';

interface NearbyDiningSectionProps {
  spot: LifestyleSpotItem;
}

export const NearbyDiningSection: React.FC<NearbyDiningSectionProps> = ({ spot }) => {
  // Nearby cafes come from the live catalog (imported places carry real coordinates)
  const { spots: publishedSpots } = usePublishedSpots();
  const pool = publishedSpots.length > 0 ? publishedSpots : MOCK_SPOTS;
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

  if (isLoading) {
    return (
      <div className="space-y-3.5 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-52 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-3.5 w-72 bg-slate-50 rounded-md animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-slate-100 rounded-md animate-pulse hidden sm:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse flex items-center gap-3 p-2.5">
              <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (diningItems.length === 0) return null;

  return (
    <div className="space-y-3 pt-5 border-t border-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Coffee className="w-3 h-3" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              พิกัดคาเฟ่ & ร้านอร่อยยอดฮิตรอบย่าน
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            คัดสรร 6 ร้านกาแฟและร้านอร่อยใกล้ {spot.title} ในระยะ 5-10 นาที
          </p>
        </div>

        <a
          href={liveSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2D5A3C] hover:text-[#1B432C] hover:underline shrink-0"
        >
          <span>เปิดดูร้านทั้งหมดรอบพิกัดนี้บน Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Grid of 6 Compact Cards (2 columns x 3 rows - Sleek & Space-Efficient) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {diningItems.map((item) => {
          const isInternalSpot = Boolean(item.spotId);
          const destinationHref = isInternalSpot ? `/spots/${encodeURIComponent(item.spotId!)}` : item.googleMapsUrl;

          const CardContent = (
            <div className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#4A7C59]/40 hover:bg-slate-50/50 shadow-2xs hover:shadow-xs transition-all group cursor-pointer relative overflow-hidden">
              
              {/* Thumbnail with Overlaid Star Rating */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {item.rating > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-black px-1 py-0.2 rounded flex items-center gap-0.5 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating.toFixed(1)}</span>
                  </span>
                )}
              </div>

              {/* Info Column (Compact & No top badge) */}
              <div className="min-w-0 flex-1 space-y-0.5">
                {/* Title (Clean, directly at the top) */}
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug truncate group-hover:text-[#2D5A3C] transition-colors">
                  {item.name}
                </h4>

                {/* Signature Menu or Highlight */}
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {item.specialty}
                </p>

                {/* Specs: Distance + Hours + Action Button */}
                <div className="flex items-center justify-between gap-1.5 text-[10.5px] pt-0.5">
                  <div className="flex items-center gap-1 text-slate-500 font-medium truncate">
                    <span className="font-bold text-slate-700 inline-flex items-center gap-0.5 shrink-0">
                      <Navigation className="w-2.5 h-2.5 text-[#2D5A3C]" />
                      <span>{item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} ม.` : `${item.distanceKm.toFixed(1)} กม.`}</span>
                    </span>
                    <span>•</span>
                    <span className="truncate">{item.openHours}</span>
                  </div>

                  {/* Micro Action Button */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 inline-flex items-center gap-1 transition-colors ${
                    isInternalSpot
                      ? 'bg-emerald-50 text-[#2D5A3C] group-hover:bg-[#2D5A3C] group-hover:text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
                    <span>{isInternalSpot ? 'ดูรายละเอียด' : 'ดูพิกัด & รีวิว'}</span>
                    {isInternalSpot ? <ArrowRight className="w-2.5 h-2.5" /> : <ExternalLink className="w-2.5 h-2.5" />}
                  </span>
                </div>
              </div>

            </div>
          );

          if (isInternalSpot) {
            return (
              <Link
                key={item.id}
                href={destinationHref}
                title={`ดูรายละเอียดสถานที่ "${item.name}" ใน Chill & Connect Hub`}
                className="block"
              >
                {CardContent}
              </Link>
            );
          }

          return (
            <a
              key={item.id}
              href={destinationHref}
              target="_blank"
              rel="noopener noreferrer"
              title={`เปิดดูร้าน "${item.name}" บน Google Maps`}
              className="block"
            >
              {CardContent}
            </a>
          );
        })}
      </div>

      {/* Footnote */}
      <div className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3 text-[10.5px] text-slate-500">
        <span className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">แตะการ์ดเพื่อเปิดดูรายละเอียดสถานที่ หรือดูพิกัดและรีวิวจริงบน Google Maps ได้ทันที</span>
        </span>
        <a
          href={liveSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-slate-700 hover:text-slate-900 underline shrink-0"
        >
          ค้นหาร้านสดรอบตัว
        </a>
      </div>

    </div>
  );
};
