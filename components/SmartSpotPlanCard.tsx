'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { buildPlan, clockText, planCandidates, planMapsUrl, replacementFor, type PlanStop } from '@/lib/spotDayPlan';

interface SmartSpotPlanCardProps {
  currentSpot: LifestyleSpotItem;
  /** Places near this one to plan with, picked by the server page (lib/spotBrowse.ts nearbyPool) */
  catalog: LifestyleSpotItem[];
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onMessage: (message: string) => void;
}

/** Whether there is a plan to show here: something worth pairing within reach (the same pick the card makes) */
export function hasSmartPlan(currentSpot: LifestyleSpotItem, catalog: LifestyleSpotItem[]): boolean {
  return buildPlan(currentSpot, planCandidates(currentSpot, catalog), null, new Set()).length >= 2;
}

const cleanText = (str?: string): string =>
  (str || '').replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s+/g, ' ').trim();

const travelText = (travel: NonNullable<PlanStop['travel']>) =>
  travel.walk ? `เดินราว ${travel.minutes} นาที` : `ขับรถราว ${travel.minutes} นาที · ${travel.km.toFixed(1)} กม.`;

/**
 * Smart Plan, "ไปที่นี่แล้วไปต่อไหนดี" (owner 2026-10-25): the place first, then one or two places of another kind
 * near by in route order, with times from their opening hours. Each added stop can be swapped; the plan leads to
 * going with friends as ไปกัน (owner 2026-11-15: friends, not a ตี้ for strangers; the route opens the plan's chat)
 * or to the route on Google Maps. It sits in "แถวนี้มีอะไรต่อ" (NearbyNextSection), which carries the heading.
 */
export const SmartSpotPlanCard: React.FC<SmartSpotPlanCardProps> = ({ currentSpot, catalog, isLoggedIn, onRequireLogin, onMessage }) => {
  const [isInviting, setIsInviting] = useState(false);
  const candidates = useMemo(() => planCandidates(currentSpot, catalog), [currentSpot, catalog]);
  // null = the automatic pick; a swap pins the places shown
  const [chosen, setChosen] = useState<LifestyleSpotItem[] | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());

  const stops = useMemo(() => buildPlan(currentSpot, candidates, chosen, skipped), [currentSpot, candidates, chosen, skipped]);
  const others = stops.slice(1).map((s) => s.spot);
  const swapFor = useMemo(
    () => others.map((_, index) => replacementFor(currentSpot, candidates, others, index, skipped)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSpot, candidates, stops, skipped],
  );

  // Nothing worth pairing within reach: no plan rather than a plan of one
  if (stops.length < 2) return null;

  const swap = (index: number) => {
    const next = swapFor[index];
    if (!next) return;
    setSkipped((prev) => new Set(prev).add(others[index].id));
    setChosen(others.map((s, i) => (i === index ? next : s)));
  };


  const area = cleanText(currentSpot.district || currentSpot.province);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        แผนเที่ยว{area ? `รอบ${area}` : ''} {stops.length} ที่ คนละแนว เรียงตามทาง
      </p>

      <ol className="space-y-0">
        {stops.map((stop, index) => {
          const isHere = index === 0;
          const title = cleanText(stop.spot.title);
          return (
            <li key={stop.spot.id}>
              {stop.travel && (
                <div className="flex items-center gap-3 py-2 pl-[22px]">
                  <span className="h-6 border-l-2 border-dashed border-slate-300" aria-hidden="true" />
                  <span className="text-xs font-medium text-slate-500">{travelText(stop.travel)}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-12 shrink-0 pt-0.5 text-center">
                  <div className="text-sm font-bold text-[#2D5A3C] tabular-nums">{clockText(stop.arrive)}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">ถึง {clockText(stop.leave)}</div>
                </div>
                <img
                  src={resolveSpotImage(stop.spot)}
                  alt={title}
                  loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  {isHere ? (
                    <div className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{title}</div>
                  ) : (
                    <Link href={`/spots/${stop.spot.id}`} className="text-sm font-bold text-slate-900 hover:text-[#2563EB] leading-snug line-clamp-2">
                      {title}
                    </Link>
                  )}
                  <div className="text-xs text-slate-500 truncate">
                    {isHere ? 'ที่นี่ · ' : ''}
                    {cleanText(stop.spot.categoryLabel)}
                  </div>
                  {!isHere && swapFor[index - 1] && (
                    <button
                      type="button"
                      onClick={() => swap(index - 1)}
                      className="inline-flex items-center min-h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      เปลี่ยนจุดนี้
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (isLoggedIn ? setIsInviting(true) : onRequireLogin())}
          className="flex-1 min-h-11 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer whitespace-nowrap"
        >
          ชวนเพื่อนไปกัน
        </button>
        <a
          href={planMapsUrl(stops)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-11 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold inline-flex items-center justify-center whitespace-nowrap"
        >
          เปิดเส้นทาง
        </a>
      </div>
      <p className="text-xs text-slate-500">เวลาเป็นค่าประมาณจากเวลาเปิดที่มีในระบบ เช็กอีกทีก่อนออกเดินทางนะ</p>
      {isInviting && (
        <InviteSheet
          target={{ type: 'spot', id: currentSpot.id, route: stops.map((stop) => ({ id: stop.spot.id, time: clockText(stop.arrive) })) }}
          place={cleanText(currentSpot.title)}
          onClose={() => setIsInviting(false)}
          onDone={(message) => {
            setIsInviting(false);
            onMessage(message);
          }}
        />
      )}
    </div>
  );
};
