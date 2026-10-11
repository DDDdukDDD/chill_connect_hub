'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ShieldCheck, Users } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { formatThaiDateBE } from '@/lib/dateUtils';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { isTripConfirmed, SPOT_TRIP_MIN_PEOPLE } from '@/lib/spotTripRules';
import { SpotBuddyGatheringModal } from '@/components/SpotBuddyGatheringModal';

interface SpotBuddyTripsProps {
  spot: LifestyleSpotItem;
  isLoggedIn: boolean;
  /** Opens the "members only" dialog of the page */
  onRequireLogin: () => void;
  onShowToast: (message: string) => void;
}

interface TripsAnswer {
  meetupAllowed: boolean;
  trips: EventItem[];
  host?: { canHost: boolean; reason?: string };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Spot Buddy on a place page: trips people can join here and the button to open one.
 * Renders nothing unless staff opened the place for meet-ups (GET /api/spots/{id}/trips).
 */
export function SpotBuddyTrips({ spot, isLoggedIn, onRequireLogin, onShowToast }: SpotBuddyTripsProps) {
  const [answer, setAnswer] = useState<TripsAnswer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/trips`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      setAnswer(res.ok && data?.success ? data : null);
    } catch {
      setAnswer(null);
    }
  }, [spot.id]);

  // isLoggedIn is a dependency: whether the viewer may open a trip is part of the answer
  useEffect(() => {
    load();
  }, [load, isLoggedIn]);

  if (!answer?.meetupAllowed) return null;

  const blockedReason = isLoggedIn && answer.host && !answer.host.canHost ? answer.host.reason : undefined;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">ชวนเพื่อนไปที่นี่</h3>
        <p className="text-xs text-slate-600">
          {answer.trips.length > 0 ? `มี ${answer.trips.length} ทริปเปิดรับอยู่` : 'ยังไม่มีทริปเปิดรับ เปิดทริปแรกได้เลย'}
        </p>
      </div>

      {answer.trips.length > 0 && (
        <ul className="space-y-2">
          {answer.trips.map((trip) => {
            const confirmed = isTripConfirmed(trip);
            return (
              <li key={trip.id}>
                <Link
                  href={`/community/${encodeURIComponent(trip.id)}`}
                  className="block p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">{trip.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ISO_DAY.test(trip.date) ? formatThaiDateBE(trip.date) : trip.date} · {trip.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {trip.participantsCount}/{trip.maxParticipants} คน
                    </span>
                  </div>
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      confirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {confirmed ? 'ทริปยืนยันแล้ว' : `รอครบ ${trip.minParticipants ?? SPOT_TRIP_MIN_PEOPLE} คน ทริปจึงยืนยัน`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={Boolean(blockedReason)}
        onClick={() => (isLoggedIn ? setIsModalOpen(true) : onRequireLogin())}
        className={`w-full py-2.5 px-4 rounded-full text-sm font-extrabold whitespace-nowrap transition-colors ${
          blockedReason ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm cursor-pointer'
        }`}
      >
        ชวนเพื่อนไปที่นี่
      </button>
      {blockedReason && <p className="text-xs text-slate-600">{blockedReason}</p>}

      <p className="flex items-start gap-1.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>นัดเจอกันที่สถานที่ เฉพาะกลางวัน กลุ่ม {SPOT_TRIP_MIN_PEOPLE} คนขึ้นไป ต่างคนต่างเดินทาง และทีมงานตรวจทุกทริปก่อนเผยแพร่</span>
      </p>

      <SpotBuddyGatheringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        spotTitle={spot.title}
        spotLocation={`${spot.district}, ${spot.province}`}
        spotImage={resolveSpotImage(spot)}
        spotId={spot.id}
        spotProvince={spot.province}
        spotDistrict={spot.district}
        mode="spot"
        onSuccess={(trip) => {
          onShowToast(`ส่งทริป "${trip.title}" แล้ว จะขึ้นที่หน้านี้เมื่อพร้อมเผยแพร่`);
          load();
        }}
      />
    </div>
  );
}
