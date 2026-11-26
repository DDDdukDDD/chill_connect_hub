'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pencil, Plus, RefreshCw, Ticket } from 'lucide-react';
import { REWARD_CATEGORIES, type RewardShopItem } from '@/data/rewardsData';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { ImageField } from './masterAdmin';

interface RewardRow {
  item: RewardShopItem;
  redeemed: number;
  members: number;
  xpSpent: number;
}

interface RedemptionRow {
  id: string;
  rewardId: string;
  memberName: string;
  cost: number;
  createdAt: string;
}

interface RewardsResponse {
  rewards: RewardRow[];
  totals: { redemptions: number; xpSpent: number; members: number };
  recent: RedemptionRow[];
}

const dateTime = (iso: string) => new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });

/** The admin form's fields: numbers stay text while typing */
interface RewardForm {
  id: string;
  title: string;
  category: RewardShopItem['category'];
  costXp: string;
  discountValue: string;
  description: string;
  image: string;
  partner: string;
  partnerLocation: string;
  voucherCode: string;
  stockCount: string;
  validUntilDate: string;
  terms: string;
  featured: boolean;
  campaignOnly: boolean;
  hidden: boolean;
}

const EMPTY: RewardForm = {
  id: '', title: '', category: 'cafe', costXp: '', discountValue: '', description: '', image: '', partner: '', partnerLocation: '',
  voucherCode: '', stockCount: '', validUntilDate: '', terms: '', featured: false, campaignOnly: false, hidden: false,
};

const formOf = (item: RewardShopItem): RewardForm => ({
  id: item.id,
  title: item.title,
  category: item.category,
  costXp: String(item.costXp),
  discountValue: item.discountValue,
  description: item.description,
  image: item.image ?? '',
  partner: item.partner,
  partnerLocation: item.partnerLocation,
  voucherCode: item.voucherCode,
  stockCount: String(item.stockCount),
  validUntilDate: item.validUntilDate ?? '',
  terms: item.terms.join('\n'),
  featured: Boolean(item.featured),
  campaignOnly: Boolean(item.campaignOnly),
  hidden: Boolean(item.hidden),
});

function Check({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-10 items-center gap-2 text-sm text-slate-700 cursor-pointer">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}

/** Adds or edits one reward: a partner's voucher every member who pays the XP gets (no prize draws, owner 2026-11-23) */
function RewardEditor({ entry, onClose, onSaved }: { entry: RewardRow | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<RewardForm>(() => (entry ? formOf(entry.item) : { ...EMPTY }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof RewardForm>(key: K, value: RewardForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', reward: { ...form, costXp: Number(form.costXp), stockCount: Number(form.stockCount || 0) } }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      onSaved(`บันทึกของรางวัล ${data.reward.title} แล้ว`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDrawer
      title={entry ? `แก้ไขของรางวัล · ${entry.item.title}` : 'เพิ่มของรางวัล'}
      subtitle={entry ? <span>id: {entry.item.id} · แลกแล้ว {entry.redeemed} ครั้ง</span> : 'คูปองหรือของรางวัลจากร้านพาร์ตเนอร์ สมาชิกที่แลกได้รับทุกคน'}
      onClose={onClose}
      footer={
        <>
          {error && <p className="mr-auto text-sm font-semibold text-rose-700">{error}</p>}
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          <button type="button" disabled={isSaving} onClick={save} className={adminButton.primary}>
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
          </button>
        </>
      }
    >
      <FormSection title="สิ่งที่สมาชิกเห็น">
        <Field label="ชื่อของรางวัล:" htmlFor="reward-title" wide hint="เช่น คูปองส่วนลด ฿50 Specialty Coffee">
          <input id="reward-title" value={form.title} onChange={(e) => set('title', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="มูลค่า:" htmlFor="reward-value" hint="เช่น ลด ฿50">
          <input id="reward-value" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ราคา XP:" htmlFor="reward-cost">
          <input id="reward-cost" type="number" min={1} inputMode="numeric" value={form.costXp} onChange={(e) => set('costXp', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="หมวด:" htmlFor="reward-category">
          <select id="reward-category" value={form.category} onChange={(e) => set('category', e.target.value as RewardShopItem['category'])} className={fieldInputClass}>
            {REWARD_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="ใช้ได้ถึง:" htmlFor="reward-until">
          <input id="reward-until" type="date" value={form.validUntilDate} onChange={(e) => set('validUntilDate', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="รายละเอียด:" htmlFor="reward-description" wide>
          <textarea id="reward-description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="เงื่อนไข (บรรทัดละข้อ):" htmlFor="reward-terms" wide>
          <textarea id="reward-terms" rows={4} value={form.terms} onChange={(e) => set('terms', e.target.value)} className={fieldInputClass} />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1 text-xs font-semibold text-slate-600">รูป (ต้องเป็นรูปที่เรามีสิทธิ์ใช้)</p>
          <ImageField id="reward-image" value={form.image} onChange={(url) => set('image', url)} folder="campaign" />
        </div>
      </FormSection>

      <FormSection title="ร้านพาร์ตเนอร์">
        <Field label="ชื่อร้าน:" htmlFor="reward-partner">
          <input id="reward-partner" value={form.partner} onChange={(e) => set('partner', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="สาขา / ที่ใช้:" htmlFor="reward-location">
          <input id="reward-location" value={form.partnerLocation} onChange={(e) => set('partnerLocation', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="รหัสคูปองของร้าน:" htmlFor="reward-code">
          <input id="reward-code" value={form.voucherCode} onChange={(e) => set('voucherCode', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="จำนวนที่มีให้:" htmlFor="reward-stock">
          <input id="reward-stock" type="number" min={0} inputMode="numeric" value={form.stockCount} onChange={(e) => set('stockCount', e.target.value)} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="การแสดงผล">
        <Check id="reward-featured" label="แนะนำ (ขึ้นก่อนในร้าน)" checked={form.featured} onChange={(v) => set('featured', v)} />
        <Check id="reward-campaign-only" label="แลกได้จากแคมเปญเท่านั้น" checked={form.campaignOnly} onChange={(v) => set('campaignOnly', v)} />
        <Check id="reward-hidden" label="ซ่อนจากร้าน (คนที่แลกแล้วยังเห็นของตัวเอง)" checked={form.hidden} onChange={(v) => set('hidden', v)} />
      </FormSection>
    </AdminDrawer>
  );
}

/**
 * The rewards catalog and what members spent their XP on (BE-255, editable since BE-391). Prize draws were removed
 * 2026-11-26. The stock is shown on the site but the server does not stop a redeem past it, so a reward over its stock is
 * marked here for staff to settle with the partner.
 */
export function RewardsView() {
  const { can } = useAdminSession();
  const canEdit = can('content.edit');
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<RewardRow | 'new' | null>(null);

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

  const titleOf = (rewardId: string) => data?.rewards.find((r) => r.item.id === rewardId)?.item.title ?? rewardId;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Ticket}
        title="ของรางวัล & การแลก"
        description="ของรางวัลในร้านและของแคมเปญ ราคา XP และสมาชิกแลกอะไรไปบ้าง"
        actions={
          <>
            <button type="button" onClick={load} disabled={isLoading} className={adminButton.secondary}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
            </button>
            {canEdit && (
              <button type="button" onClick={() => setEditing('new')} className={adminButton.primary}>
                <Plus size={14} /> เพิ่มของรางวัล
              </button>
            )}
          </>
        }
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
        </div>
      )}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

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
                {canEdit && <th className="px-4 py-2.5"><span className="sr-only">แก้ไข</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && !data
                ? [1, 2, 3].map((n) => <tr key={n}><td colSpan={5} className="h-12 animate-pulse bg-slate-50/50" /></tr>)
                : data?.rewards.map((row) => {
                    const { item } = row;
                    const over = row.redeemed > item.stockCount;
                    return (
                      <tr key={item.id} className={item.hidden ? 'opacity-60' : ''}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{item.title}{item.hidden && <span className="ml-2 text-[11px] font-semibold text-slate-500">ซ่อนอยู่</span>}</p>
                          <p className="text-[11px] text-slate-500">{item.partner}</p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{item.costXp.toLocaleString('th-TH')}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="tabular-nums font-semibold text-slate-900">{row.redeemed}</span>
                          <span className="tabular-nums text-slate-500"> / {item.stockCount}</span>
                          {over && <p className="mt-0.5 text-[11px] font-semibold text-rose-700">เกินจำนวน {row.redeemed - item.stockCount} ชิ้น แจ้งพาร์ตเนอร์</p>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.xpSpent.toLocaleString('th-TH')}</td>
                        {canEdit && (
                          <td className="px-2 py-3 text-right">
                            <button type="button" onClick={() => setEditing(row)} aria-label={`แก้ไข ${item.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                              <Pencil size={15} />
                            </button>
                          </td>
                        )}
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
                <span className="text-[11px] tabular-nums text-slate-500">{row.cost.toLocaleString('th-TH')} XP · {dateTime(row.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <RewardEditor
          entry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            load();
          }}
        />
      )}
    </div>
  );
}
