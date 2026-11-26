'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import Link from 'next/link';
import { optimizedImage } from '@/lib/optimizedImage';
import { thaiDateRange, tripTag } from '@/lib/trips/story';
import type { TripSummary } from '@/lib/trips/service';

/** One trip as an editorial photo card: the cover, the tag, the title and the cities on the photo */
export function TripCard({ trip, own }: { trip: TripSummary; own?: boolean }) {
  const draft = trip.status !== 'published';
  return (
    <Link href={own && draft ? `/trips/${trip.id}/edit` : `/trips/${trip.id}`} className="group block">
      <span className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-slate-100">
        {trip.cover && <img src={optimizedImage(trip.cover, 480)} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-900 backdrop-blur">
          <span className={`size-1.5 rounded-full ${draft ? 'bg-amber-500' : 'bg-[#E11D48]'}`} aria-hidden />
          {draft ? 'ร่าง' : tripTag(trip)}
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-16 text-white">
          <span className="line-clamp-2 block text-sm font-bold leading-snug sm:text-base">{trip.title}</span>
          <span className="mt-1 block truncate text-xs text-white/80">{trip.cities.length ? trip.cities.join(' → ') : thaiDateRange(trip.startsOn, trip.endsOn)}</span>
        </span>
      </span>
    </Link>
  );
}

/** The "ทริป" tab of a profile: told trips only (new ones start in My Hub) */
export function ProfileTrips({ trips }: { trips: TripSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}
