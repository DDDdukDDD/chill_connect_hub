'use client';

import { useEffect, useState } from 'react';
import { TripCard } from '@/components/trips/TripList';
import type { TripSummary } from '@/lib/trips/service';

/**
 * Newest trip stories in the member feed (docs/TRIPS_PLAN.md): a sideways row of story cards. Draws nothing until
 * there is a published trip the member may see.
 */
export function TripsShelf() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  useEffect(() => {
    let live = true;
    fetch('/api/trips', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { trips?: TripSummary[] }) => {
        if (live) setTrips(json.trips ?? []);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!trips.length) return null;
  return (
    <section className="border-b border-slate-200 py-5">
      <h2 className="px-4 text-base font-bold text-slate-900 sm:px-0">เรื่องเล่าทริปจากเพื่อนๆ</h2>
      <p className="mt-0.5 px-4 text-xs text-slate-500 sm:px-0">แตะเพื่อดูเรื่องเต็มจอ</p>
      <ul className="mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-0">
        {trips.map((trip) => (
          <li key={trip.id} className="w-[42%] shrink-0 snap-start sm:w-48">
            <TripCard trip={trip} />
          </li>
        ))}
      </ul>
    </section>
  );
}
