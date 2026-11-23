'use client';

import React from 'react';
import { Plus, Lightbulb } from 'lucide-react';
import { TEE_IDEAS, type TeeIdea } from '@/data/teeIdeas';
import { meetupCategoryIcon } from '@/components/icons/CategoryIcons';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';

/**
 * "ไอเดียตี้" on /community (owner 2026-11-24): instead of sample ตี้ with made-up people, a row of ideas that say
 * plainly they are ideas. Tapping one opens the create dialog filled in from it (data/teeIdeas.ts); the member picks
 * the day and the place. Open layout, one row that scrolls sideways at every width.
 */
export function TeeIdeaRail({ onPick }: { onPick: (idea: TeeIdea) => void }) {
  return (
    <section aria-labelledby="tee-ideas-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tee-ideas-title" className="text-lg font-bold text-slate-900">ไม่รู้จะตั้งตี้อะไร เริ่มจากไอเดียนี้ได้เลย</h2>
      </div>
      <p className="mt-0.5 text-sm text-slate-600">กดไอเดียที่ชอบ ฟอร์มจะกรอกไว้ให้ เหลือเลือกวันกับที่นัด</p>
      <ul className="mt-3 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {TEE_IDEAS.map((idea) => {
          const category = COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === idea.category);
          const Icon = meetupCategoryIcon(idea.category) ?? category?.icon ?? Lightbulb;
          return (
            <li key={idea.id} className="snap-start shrink-0 w-[200px] sm:w-[220px]">
              <button
                type="button"
                onClick={() => onPick(idea)}
                className="group w-full h-full text-left rounded-2xl bg-[#FFF4EE] hover:bg-[#FFE9DC] p-4 flex flex-col gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${category?.colorScheme.iconBg ?? 'bg-white'}`}>
                  <Icon className={`h-5 w-5 ${category?.colorScheme.iconColor ?? 'text-[#C2410C]'}`} aria-hidden="true" />
                </span>
                <span className="text-[15px] font-semibold leading-snug text-slate-900">{idea.title}</span>
                <span className="text-[13px] text-slate-600">{idea.hint}</span>
                <span className="mt-auto pt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-slate-900 group-hover:underline">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                  ใช้ไอเดียนี้
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
