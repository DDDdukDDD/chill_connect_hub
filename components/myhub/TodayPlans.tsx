'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { PlanStatus } from '@/lib/social/questPlan';
import { optimizedImage } from '@/lib/optimizedImage';

/**
 * "วันนี้ตามแผน" at the top of My Hub's schedule (owner 2026-11-07): each challenge done by plan the member joined,
 * with today's task and one button to stamp it. Nothing shows when they have none.
 */

type TodayPlan = { questId: string; title: string; image: string | null; status: PlanStatus };

export function TodayPlans({ onToast }: { onToast: (message: string) => void }) {
  const [plans, setPlans] = useState<TodayPlan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const json = await fetch('/api/quests/plans', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (json?.success) setPlans(json.plans ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const stamp = async (questId: string) => {
    setBusy(questId);
    const res = await fetch(`/api/quests/${encodeURIComponent(questId)}/stamps`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: 'today' }) });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!json.success) return onToast(json.message || 'stamp ไม่สำเร็จ ลองอีกครั้งนะ');
    onToast(json.finished ? 'ครบแผนแล้ว ทำสำเร็จ!' : 'stamp แล้ว เก่งมาก');
    void load();
  };

  if (!plans.length) return null;
  return (
    <section aria-label="วันนี้ตามแผน" className="border-t border-slate-200/70 pt-5 lg:border-t-0 lg:pt-0 mb-5">
      <h2 className="text-base font-bold text-slate-900">วันนี้ตามแผน</h2>
      <ul className="mt-3 space-y-2.5">
        {plans.map(({ questId, title, image, status }) => {
          const canStamp = !status.todayStamped && !status.todayProblem;
          return (
            <li key={questId} className="flex items-center gap-3">
              <Link href={`/challenges/${encodeURIComponent(questId)}#plan`} className="flex flex-1 min-w-0 items-center gap-3 group">
                <span className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-[#F5F3FF]">
                  {image && <img src={optimizedImage(image, 96)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 truncate group-hover:underline">{status.todayStamped ? `stamp แล้ว · ${status.todayTask ?? ''}` : status.todayTask ?? status.todayProblem ?? 'วันพัก'}</span>
                  <span className="block text-xs font-medium text-slate-500 truncate tabular-nums">{title} · {status.done}/{status.needed}</span>
                </span>
              </Link>
              {status.todayStamped ? (
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#7C3AED] text-white flex items-center justify-center" aria-label="stamp วันนี้แล้ว">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </span>
              ) : canStamp ? (
                <button type="button" onClick={() => void stamp(questId)} disabled={busy === questId} className="h-9 px-3.5 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-sm font-bold whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  {busy === questId ? 'กำลังบันทึก…' : 'stamp'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
