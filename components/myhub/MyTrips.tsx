'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Route } from 'lucide-react';
import { optimizedImage } from '@/lib/optimizedImage';
import { daysBetween, localNow, thaiDateRange } from '@/lib/trips/story';
import { SuggestedTripCard } from '@/components/trips/SuggestedTripCard';
import type { TripSummary } from '@/lib/trips/service';

const SHOWN = 3;

/** What the trip is to the member today: going on, coming up, a draft, or told */
function stateOf(trip: TripSummary, today: string): { rank: number; line: string } {
  if (today >= trip.startsOn && today <= trip.endsOn) return { rank: 0, line: `กำลังเที่ยว · วันที่ ${daysBetween(trip.startsOn, today) + 1} จาก ${daysBetween(trip.startsOn, trip.endsOn) + 1}` };
  if (today < trip.startsOn) {
    const days = daysBetween(today, trip.startsOn);
    return { rank: 1, line: days === 1 ? 'ไปพรุ่งนี้' : `อีก ${days} วัน · ${thaiDateRange(trip.startsOn, trip.endsOn)}` };
  }
  if (trip.status !== 'published') return { rank: 2, line: `ร่างไว้ · ${trip.itemCount} รูป ยังไม่เผยแพร่` };
  return { rank: 3, line: `เผยแพร่แล้ว · ${trip.cities.join(' → ') || thaiDateRange(trip.startsOn, trip.endsOn)}` };
}

/**
 * My Hub "ทริปของฉัน" (owner 2026-11-26: trips start here, the profile shows the told ones): the trip going on or
 * coming up first, then drafts, and the way to start a new one.
 */
export function MyTrips() {
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/trips?mine=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { trips?: TripSummary[] }) => {
        if (live) setTrips(json.trips ?? []);
      })
      .catch(() => live && setTrips([]));
    return () => {
      live = false;
    };
  }, []);
  if (trips === null) return null;

  const today = localNow().slice(0, 10);
  const list = trips
    .map((trip) => ({ trip, ...stateOf(trip, today) }))
    .sort((a, b) => a.rank - b.rank || (a.rank === 1 ? a.trip.startsOn.localeCompare(b.trip.startsOn) : b.trip.startsOn.localeCompare(a.trip.startsOn)))
    .slice(0, SHOWN);

  return (
    <section aria-label="ทริปของฉัน" className="mt-5 border-t border-slate-200/70 pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">ทริปของฉัน</h2>
        <Link href="/trips/new" className="-my-2 inline-flex items-center gap-1 whitespace-nowrap py-2 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
          <Plus className="size-3.5" aria-hidden /> เล่าทริปใหม่
        </Link>
      </div>
      <SuggestedTripCard className="mt-3" />
      {list.length === 0 ? (
        <Link href="/trips/new" className="group mt-3 flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Route className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 group-hover:underline">ทริปใหญ่หรือแค่เสาร์อาทิตย์ ก็เล่าเป็นเรื่องได้</span>
            <span className="block text-xs text-slate-500">ไปกินเดินเล่น 3 ที่ก็พอ สร้างไว้ก่อนไป หรือเลือกรูปทีหลังก็ได้</span>
          </span>
        </Link>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100">
          {list.map(({ trip, line }) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}${trip.status === 'published' ? '' : '/edit'}`} className="group flex items-center gap-3 py-2.5">
                {trip.cover ? (
                  <img src={optimizedImage(trip.cover, 128)} alt="" className="size-12 shrink-0 rounded-xl bg-slate-100 object-cover" />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Route className="size-5" aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 block text-sm font-semibold text-slate-900 group-hover:underline">{trip.title}</span>
                  <span className="block truncate text-xs text-slate-500">{line}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
