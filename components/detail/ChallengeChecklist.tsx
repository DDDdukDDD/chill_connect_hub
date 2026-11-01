'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Clock } from 'lucide-react';

interface Item {
  targetType: string;
  id: string;
  title: string;
  image?: string;
  href: string;
  at: string;
  status: 'counted' | 'pending' | 'rejected';
  note?: string;
  momentId?: string;
}

const STYLE = {
  counted: { icon: Check, ring: 'bg-violet-600 text-white', text: 'text-slate-500' },
  pending: { icon: Clock, ring: 'bg-amber-100 text-amber-800', text: 'text-amber-800' },
  rejected: { icon: AlertCircle, ring: 'bg-rose-100 text-rose-700', text: 'text-rose-700' },
};

/**
 * The checklist on a challenge the member joined (the "ระหว่าง" phase of a challenge): what counted, what waits for
 * staff, and what was not counted (with the reason, to send another photo). From GET /api/quests/{id}/checklist.
 */
export function ChallengeChecklist({ questId }: { questId: string }) {
  const [data, setData] = useState<{ items: Item[]; current: number; total: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/quests/${encodeURIComponent(questId)}/checklist`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => active && json?.success && setData(json))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [questId]);

  // Nothing counted or waiting yet: the progress bar above already says 0 of n, and the places say how to count
  if (!data || data.total === 0 || data.items.length === 0) return null;
  const left = Math.max(data.total - data.current, 0);

  return (
    <section className="rounded-3xl bg-[#F5F3FF] p-5 sm:p-6" aria-label="ความคืบหน้าของคุณ">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">ของคุณ {data.current} จาก {data.total}</h2>
        <span className="text-sm font-semibold text-[#6D28D9]">{left === 0 ? 'ครบแล้ว' : `อีก ${left}`}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white" aria-hidden="true">
        <div className="h-2 rounded-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (data.current / data.total) * 100)}%` }} />
      </div>
      <ul className="mt-4 space-y-2.5">
        {data.items.map((item) => {
          const s = STYLE[item.status];
          const Icon = s.icon;
          return (
            <li key={`${item.targetType}-${item.id}`} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.ring}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0 text-sm">
                <Link href={item.href} className="font-semibold text-slate-900 hover:underline">{item.title}</Link>
                <span className={`block text-xs ${s.text}`}>
                  {new Date(item.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} · {item.status === 'rejected' ? `ไม่นับ: ${item.note}` : item.note}
                </span>
              </span>
              {item.status === 'rejected' && (
                <Link href={`/?share=${encodeURIComponent(`${item.targetType}:${item.id}`)}&title=${encodeURIComponent(item.title)}`} className="text-sm font-semibold text-[#2563EB] whitespace-nowrap">
                  ส่งรูปใหม่
                </Link>
              )}
            </li>
          );
        })}
        {Array.from({ length: left }).map((_, i) => (
          <li key={`empty-${i}`} className="flex items-center gap-3 text-sm text-slate-400">
            <span className="w-7 h-7 rounded-full border-2 border-dashed border-violet-200 shrink-0" aria-hidden="true" />
            ยังไม่ได้ไป
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-600">ตี้นับเมื่อคนจัดยืนยันว่ามา · ที่เที่ยวและอีเวนต์นับเมื่อรูปที่ถ่ายตรงนั้นผ่าน · กด &quot;มาที่นี่แล้ว&quot; อย่างเดียวไม่นับ</p>
    </section>
  );
}
