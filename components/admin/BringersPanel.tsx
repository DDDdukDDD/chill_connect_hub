'use client';

import React, { useEffect, useState } from 'react';
import { Footprints } from 'lucide-react';
import type { Bringer } from '@/lib/social/actionLog';

/**
 * "ใครพาเพื่อนออกไปได้มากที่สุด" (docs/TRACEABILITY.md, owner 2026-11-13): different people who joined, saved, went or
 * said "ไปกัน" after a member's post, profile or invitation. Used to find creators; counting began on 2026-11-13.
 */
const RANGES = [7, 30, 90] as const;

export function BringersPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [rows, setRows] = useState<Bringer[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/admin/bringers?days=${days}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => alive && (json?.success ? setRows(json.bringers) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [days]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="bringers-title">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Footprints size={16} className="text-slate-500" aria-hidden="true" />
        <h2 id="bringers-title" className="text-sm font-bold text-slate-900">ใครพาเพื่อนออกไปได้มากที่สุด</h2>
        <div className="ml-auto flex gap-1" role="group" aria-label="ช่วงเวลา">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                if (d === days) return;
                setRows(null);
                setDays(d);
              }}
              aria-pressed={days === d}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>
      {failed ? (
        <p className="px-4 py-6 text-sm text-slate-500">โหลดไม่สำเร็จ</p>
      ) : !rows ? (
        <div className="px-4 py-6 h-24 animate-pulse bg-slate-50" />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">ยังไม่มีใครพาเพื่อนออกไปในช่วงนี้ (เริ่มนับ 13 พ.ย. 2569)</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-semibold">สมาชิก</th>
                <th className="px-3 py-2 font-semibold text-right">พาไป (คน)</th>
                <th className="px-3 py-2 font-semibold text-right">ไปถึงจริง</th>
                <th className="px-3 py-2 font-semibold text-right">เข้าร่วม</th>
                <th className="px-3 py-2 font-semibold text-right">ตอบรับคำชวน</th>
                <th className="px-3 py-2 font-semibold text-right">บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.memberId} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <a href={`/profile?id=${encodeURIComponent(r.memberId)}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:underline">
                      {r.name || r.memberId}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{r.people}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.visits}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.joins}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.inviteYes}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.saves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
