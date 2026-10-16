'use client';

import React from 'react';
import Link from 'next/link';
import type { HolidayPlan, PlanPillar } from '@/lib/holidayPlans';

interface JourneyHolidayPlansProps {
  plans: HolidayPlan[];
  subtitle: string;
  isLoading?: boolean;
}

const PILLARS: Record<PlanPillar, { color: string; label: string }> = {
  spots: { color: '#4A7C59', label: 'ที่เที่ยว' },
  community: { color: '#F26430', label: 'กิจกรรม' },
  fairs: { color: '#2B527A', label: 'งานแฟร์' },
};

const PLAN_SLOT = 'w-[85%] sm:w-[calc((100%-16px)/2)] lg:w-auto shrink-0 snap-start';

/** Ready-made day plans: a place plus what is on in the same province on the same day */
export const JourneyHolidayPlans: React.FC<JourneyHolidayPlansProps> = ({ plans, subtitle, isLoading = false }) => {
  if (!isLoading && plans.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="holiday-plans-heading">
      <div>
        <h2 id="holiday-plans-heading" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          แผนวันหยุดพร้อมไป
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={PLAN_SLOT}>
                <div className="h-64 rounded-2xl bg-slate-100" />
              </div>
            ))
          : plans.map((plan) => (
              <article key={plan.id} className={`${PLAN_SLOT} rounded-2xl border border-slate-200 bg-white p-4 sm:p-5`}>
                <h3 className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-bold text-slate-900 tabular-nums">{plan.dateLabel}</span>
                  <span className="text-xs font-medium text-slate-500 truncate">{plan.province}</span>
                </h3>

                <ol className="mt-3 space-y-1">
                  {plan.stops.map((stop, index) => (
                    <li key={stop.id}>
                      <Link
                        href={stop.href}
                        className="group flex items-center gap-3 rounded-xl p-1.5 -mx-1.5 hover:bg-slate-50 transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        <span className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                          {stop.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- remote content images
                            <img src={stop.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tabular-nums">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PILLARS[stop.pillar].color }} aria-hidden="true" />
                            {index + 1} · {PILLARS[stop.pillar].label}
                          </span>
                          <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:underline">{stop.title}</span>
                          {stop.meta && <span className="text-xs font-medium text-slate-500 line-clamp-1 tabular-nums">{stop.meta}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
      </div>
    </section>
  );
};
