'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Grid3x3, Map as MapIcon, RefreshCw, Search } from 'lucide-react';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { SpotsMapPanel } from './SpotsMapPanel';

interface CoverageRow {
  province: string;
  total: number;
  drafts: number;
  vibes: Record<string, number>;
}

interface CoverageData {
  vibes: Array<{ id: string; label: string }>;
  provinces: CoverageRow[];
  totals: { published: number; drafts: number; vibes: Record<string, number>; emptyCells: number };
}

type SortKey = 'name' | 'fewest' | 'most' | 'gaps';

// Sequential blue (dataviz reference ramp), binned; 0 is neutral gray so gaps stand out from "a few"
const BINS: Array<{ min: number; max: number; label: string; fill: string; ink: string }> = [
  { min: 0, max: 0, label: '0', fill: '#f0efec', ink: '#94a3b8' },
  { min: 1, max: 2, label: '1–2', fill: '#cde2fb', ink: '#0f172a' },
  { min: 3, max: 5, label: '3–5', fill: '#9ec5f4', ink: '#0f172a' },
  { min: 6, max: 10, label: '6–10', fill: '#6da7ec', ink: '#0f172a' },
  { min: 11, max: 20, label: '11–20', fill: '#3987e5', ink: '#ffffff' },
  { min: 21, max: Infinity, label: '21+', fill: '#1c5cab', ink: '#ffffff' },
];
const binOf = (count: number) => BINS.find((bin) => count >= bin.min && count <= bin.max) ?? BINS[0];

interface CoverageViewProps {
  onOpenSpots: (filters: { province?: string; vibe?: string }) => void;
  onScanProvince: (province: string) => void;
}

export function CoverageView({ onOpenSpots, onScanProvince }: CoverageViewProps) {
  const [tab, setTab] = useState<'matrix' | 'map'>('matrix');
  const [data, setData] = useState<CoverageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('fewest');
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/coverage', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || 'โหลดข้อมูลความครอบคลุมไม่สำเร็จ');
        if (active) { setData(json); setError(null); }
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลไม่สำเร็จ'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  const rows = useMemo(() => {
    if (!data) return [];
    const gaps = (row: CoverageRow) => data.vibes.filter((vibe) => row.vibes[vibe.id] === 0).length;
    const filtered = data.provinces.filter((row) => !query.trim() || row.province.includes(query.trim()));
    const sorted = [...filtered];
    if (sort === 'name') sorted.sort((a, b) => a.province.localeCompare(b.province, 'th'));
    if (sort === 'fewest') sorted.sort((a, b) => a.total - b.total);
    if (sort === 'most') sorted.sort((a, b) => b.total - a.total);
    if (sort === 'gaps') sorted.sort((a, b) => gaps(b) - gaps(a) || a.total - b.total);
    return sorted;
  }, [data, query, sort]);

  const showTip = (event: React.MouseEvent | React.FocusEvent, text: string) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ x: rect.left + rect.width / 2, y: rect.top, text });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Grid3x3}
        title="ความครอบคลุม & แผนที่"
        description="สถานที่ที่เผยแพร่แล้วในแต่ละจังหวัด แยกตาม 7 vibe ของหน้าเว็บ ช่องสีเทาคือยังไม่มีเลย"
        actions={
          <button type="button" onClick={() => { setIsLoading(true); setReloadToken((t) => t + 1); }} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {([['matrix', 'ตารางจังหวัด × vibe', Grid3x3], ['map', 'แผนที่', MapIcon]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${tab === id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      {tab === 'map' ? (
        <SpotsMapPanel />
      ) : (
        <>
          {data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'เผยแพร่แล้ว', value: data.totals.published.toLocaleString('th-TH') },
                { label: 'แบบร่าง', value: data.totals.drafts.toLocaleString('th-TH') },
                { label: 'ช่องที่ยังว่าง', value: `${data.totals.emptyCells} / ${data.provinces.length * data.vibes.length}` },
                {
                  label: 'vibe ที่น้อยที่สุด',
                  value: (() => {
                    const least = [...data.vibes].sort((a, b) => data.totals.vibes[a.id] - data.totals.vibes[b.id])[0];
                    return `${least.label} · ${data.totals.vibes[least.id]}`;
                  })(),
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-sm sm:text-base font-extrabold text-slate-900 truncate">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาจังหวัด"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
            <select aria-label="เรียงลำดับ" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="fewest">สถานที่น้อยที่สุดก่อน</option>
              <option value="gaps">ช่องว่างมากที่สุดก่อน</option>
              <option value="most">สถานที่มากที่สุดก่อน</option>
              <option value="name">ชื่อจังหวัด</option>
            </select>
            {/* Legend */}
            <div className="ml-auto flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500" aria-label="คำอธิบายสี">
              <span className="font-semibold">จำนวนสถานที่:</span>
              {BINS.map((bin) => (
                <span key={bin.label} className="inline-flex items-center gap-1">
                  <span className="h-3 w-5 rounded-[3px] border border-white" style={{ background: bin.fill }} />
                  {bin.label}
                </span>
              ))}
            </div>
          </div>

          {isLoading && !data ? (
            <div className="space-y-1">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : rows.length === 0 ? (
            <AdminEmptyState action={<button type="button" onClick={() => setQuery('')} className={adminButton.secondarySm}>ดูทั้งหมด</button>}>
              ไม่พบจังหวัดที่ค้นหา
            </AdminEmptyState>
          ) : data && (
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-white max-h-[70vh] [scrollbar-width:thin]">
              <table className="w-full border-separate border-spacing-0.5 text-xs">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr>
                    <th className="sticky left-0 z-20 bg-white px-3 py-2 text-left text-[11px] font-semibold text-slate-500">จังหวัด</th>
                    {data.vibes.map((vibe) => (
                      <th key={vibe.id} className="min-w-[84px] px-1 py-2 text-center text-[11px] font-semibold leading-tight text-slate-500">{vibe.label}</th>
                    ))}
                    <th className="px-2 py-2 text-right text-[11px] font-semibold text-slate-500">รวม</th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold text-slate-500">ร่าง</th>
                    <th className="px-2 py-2" aria-label="การทำงาน" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.province}>
                      <th scope="row" className="sticky left-0 z-[5] bg-white px-3 py-1 text-left text-xs font-bold text-slate-800 whitespace-nowrap">
                        <button type="button" onClick={() => onOpenSpots({ province: row.province })} className="hover:text-[#2563EB] hover:underline">
                          {row.province}
                        </button>
                      </th>
                      {data.vibes.map((vibe) => {
                        const count = row.vibes[vibe.id];
                        const bin = binOf(count);
                        const tip = `${row.province} · ${vibe.label}: ${count} แห่ง${count ? ' · คลิกเพื่อดูรายการ' : ''}`;
                        return (
                          <td key={vibe.id} className="p-0">
                            <button
                              type="button"
                              disabled={count === 0}
                              aria-label={tip}
                              onClick={() => onOpenSpots({ province: row.province, vibe: vibe.id })}
                              onMouseEnter={(e) => showTip(e, tip)}
                              onFocus={(e) => showTip(e, tip)}
                              onMouseLeave={() => setHover(null)}
                              onBlur={() => setHover(null)}
                              className="block h-8 w-full rounded-[4px] text-center text-xs font-bold tabular-nums transition-[filter] hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:cursor-default"
                              style={{ background: bin.fill, color: bin.ink }}
                            >
                              {count}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 text-right text-xs font-extrabold tabular-nums text-slate-900">{row.total}</td>
                      <td className="px-2 text-right text-xs tabular-nums text-slate-500">{row.drafts || '–'}</td>
                      <td className="px-2 text-right">
                        <button type="button" onClick={() => onScanProvince(row.province)} className={`${adminButton.secondarySm} whitespace-nowrap`}>
                          ดึงเพิ่ม
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hover && (
            <div
              role="tooltip"
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg"
              style={{ left: hover.x, top: hover.y - 6 }}
            >
              {hover.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}
