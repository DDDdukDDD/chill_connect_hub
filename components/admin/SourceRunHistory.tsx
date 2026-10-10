'use client';

import React from 'react';
import type { EventDataSource, SourceRun } from '@/lib/sourcesStore';

const STATUS_META: Record<SourceRun['status'], { label: string; className: string }> = {
  success: { label: 'สำเร็จ', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial: { label: 'บางส่วน', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  failed: { label: 'ล้มเหลว', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

/** Recent runs of one source; sources scanned before run history existed show their last run only. */
export function SourceRunHistory({ source }: { source: EventDataSource }) {
  const runs: SourceRun[] = source.runHistory?.length
    ? source.runHistory
    : source.lastRunAt && source.lastRunStatus
      ? [{
        at: source.lastRunAt,
        status: source.lastRunStatus,
        scanned: source.lastRunScanned ?? 0,
        imported: source.lastRunImported ?? 0,
        duplicates: source.lastRunDuplicates ?? 0,
        errors: source.lastRunErrors ?? [],
      }]
      : [];

  if (runs.length === 0) {
    return <p className="text-xs text-slate-500">ยังไม่เคยดึงข้อมูลจากแหล่งนี้</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[11px] font-semibold text-slate-500">
            <th className="py-1.5 pr-3 whitespace-nowrap">เวลา</th>
            <th className="py-1.5 pr-3">ผล</th>
            {source.targetType === 'spots' && <th className="py-1.5 pr-3">จังหวัด</th>}
            <th className="py-1.5 pr-3 text-right">พบ</th>
            <th className="py-1.5 pr-3 text-right">นำเข้า</th>
            <th className="py-1.5 pr-3 text-right">ซ้ำ</th>
            <th className="py-1.5">ข้อผิดพลาด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.map((run) => (
            <tr key={run.at} className="align-top">
              <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums text-slate-600">{new Date(run.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td className="py-1.5 pr-3">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${STATUS_META[run.status].className}`}>{STATUS_META[run.status].label}</span>
              </td>
              {source.targetType === 'spots' && <td className="py-1.5 pr-3 whitespace-nowrap text-slate-700">{run.context ?? '–'}</td>}
              <td className="py-1.5 pr-3 text-right tabular-nums">{run.scanned}</td>
              <td className="py-1.5 pr-3 text-right font-bold tabular-nums text-slate-900">{run.imported}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums text-slate-500">{run.duplicates}</td>
              <td className="py-1.5 text-rose-700 break-words">{run.errors.length ? run.errors.join(' · ') : <span className="text-slate-400">–</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
