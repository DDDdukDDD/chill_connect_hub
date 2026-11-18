'use client';

import { useEffect, useState } from 'react';
import { CircleDot } from 'lucide-react';
import type { CircleEvent, CircleKind, CircleStatRow } from '@/lib/social/circleStats';

/**
 * Do Circles work (BE-420, owner 2026-11-18): per kind of Circle, how many people opened it and what they did there.
 * People per day, so one member tapping ten times counts once; the share of opens says which kinds earn their place.
 */
const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const KIND_LABEL: Record<CircleKind, string> = {
  finish: 'ทำครบ',
  step: 'ทำไปบางขั้น (จากโพสต์)',
  doing: 'ทำอยู่ (ของเรา)',
  challenge: 'เพื่อนหลายคนชาเลนจ์เดียวกัน',
  group: 'กลุ่มจากตี้',
};
const ACTS: [CircleEvent, string][] = [
  ['cheer', 'ชื่นชม'],
  ['try', 'ลองทำบ้าง'],
  ['together', 'ทำด้วยกัน'],
  ['invite', 'ชวน'],
  ['view_post', 'ดูโพสต์'],
];

export function CirclesStatsPanel() {
  const [days, setDays] = useState<Range>(14);
  const [rows, setRows] = useState<CircleStatRow[] | null | 'error'>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/admin/circles?days=${days}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => live && setRows(json?.success ? (json.rows as CircleStatRow[]) : 'error'))
      .catch(() => live && setRows('error'));
    return () => {
      live = false;
    };
  }, [days]);

  const pick = (d: Range) => {
    if (d === days) return;
    setRows(null);
    setDays(d);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="circles-stats-title">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <CircleDot size={16} className="text-slate-500" aria-hidden="true" />
        <h2 id="circles-stats-title" className="text-sm font-bold text-slate-900">Circles ได้ผลไหม</h2>
        <div className="ml-auto flex gap-1" role="group" aria-label="ช่วงเวลา">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pick(d)}
              aria-pressed={days === d}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>
      {rows === null ? (
        <p className="px-4 py-6 text-sm text-slate-500" role="status">กำลังโหลด…</p>
      ) : rows === 'error' ? (
        <p className="px-4 py-6 text-sm text-slate-500">โหลดตัวเลขไม่ได้ตอนนี้</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">ยังไม่มีใครเปิด Circle ในช่วงนี้</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 text-left font-semibold">Circle</th>
                <th className="px-3 py-2 text-right font-semibold">เปิดดู</th>
                {ACTS.map(([id, label]) => (
                  <th key={id} className="px-3 py-2 text-right font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const opens = row.events.open ?? 0;
                return (
                  <tr key={row.kind} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-800">{KIND_LABEL[row.kind]}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">{opens.toLocaleString()}</td>
                    {ACTS.map(([id]) => {
                      const n = row.events[id] ?? 0;
                      return (
                        <td key={id} className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {n ? n.toLocaleString() : '–'}
                          {n > 0 && opens > 0 && <span className="ml-1 text-xs text-slate-500">{Math.round((n / opens) * 100)}%</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2.5 text-xs text-slate-500">นับเป็นคนต่อวัน คนเดียวกดหลายครั้งในวันเดียวนับหนึ่ง เปอร์เซ็นต์คือเทียบกับคนที่เปิดดู</p>
        </div>
      )}
    </section>
  );
}
