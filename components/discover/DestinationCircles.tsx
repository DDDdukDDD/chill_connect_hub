'use client';

import React from 'react';
import { TOP_DESTINATIONS } from '@/data/topDestinations';
import { optimizedImage } from '@/lib/optimizedImage';

/** The name people say ("เขาใหญ่", "หัวหิน"), not the province's full name */
const shortName = (nameTh: string, provinceKey: string) => (nameTh.includes('•') ? nameTh.split('•')[0].trim() : provinceKey);

/**
 * Popular places as round photos under the /spots heading: people choose where before what. A tap narrows the list
 * to that province (a green ring marks it); a second tap clears it. Scrolls sideways.
 */
export function DestinationCircles({ selected, onSelect }: { selected: string; onSelect: (province: string | null) => void }) {
  return (
    <div role="group" aria-label="ที่เที่ยวยอดนิยม" className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
      {TOP_DESTINATIONS.map((dest) => {
        const isPicked = selected === dest.provinceKey;
        const name = shortName(dest.nameTh, dest.provinceKey);
        return (
          <button
            key={dest.id}
            type="button"
            onClick={() => onSelect(isPicked ? null : dest.provinceKey)}
            aria-pressed={isPicked}
            title={dest.tagline}
            className="group shrink-0 w-[68px] sm:w-[76px] flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <span
              className={`block w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[3px] transition-all ${
                isPicked ? 'ring-2 ring-[#4A7C59]' : 'ring-1 ring-slate-200 group-hover:ring-slate-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizedImage(dest.imageUrl, 128)}
                alt=""
                loading="lazy"
                className="w-full h-full rounded-full object-cover bg-slate-100 transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className={`text-xs leading-tight text-center line-clamp-1 ${isPicked ? 'font-bold text-[#2D5A3C]' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
