'use client';

import React, { useEffect, useState } from 'react';

/** Fired by the create dialog after a place or a challenge idea is sent, so open lists reload */
export const SUBMISSION_SENT_EVENT = 'chill:submission-sent';

interface Row {
  id: string;
  kind: string;
  title: string;
  status: string;
  waiting: boolean;
}

/**
 * My Hub: the places and challenge ideas the member sent to staff, with where each one stands.
 * Renders nothing when there are none.
 */
export function MySubmissions() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const read = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
      const [spots, quests] = await Promise.all([read('/api/spots?mine=1'), read('/api/quests?mine=1')]);
      if (cancelled) return;
      setRows([
        ...((spots?.spots ?? []) as Array<{ id: string; title: string; publicationStatus?: string; reviewRejectedAt?: string }>).map((spot) => ({
          id: spot.id,
          kind: 'สถานที่',
          title: spot.title,
          status: spot.reviewRejectedAt ? 'ไม่ผ่านการตรวจ' : spot.publicationStatus === 'draft' ? 'รอทีมงานตรวจ' : 'เผยแพร่แล้ว',
          waiting: spot.reviewRejectedAt !== undefined || spot.publicationStatus === 'draft',
        })),
        ...((quests?.quests ?? []) as Array<{ id: string; title: string; status?: string }>).map((quest) => ({
          id: quest.id,
          kind: 'ชาเลนจ์',
          title: quest.title,
          status: quest.status === 'draft' ? 'รอทีมงานตรวจ' : quest.status === 'ended' ? 'จบแล้ว' : 'เผยแพร่แล้ว',
          waiting: quest.status === 'draft',
        })),
      ]);
    };
    void load();
    window.addEventListener(SUBMISSION_SENT_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(SUBMISSION_SENT_EVENT, load);
    };
  }, []);

  if (rows.length === 0) return null;
  return (
    <section aria-label="สิ่งที่คุณส่งให้ทีมงาน" className="mt-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
      <h2 className="text-sm sm:text-base font-extrabold text-slate-900">สิ่งที่คุณส่งให้ทีมงาน</h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{row.title}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{row.kind}</p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${row.waiting ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
