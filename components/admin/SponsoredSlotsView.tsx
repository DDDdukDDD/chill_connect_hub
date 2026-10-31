'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { bangkokToday, campaignDay } from '@/lib/campaigns/types';
import { SPONSOR_PILLARS, SPONSOR_PILLAR_LABELS, type SponsorPillar, type SponsoredSlot, isSlotLive } from '@/lib/sponsored/types';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';

type Option = { id: string; title: string; detail?: string };
type Data = { slots: SponsoredSlot[]; options: Record<SponsorPillar, Option[]> };
type Form = Omit<SponsoredSlot, 'createdAt' | 'updatedAt' | 'note'> & { note: string };

const EMPTY: Form = { id: '', pillar: 'community', itemId: '', sponsor: '', note: '', startDate: bangkokToday(), endDate: bangkokToday(), published: false };

/** Where a slot stands today; `shownId` is the slot its page really shows (the latest start wins) */
function phaseOf(slot: SponsoredSlot, shownId: string | undefined): { label: string; tone: string } {
  const today = bangkokToday();
  if (!slot.published) return { label: 'ปิดอยู่', tone: 'bg-slate-100 text-slate-700' };
  if (today < slot.startDate) return { label: 'ยังไม่เริ่ม', tone: 'bg-blue-50 text-blue-800' };
  if (today > slot.endDate) return { label: 'หมดเวลา', tone: 'bg-slate-100 text-slate-500' };
  if (shownId !== slot.id) return { label: 'ไม่ได้แสดง: มีอีกใบซ้อนช่วงเวลา', tone: 'bg-rose-50 text-rose-700' };
  return { label: 'กำลังแสดง', tone: 'bg-emerald-50 text-emerald-800' };
}

function SlotEditor({ entry, options, onClose, onSaved }: { entry: SponsoredSlot | null; options: Data['options']; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<Form>(() => (entry ? { ...entry, note: entry.note ?? '' } : { ...EMPTY }));
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const list = options[form.pillar];
  const chosen = list.find((o) => o.id === form.itemId);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return list.filter((o) => o.title.toLowerCase().includes(q) || o.id.toLowerCase() === q).slice(0, 8);
  }, [list, search]);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sponsored', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', slot: form }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      onSaved(`บันทึกการ์ดสนับสนุนของ ${data.slot.sponsor} แล้ว`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDrawer
      title={entry ? `แก้ไขการ์ดสนับสนุน · ${entry.sponsor}` : 'เพิ่มการ์ดสนับสนุน'}
      subtitle="การ์ดของรายการนั้นเอง ขึ้นเป็นใบที่ 3 ของหน้า มีป้าย “สนับสนุน” ใต้การ์ด หน้าละ 1 ใบ"
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
      <FormSection title="แสดงที่ไหน" hint="ขึ้นเฉพาะตอนที่รายการนั้นตรงกับตัวกรองที่สมาชิกเลือก ไม่ยัดให้ในผลค้นหาที่ไม่เกี่ยว">
        <Field label="หน้า:" htmlFor="sponsored-pillar" wide>
          <div id="sponsored-pillar" className="flex flex-wrap gap-2">
            {SPONSOR_PILLARS.map((pillar) => (
              <button
                key={pillar}
                type="button"
                aria-pressed={form.pillar === pillar}
                onClick={() => setForm((current) => ({ ...current, pillar, itemId: pillar === current.pillar ? current.itemId : '' }))}
                className={form.pillar === pillar ? adminButton.dark : adminButton.secondary}
              >
                {SPONSOR_PILLAR_LABELS[pillar]}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`${SPONSOR_PILLAR_LABELS[form.pillar]}ที่ขึ้นการ์ด:`} htmlFor="sponsored-search" wide hint={chosen ? undefined : `ค้นจากชื่อ มี ${list.length.toLocaleString()} รายการที่หน้านี้แสดงอยู่`}>
          {chosen && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{chosen.title}</p>
                {chosen.detail && <p className="truncate text-xs text-slate-500">{chosen.detail}</p>}
              </div>
              <button type="button" onClick={() => set('itemId', '')} className={adminButton.secondarySm}>เปลี่ยน</button>
            </div>
          )}
          {!chosen && (
            <>
              <input id="sponsored-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="พิมพ์ชื่อ" className={fieldInputClass} />
              {matches.length > 0 && (
                <ul className="mt-1.5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {matches.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => { set('itemId', o.id); setSearch(''); }} className="w-full px-3 py-2 text-left hover:bg-slate-50">
                        <span className="block truncate text-sm text-slate-800">{o.title}</span>
                        {o.detail && <span className="block truncate text-xs text-slate-500">{o.detail}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {entry && form.itemId && <p className="mt-1 text-[11px] font-semibold text-rose-600">รายการเดิม ({form.itemId}) ไม่อยู่บนหน้าแล้ว เลือกใหม่</p>}
            </>
          )}
        </Field>
      </FormSection>

      <FormSection title="ผู้สนับสนุนและช่วงเวลา" hint="ชื่อผู้สนับสนุนและหมายเหตุ ทีมงานเห็นเท่านั้น">
        <Field label="ผู้สนับสนุน:" htmlFor="sponsored-sponsor">
          <input id="sponsored-sponsor" value={form.sponsor} onChange={(e) => set('sponsor', e.target.value)} placeholder="เช่น Aura Candle Studio" className={fieldInputClass} />
        </Field>
        <Field label="หมายเหตุ:" htmlFor="sponsored-note">
          <input id="sponsored-note" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="เช่น แพ็กเกจ 1 เดือน จ่ายแล้ว" className={fieldInputClass} />
        </Field>
        <Field label="วันเริ่ม:" htmlFor="sponsored-start">
          <input id="sponsored-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="วันจบ:" htmlFor="sponsored-end">
          <input id="sponsored-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="การแสดงผล:" htmlFor="sponsored-published" wide>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input id="sponsored-published" type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="h-4 w-4 accent-[#2563EB]" />
            เปิดแสดงบนหน้าเว็บในช่วงเวลานี้
          </label>
        </Field>
      </FormSection>
    </AdminDrawer>
  );
}

export function SponsoredSlotsView() {
  const { can } = useAdminSession();
  const canEdit = can('content.edit');
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<SponsoredSlot | null | undefined>(undefined);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sponsored', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'โหลดไม่สำเร็จ');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (slot: SponsoredSlot) => {
    if (!window.confirm(`ลบการ์ดสนับสนุนของ "${slot.sponsor}"? รายการนั้นยังอยู่บนหน้า แค่ไม่ขึ้นเป็นการ์ดสนับสนุน`)) return;
    const res = await fetch('/api/admin/sponsored', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: slot.id }) });
    const json = await res.json();
    if (!json.success) setError(json.error || 'ลบไม่สำเร็จ');
    else setNotice(`ลบการ์ดสนับสนุนของ ${slot.sponsor} แล้ว`);
    void load();
  };

  // The slot each page shows today (slots come newest start first, as the public pages pick them)
  const today = bangkokToday();
  const shown = new Map<SponsorPillar, string>();
  for (const slot of data?.slots ?? []) if (isSlotLive(slot, today) && !shown.has(slot.pillar)) shown.set(slot.pillar, slot.id);
  const titleOf = (slot: SponsoredSlot) => data?.options[slot.pillar].find((o) => o.id === slot.itemId)?.title;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={BadgeDollarSign}
        title="การ์ดสนับสนุน"
        description="ร้าน สตูดิโอ หรือผู้จัดงานจ่ายให้ตี้ อีเวนต์ ที่เที่ยว หรือชาเลนจ์ของเขาขึ้นเป็นการ์ดใบที่ 3 ของหน้า หน้าละ 1 ใบ มีป้าย “สนับสนุน”"
        actions={
          <>
            <button type="button" onClick={() => void load()} className={adminButton.icon} aria-label="โหลดใหม่">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {canEdit && data && (
              <button type="button" onClick={() => setEditing(null)} className={adminButton.primary}>
                <Plus size={16} /> เพิ่มการ์ด
              </button>
            )}
          </>
        }
      />
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      {!data ? (
        <AdminEmptyState>{isLoading ? 'กำลังโหลด…' : 'ยังโหลดการ์ดสนับสนุนไม่ได้'}</AdminEmptyState>
      ) : data.slots.length === 0 ? (
        <AdminEmptyState>ยังไม่มีการ์ดสนับสนุน ช่องจะว่างไว้และหน้าแสดงตามปกติ</AdminEmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] sm:text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="py-2.5 px-4">หน้า</th>
                <th className="py-2.5 px-4">รายการ</th>
                <th className="py-2.5 px-4">ผู้สนับสนุน</th>
                <th className="py-2.5 px-4">ช่วงเวลา</th>
                <th className="py-2.5 px-4">สถานะ</th>
                {canEdit && <th className="py-2.5 px-4" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slots.map((slot) => {
                const phase = phaseOf(slot, shown.get(slot.pillar));
                const title = titleOf(slot);
                return (
                  <tr key={slot.id} className="align-top">
                    <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-slate-800">{SPONSOR_PILLAR_LABELS[slot.pillar]}</td>
                    <td className="py-2.5 px-4 text-slate-800">{title ?? <span className="text-rose-700">ไม่อยู่บนหน้าแล้ว ({slot.itemId})</span>}</td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {slot.sponsor}
                      {slot.note && <span className="block text-xs text-slate-500">{slot.note}</span>}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{campaignDay(slot.startDate)} – {campaignDay(slot.endDate)}</td>
                    <td className="py-2.5 px-4"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${phase.tone}`}>{phase.label}</span></td>
                    {canEdit && (
                      <td className="py-2.5 px-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(slot)} className={adminButton.secondarySm}><Pencil size={13} /> แก้ไข</button>
                          <button type="button" onClick={() => void remove(slot)} className={adminButton.dangerSm}><Trash2 size={13} /> ลบ</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && data && (
        <SlotEditor
          entry={editing}
          options={data.options}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setEditing(undefined);
            setNotice(message);
            void load();
          }}
        />
      )}
    </div>
  );
}
