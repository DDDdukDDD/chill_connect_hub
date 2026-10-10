'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Plus, Search, Star } from 'lucide-react';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import { MasterProvince, MasterZone, Region, REGIONS } from '@/lib/masterData';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ImageField, MasterList, MasterNotices, useMasterAdmin } from './masterAdmin';

type ProvinceForm = { id: string; displayName: string; nameEn: string; region: Region; tagline: string; description: string; image: string; featured: boolean };

function ProvinceEditor({ entry, onClose, onSave, isSaving }: { entry: MasterProvince; onClose: () => void; onSave: (form: ProvinceForm) => void; isSaving: boolean }) {
  const [form, setForm] = useState<ProvinceForm>({
    id: entry.id,
    displayName: entry.displayName,
    nameEn: entry.nameEn,
    region: entry.region,
    tagline: entry.tagline,
    description: entry.description,
    image: entry.image ?? '',
    featured: entry.featured,
  });
  const set = <K extends keyof ProvinceForm>(key: K, value: ProvinceForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <AdminDrawer
      title={`จังหวัด${entry.id}`}
      subtitle="ชื่อจังหวัดที่เก็บกับเนื้อหาเปลี่ยนไม่ได้ ส่วนชื่อที่แสดง รูป และคำโปรยแก้ได้"
      onClose={onClose}
      preview={
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] sm:text-xs font-semibold text-slate-500">ตัวอย่างการ์ดจังหวัด</p>
          <div className="relative h-44 overflow-hidden rounded-2xl bg-slate-200">
            {form.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{form.nameEn || ' '}</p>
              <p className="text-base font-black leading-tight">{form.displayName || entry.id}</p>
              {form.tagline && <p className="mt-0.5 line-clamp-2 text-[11px] opacity-90">{form.tagline}</p>}
            </div>
          </div>
          {!form.featured && <p className="mt-2 text-[11px] text-slate-500">ยังไม่อยู่ในรายการจังหวัดยอดนิยม</p>}
        </div>
      }
      footer={
        <>
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          <button type="button" disabled={isSaving} onClick={() => onSave(form)} className={adminButton.primary}>
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
          </button>
        </>
      }
    >
      <FormSection title="ชื่อ & ภูมิภาค">
        <Field label="ชื่อที่แสดง:" htmlFor="prov-display" hint="เช่น หัวหิน • ประจวบฯ">
          <input id="prov-display" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ชื่ออังกฤษ:" htmlFor="prov-en">
          <input id="prov-en" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ภาค:" htmlFor="prov-region">
          <select id="prov-region" value={form.region} onChange={(e) => set('region', e.target.value as Region)} className={fieldInputClass}>
            {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </Field>
        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-slate-900" />
            จังหวัดยอดนิยม (แสดงใน rail และตัวกรองด่วน)
          </label>
        </div>
      </FormSection>
      <FormSection title="เนื้อหา">
        <Field label="คำโปรย:" htmlFor="prov-tagline" wide hint="1 บรรทัด เช่น ดินแดนสโลว์บาร์ ธรรมชาติ และดอยสูง">
          <input id="prov-tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำอธิบายจังหวัด:" htmlFor="prov-description" wide>
          <textarea id="prov-description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={fieldInputClass} />
        </Field>
      </FormSection>
      <FormSection title="รูปปก" hint="รูปแนวนอนคมชัด สว่าง ตามมาตรฐานภาพของ platform">
        <div className="sm:col-span-2">
          <ImageField id="prov-image" value={form.image} onChange={(url) => set('image', url)} folder="province" />
        </div>
      </FormSection>
    </AdminDrawer>
  );
}

type ZoneForm = { id?: string; name: string; province: string };

function ZoneEditor({ entry, onClose, onSave, isSaving }: { entry: MasterZone | null; onClose: () => void; onSave: (form: ZoneForm) => void; isSaving: boolean }) {
  const [form, setForm] = useState<ZoneForm>({ id: entry?.id, name: entry?.name ?? '', province: entry?.province ?? 'กรุงเทพฯ' });
  return (
    <AdminDrawer
      title={entry ? 'แก้ไขโซน' : 'เพิ่มโซน'}
      subtitle="โซน / ย่านใช้เป็นตัวกรองกิจกรรมในหน้าเว็บ"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          <button type="button" disabled={isSaving} onClick={() => onSave(form)} className={adminButton.primary}>
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
          </button>
        </>
      }
    >
      <FormSection title="ข้อมูลโซน">
        <Field label="ชื่อโซน:" htmlFor="zone-name" wide hint="เช่น นิมมาน / ช้างคลาน">
          <input id="zone-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldInputClass} />
        </Field>
        <Field label="จังหวัด:" htmlFor="zone-province">
          <select id="zone-province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={fieldInputClass}>
            {MASTER_77_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </Field>
      </FormSection>
    </AdminDrawer>
  );
}

export function ProvincesManagerView() {
  const admin = useMasterAdmin();
  const [tab, setTab] = useState<'provinces' | 'zones'>('provinces');
  const [region, setRegion] = useState<'all' | Region>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [editingProvince, setEditingProvince] = useState<MasterProvince | null>(null);
  const [editingZone, setEditingZone] = useState<MasterZone | null | undefined>(undefined);
  const [spotCounts, setSpotCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    fetch('/api/admin/coverage', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.provinces) setSpotCounts(Object.fromEntries(json.provinces.map((row: { province: string; total: number }) => [row.province, row.total])));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const provinces = useMemo(() => (admin.data?.provinces ?? [])
    .filter((p) => (region === 'all' || p.region === region) && (!featuredOnly || p.featured) && (!query.trim() || p.id.includes(query.trim()) || p.displayName.includes(query.trim()) || p.nameEn.toLowerCase().includes(query.trim().toLowerCase())))
    .sort((a, b) => a.id.localeCompare(b.id, 'th')), [admin.data, region, featuredOnly, query]);
  const zones = useMemo(() => [...(admin.data?.zones ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [admin.data]);
  const featuredCount = admin.data?.provinces.filter((p) => p.featured).length ?? 0;

  const toggleFeatured = (province: MasterProvince) =>
    admin.save('provinces', { ...province, featured: !province.featured }, province.displayName);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={MapPin}
        title="77 จังหวัด & โซน"
        description="ชื่อที่แสดง ภาค รูปปก คำโปรย จังหวัดยอดนิยม และโซน / ย่านที่ใช้เป็นตัวกรอง"
        actions={tab === 'zones' && admin.canEdit && (
          <button type="button" onClick={() => setEditingZone(null)} className={adminButton.primary}>
            <Plus size={14} /> เพิ่มโซน
          </button>
        )}
      />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {([['provinces', `จังหวัด (ยอดนิยม ${featuredCount})`], ['zones', `โซน / ย่าน (${zones.length})`]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <MasterNotices admin={admin} />

      {!admin.data ? (
        <div className="space-y-1">{[1, 2, 3, 4].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : tab === 'provinces' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาจังหวัด" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </div>
            <select aria-label="ภาค" value={region} onChange={(e) => setRegion(e.target.value as 'all' | Region)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">ทุกภาค</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} className="h-4 w-4 accent-slate-900" />
              เฉพาะจังหวัดยอดนิยม
            </label>
          </div>
          <MasterList
            collection="provinces"
            admin={admin}
            reorderable={false}
            allowDeactivate={false}
            onEdit={(entry) => setEditingProvince(entry as MasterProvince)}
            rows={provinces.map((province) => ({
              entry: province,
              title: province.displayName === province.id ? province.id : `${province.displayName} (${province.id})`,
              subtitle: [province.region, province.nameEn, province.tagline].filter(Boolean).join(' · '),
              leading: province.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={province.image} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                : <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">ไม่มีรูป</span>,
              extra: (
                <>
                  <span className="w-20 text-right text-xs tabular-nums text-slate-500" title="สถานที่ที่เผยแพร่">{spotCounts[province.id] ?? '–'} สถานที่</span>
                  <button
                    type="button"
                    disabled={!admin.canEdit || Boolean(admin.busy)}
                    onClick={() => toggleFeatured(province)}
                    aria-pressed={province.featured}
                    title={province.featured ? 'นำออกจากจังหวัดยอดนิยม' : 'ตั้งเป็นจังหวัดยอดนิยม'}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold ${province.featured ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'}`}
                  >
                    <Star size={11} className={province.featured ? 'fill-amber-400 text-amber-500' : ''} /> ยอดนิยม
                  </button>
                </>
              ),
            }))}
          />
        </>
      ) : (
        <MasterList
          collection="zones"
          admin={admin}
          onEdit={(entry) => setEditingZone(entry as MasterZone)}
          rows={zones.map((zone) => ({ entry: zone, title: zone.name, subtitle: zone.province }))}
        />
      )}

      {editingProvince && (
        <ProvinceEditor
          key={editingProvince.id}
          entry={editingProvince}
          isSaving={admin.busy?.startsWith('save:') ?? false}
          onClose={() => setEditingProvince(null)}
          onSave={async (form) => { if (await admin.save('provinces', form, form.displayName)) setEditingProvince(null); }}
        />
      )}
      {editingZone !== undefined && (
        <ZoneEditor
          key={editingZone?.id ?? 'new'}
          entry={editingZone}
          isSaving={admin.busy?.startsWith('save:') ?? false}
          onClose={() => setEditingZone(undefined)}
          onSave={async (form) => { if (await admin.save('zones', form, form.name)) setEditingZone(undefined); }}
        />
      )}
    </div>
  );
}
