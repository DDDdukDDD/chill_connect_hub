'use client';

import React, { useMemo, useState } from 'react';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { SmartSpotPlanCard, hasSmartPlan } from '@/components/SmartSpotPlanCard';
import { NearbyDiningList, useNearbyDining } from '@/components/NearbyDining';

type Tab = 'trip' | 'food';

/**
 * "แถวนี้มีอะไรต่อ" (owner 2026-11-15): the day plan ("ไปที่นี่แล้ว ไปต่อไหนดี") and the cafés close by answered the
 * same question in two places, so they are one section with two tabs. A tab with nothing in it is left out, and with
 * neither the section is not shown. Cafés lead (owner 2026-11-15), then "แผนเที่ยวแนะนำ", which sends the route as ไปกัน.
 */
export function NearbyNextSection({
  spot,
  pool,
  isLoggedIn,
  onRequireLogin,
  onMessage,
}: {
  spot: LifestyleSpotItem;
  /** Places near this one, picked by the server page (lib/spotBrowse.ts nearbyPool) */
  pool: LifestyleSpotItem[];
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onMessage: (message: string) => void;
}) {
  const hasPlan = useMemo(() => hasSmartPlan(spot, pool), [spot, pool]);
  const dining = useNearbyDining({ spot, pool });
  const tabs = ([dining.nearby.length > 0 && { id: 'food', label: 'ร้านกาแฟและร้านอร่อย' }, hasPlan && { id: 'trip', label: 'แผนเที่ยวแนะนำ' }] as const).filter(
    (t): t is { id: Tab; label: string } => Boolean(t),
  );
  // Cafés first (owner 2026-11-15); the plan is the second tab
  const [picked, setPicked] = useState<Tab>('food');
  if (tabs.length === 0) return null;
  const tab = tabs.some((t) => t.id === picked) ? picked : tabs[0].id;

  return (
    <section aria-labelledby="nearby-next-title" className="space-y-4 pt-5 border-t border-slate-100">
      <h2 id="nearby-next-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        แถวนี้มีอะไรต่อ
      </h2>
      {tabs.length > 1 && (
        // Spots pillar chips (DESIGN_SYSTEM.md: soft tint, pillar border, dark text when on)
        <div role="tablist" aria-label="แถวนี้มีอะไรต่อ" className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`nearby-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="nearby-next-panel"
              onClick={() => setPicked(t.id)}
              className={`h-9 px-4 rounded-full border text-sm font-bold cursor-pointer whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-[#EBF3ED] border-[#4A7C59] text-[#2D5A3C]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div id="nearby-next-panel" role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `nearby-tab-${tab}` : undefined}>
        {tab === 'trip' ? (
          <SmartSpotPlanCard key={spot.id} currentSpot={spot} catalog={pool} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} onMessage={onMessage} />
        ) : (
          <NearbyDiningList {...dining} />
        )}
      </div>
    </section>
  );
}
