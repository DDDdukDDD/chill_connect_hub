'use client';

import React from 'react';
import {
  MapPin,
  Clock,
  Heart,
  Star,
  ArrowRight
} from 'lucide-react';
import { LifestyleSpotItem } from '@/data/spotsData';

interface SpotCardProps {
  spot: LifestyleSpotItem;
  onSelect: (spot: LifestyleSpotItem) => void;
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
    <div
      onClick={() => onSelect(spot)}
      className="group bg-white rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
    >
      {/* Top Image Container (aspect-video ratio matching Event Cards) */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={spot.image}
          alt={spot.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Hover Hint Pill (Matching Event Card) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border bg-white/95 text-[#1E293B] border-white/50">
            ดูรายละเอียดสถานที่
          </span>
        </div>

        {/* Top-Right Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(spot.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-[#F26430] hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
          title={isFavorite ? 'ยกเลิกบันทึก' : 'บันทึกสถานที่นี้'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
            }`}
          />
        </button>

        {/* Bottom Image Info: Rating & Reviews */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white z-10">
          <span className="text-[10px] font-black bg-amber-400/95 backdrop-blur-md text-slate-950 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
            <Star className="w-2.5 h-2.5 fill-slate-950" />
            <span>{spot.rating}</span>
          </span>
        </div>
      </div>

      {/* Card Content Body (Clean, structured and realistic) */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div className="space-y-1.5">
          {/* Top Row: Category Tag (Left) + Price Chip (Right) */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-700 truncate">
              {spot.categoryLabel}
            </span>

            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
              spot.price.includes('ฟรี')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              {spot.price.includes('ฟรี') ? 'เข้าฟรี' : spot.price}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs sm:text-sm lg:text-[13px] xl:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#D95322] transition-colors leading-snug">
            {spot.title}
          </h3>

          {/* Meta Information: Open Hours below title + District & Province */}
          <div className="space-y-1 text-xs text-[#64748B] pt-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span className="truncate font-medium text-slate-700">{spot.openHours}</span>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#D95322] shrink-0" />
              <span className="truncate">{spot.district}, {spot.province}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Bottom-Left: สถานที่เที่ยว & จุดฮีลใจ, Bottom-Right: ดูข้อมูลสถานที่) */}
        <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 mt-auto">
          <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-orange-50 text-[#D95322] border-orange-200/90 flex items-center gap-1 truncate max-w-[170px]">
            <MapPin className="w-3 h-3 text-[#D95322] shrink-0" />
            <span className="truncate">สถานที่เที่ยว & จุดฮีลใจ</span>
          </span>

          <span className="text-[11px] font-extrabold text-[#D95322] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>ดูข้อมูลสถานที่</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
