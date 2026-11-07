'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Ticket } from 'lucide-react';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface RewardRow {
  id: string;
  title: string;
  partner: string;
  costXp: number;
  stockCount: number;
  redeemed: number;
  xpSpent: number;
  drawDate: string | null;
}

interface RedemptionRow {
  id: string;
  rewardId: string;
  memberName: string;
  cost: number;
  createdAt: string;
  code: string | null;
}

interface RewardsResponse {
  rewards: RewardRow[];
  totals: { redemptions: number; xpSpent: number; members: number };
  recent: RedemptionRow[];
}

const dateTime = (iso: string) => new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
const day = (iso: string) => new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * What members spent their XP on (BE-255). Read-only: the catalog lives in data/rewardsData.ts, and the prize
 * draw has its own page. The stock is shown on the site but the server does not stop a redeem past it, so a
 * reward over its stock is marked here for staff to settle with the partner.
 */
export function RewardsView() {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const load = useCallback(() => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/rewards', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'โหลดของรางวัลไม่สำเร็จ');
        if (active) { setData(json); setError(null); }
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'โหลดของรางวัลไม่สำเร็จ'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  const titleOf = (rewardId: string) => data?.rewards.find((r) => r.id === rewardId)?.title ?? rewardId;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Ticket}
        title="ของรางวัล & การแลก"
        description="สมาชิกใช้ XP แลกอะไรไปบ้าง และของแต่ละชิ้นเหลือเท่าไร รายการของรางวัลกำหนดในโค้ด (data/rewardsData.ts)"
        actions={
          <button type="button" onClick={load} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      <section className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {[
          { label: 'ครั้งที่แลก', value: data?.totals.redemptions },
          { label: 'สมาชิกที่แลก', value: data?.totals.members },
          { label: 'XP ที่ใช้ไป', value: data?.totals.xpSpent },
        ].map((tile) => (
          <div key={tile.label} className="px-4 py-3">
            <p className="text-2xl font-bold tabular-nums text-slate-900">{tile.value === undefined ? '—' : tile.value.toLocaleString('th-TH')}</p>
            <p className="text-[11px] text-slate-500">{tile.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">ของรางวัลแต่ละชิ้น</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2.5">ของรางวัล</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">ราคา XP</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">แลกแล้ว / มีให้</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">XP ที่ใช้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && !data
                ? [1, 2, 3].map((n) => <tr key={n}><td colSpan={4} className="h-12 animate-pulse bg-slate-50/50" /></tr>)
                : data?.rewards.map((reward) => {
                    // A draw entry is a ticket, not a thing in stock: anyone may enter
                    const over = !reward.drawDate && reward.redeemed > reward.stockCount;
                    return (
                      <tr key={reward.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{reward.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {reward.partner}{reward.drawDate && ` · สิทธิ์ลุ้น จับรางวัล ${day(reward.drawDate)}`}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{reward.costXp.toLocaleString('th-TH')}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="tabular-nums font-semibold text-slate-900">{reward.redeemed}</span>
                          <span className="tabular-nums text-slate-500"> / {reward.drawDate ? 'ไม่จำกัด' : reward.stockCount}</span>
                          {over && <p className="mt-0.5 text-[11px] font-semibold text-rose-700">เกินจำนวน {reward.redeemed - reward.stockCount} ชิ้น แจ้งพาร์ตเนอร์</p>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{reward.xpSpent.toLocaleString('th-TH')}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">แลกล่าสุด</h2>
        {data && data.recent.length === 0 ? (
          <div className="p-4"><AdminEmptyState>ยังไม่มีสมาชิกแลกของรางวัล</AdminEmptyState></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data?.recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5">
                <span className="text-sm font-semibold text-slate-800">{row.memberName}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{titleOf(row.rewardId)}</span>
                {row.code && <span className="font-mono text-[11px] text-slate-500">{row.code}</span>}
                <span className="text-[11px] tabular-nums text-slate-500">{row.cost.toLocaleString('th-TH')} XP · {dateTime(row.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
