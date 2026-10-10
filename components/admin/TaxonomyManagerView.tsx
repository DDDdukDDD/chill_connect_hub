'use client';

import React, { useState } from 'react';
import { FolderTree, Loader2, Plus } from 'lucide-react';
import {
  CATEGORY_COLLECTIONS, CategoryCollection, COLLECTION_LABELS, COLOR_KEYS, COLOR_PRESETS, ColorKey, FIXED_COLLECTIONS,
  ICON_OPTIONS, MasterCategory,
} from '@/lib/masterData';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ImageField, MasterList, MasterNotices, useMasterAdmin } from './masterAdmin';

const COLLECTION_HINTS: Record<CategoryCollection, string> = {
  spotVibes: '7 vibe ที่หน้าเว็บใช้จัดกลุ่มพิกัดเที่ยว (เพิ่ม/ลบไม่ได้ เพราะระบบคำนวณ vibe จาก id เหล่านี้)',
  communityMoods: '4 อารมณ์หลักของกิจกรรมคอมมูนิตี้ (เพิ่ม/ลบไม่ได้)',
  communityCategories: 'หมวดใน rail ของหน้าคอมมูนิตี้ แต่ละหมวดผูกกับอารมณ์หลัก 1 แบบ',
  fairCategories: 'หมวดใน rail ของหน้างานมหกรรม & เอ็กซ์โป',
  questCategories: 'หมวดของชาเลนจ์ & ภารกิจ',
};

function CategoryChip({ entry }: { entry: Pick<MasterCategory, 'iconKey' | 'colorKey' | 'name'> }) {
  const Icon = ICON_OPTIONS[entry.iconKey] ?? ICON_OPTIONS.Sparkles;
  const color = COLOR_PRESETS[entry.colorKey] ?? COLOR_PRESETS.slate;
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color.iconBg}`} title={entry.name}>
      <Icon size={16} className={color.iconColor} />
    </span>
  );
}

type CategoryForm = { id?: string; name: string; nameEn: string; description: string; keywords: string; image: string; iconKey: string; colorKey: ColorKey; parentId: string };

function CategoryEditor({
  collection,
  entry,
  moods,
  onClose,
  onSave,
  isSaving,
}: {
  collection: CategoryCollection;
  entry: MasterCategory | null;
  moods: MasterCategory[];
  onClose: () => void;
  onSave: (item: CategoryForm) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CategoryForm>({
    id: entry?.id,
    name: entry?.name ?? '',
    nameEn: entry?.nameEn ?? '',
    description: entry?.description ?? '',
    keywords: (entry?.keywords ?? []).join(', '),
    image: entry?.image ?? '',
    iconKey: entry?.iconKey ?? 'Sparkles',
    colorKey: entry?.colorKey ?? 'emerald',
    parentId: entry?.parentId ?? 'chill',
  });
  const set = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const color = COLOR_PRESETS[form.colorKey];

  return (
    <AdminDrawer
      title={entry ? `แก้ไข${COLLECTION_LABELS[collection]}` : `เพิ่ม${COLLECTION_LABELS[collection]}`}
      subtitle={entry ? <span>id: {entry.id}{entry.builtIn ? ' · มากับระบบ' : ''}</span> : 'id สร้างจากชื่อภาษาอังกฤษ'}
      onClose={onClose}
      preview={
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500">ตัวอย่าง</p>
          <div className={`flex items-center gap-3 rounded-2xl border bg-white p-3 ${color.border}`}>
            <CategoryChip entry={form} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{form.name || 'ชื่อหมวด'}</p>
              {form.nameEn && <p className="truncate text-[11px] text-slate-500">{form.nameEn}</p>}
            </div>
          </div>
          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold ${color.badgeBg} ${color.badgeText} ${color.border}`}>{form.name || 'ป้ายหมวด'}</span>
          {form.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="" className="h-32 w-full rounded-xl object-cover" />
          )}
          {form.description && <p className="text-xs text-slate-600">{form.description}</p>}
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
      <FormSection title="ชื่อ & คำอธิบาย">
        <Field label="ชื่อ (ไทย):" htmlFor="cat-name" hint="ไม่ใส่ emoji">
          <input id="cat-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ชื่อ (อังกฤษ):" htmlFor="cat-name-en">
          <input id="cat-name-en" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำอธิบาย:" htmlFor="cat-description" wide>
          <textarea id="cat-description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className={fieldInputClass} />
        </Field>
        {collection === 'communityCategories' && (
          <Field label="อารมณ์หลัก:" htmlFor="cat-parent">
            <select id="cat-parent" value={form.parentId} onChange={(e) => set('parentId', e.target.value)} className={fieldInputClass}>
              {moods.map((mood) => <option key={mood.id} value={mood.id}>{mood.name}</option>)}
            </select>
          </Field>
        )}
        {collection !== 'communityMoods' && collection !== 'questCategories' && (
          <Field label="คำค้นสำหรับจัดหมวดอัตโนมัติ (คั่นด้วย ,):" htmlFor="cat-keywords" wide hint="ใช้จับคู่กิจกรรม/สถานที่เข้าหมวดนี้">
            <textarea id="cat-keywords" rows={2} value={form.keywords} onChange={(e) => set('keywords', e.target.value)} className={fieldInputClass} />
          </Field>
        )}
      </FormSection>

      <FormSection title="ไอคอน & สี">
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">ไอคอน:</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ไอคอน">
            {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={form.iconKey === key}
                aria-label={key}
                onClick={() => set('iconKey', key)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${form.iconKey === key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">สีประจำหมวด (ใช้กับ badge และไอคอนเท่านั้น):</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="สี">
            {COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={form.colorKey === key}
                onClick={() => set('colorKey', key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${form.colorKey === key ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-600'}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: COLOR_PRESETS[key].swatch }} />
                {COLOR_PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection title="รูปภาพ" hint="รูปปกของหมวด (ไม่บังคับ)">
        <div className="sm:col-span-2">
          <ImageField id="cat-image" value={form.image} onChange={(url) => set('image', url)} folder="master" />
        </div>
      </FormSection>
    </AdminDrawer>
  );
}

export function TaxonomyManagerView() {
  const admin = useMasterAdmin();
  const [tab, setTab] = useState<CategoryCollection>('spotVibes');
  const [editing, setEditing] = useState<MasterCategory | null | undefined>(undefined);
  const list = admin.data ? [...(admin.data[tab] as MasterCategory[])].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const moods = admin.data?.communityMoods ?? [];
  const canAdd = admin.canEdit && !FIXED_COLLECTIONS.includes(tab);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={FolderTree}
        title="หมวดหมู่ & แท็ก"
        description="หมวดหมู่หลักของทุกเสาที่ทั้งระบบใช้ร่วมกัน แก้ชื่อ ไอคอน สี รูป ลำดับ และเปิด/ปิดใช้งานได้"
        actions={canAdd && (
          <button type="button" onClick={() => setEditing(null)} className={adminButton.primary}>
            <Plus size={14} /> เพิ่มหมวด
          </button>
        )}
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLLECTIONS.map((collection) => (
          <button
            key={collection}
            type="button"
            onClick={() => setTab(collection)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${tab === collection ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {COLLECTION_LABELS[collection]} {admin.data && <span className="opacity-70">{(admin.data[collection] as MasterCategory[]).length}</span>}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{COLLECTION_HINTS[tab]}</p>

      <MasterNotices admin={admin} />

      {!admin.data ? (
        <div className="space-y-1">{[1, 2, 3, 4].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <MasterList
          collection={tab}
          admin={admin}
          onEdit={(entry) => setEditing(entry as MasterCategory)}
          rows={list.map((entry) => ({
            entry,
            title: entry.name,
            subtitle: [
              entry.nameEn,
              entry.parentId && `อารมณ์: ${moods.find((m) => m.id === entry.parentId)?.name ?? entry.parentId}`,
              entry.keywords.length ? `คำค้น ${entry.keywords.length} คำ` : null,
              entry.image ? 'มีรูปปก' : null,
            ].filter(Boolean).join(' · '),
            leading: <CategoryChip entry={entry} />,
          }))}
        />
      )}

      {editing !== undefined && (
        <CategoryEditor
          key={editing?.id ?? 'new'}
          collection={tab}
          entry={editing}
          moods={moods}
          isSaving={admin.busy?.startsWith('save:') ?? false}
          onClose={() => setEditing(undefined)}
          onSave={async (form) => {
            const ok = await admin.save(tab, form, form.name);
            if (ok) setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
