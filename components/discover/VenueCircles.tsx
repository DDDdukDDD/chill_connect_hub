'use client';

import React from 'react';
import { TOP_VENUES } from '@/data/topVenues';

/**
 * Popular venues as round photos under the /events heading: the tabs below say what kind of event, these say where.
 * A tap narrows the list to that venue (a blue ring marks it); a second tap clears it. Scrolls sideways.
 */
export function VenueCircles({ selected, onSelect }: { selected: string; onSelect: (venue: string | null) => void }) {
  return (
    <div role="group" aria-label="ศูนย์การประชุมและแลนด์มาร์กยอดนิยม" className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
      {TOP_VENUES.map((venue) => {
        const isPicked = selected === venue.venueKey;
        return (
          <button
            key={venue.id}
            type="button"
            onClick={() => onSelect(isPicked ? null : venue.venueKey)}
            aria-pressed={isPicked}
            title={venue.subtitle}
            className="group shrink-0 w-[76px] sm:w-[84px] flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <span
              className={`block w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[3px] transition-all ${
                isPicked ? 'ring-2 ring-[#2B527A]' : 'ring-1 ring-slate-200 group-hover:ring-slate-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.imageUrl}
                alt=""
                loading="lazy"
                className="w-full h-full rounded-full object-cover bg-slate-100 transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className={`text-xs leading-tight text-center line-clamp-2 ${isPicked ? 'font-bold text-[#1F3D5C]' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
              {venue.nameTh}
            </span>
          </button>
        );
      })}
    </div>
  );
}
