'use client';

import React, { useState } from 'react';
import { GalleryHorizontal, Loader2, Plus } from 'lucide-react';
import { COLLECTION_LABELS, FEATURED_GROUP_COLLECTIONS, MasterFeaturedGroup } from '@/lib/masterData';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ImageField, MasterList, MasterNotices, useMasterAdmin } from './masterAdmin';

type RailCollection = (typeof FEATURED_GROUP_COLLECTIONS)[number];

const RAIL_HINTS: Record<RailCollection, string> = {
  communityClubs: 'การ์ดรูปใน rail "ชมรมยอดนิยม" ของหน้าคอมมูนิตี้และหน้าแรก กดแล้วกรองกิจกรรมด้วยคำค้นของการ์ด',
  venueGroups: 'การ์ดรูปใน rail "สถานที่จัดงานยอดนิยม" ของหน้างานแฟร์ กดแล้วกรองงานด้วยคำค้นของการ์ด',
};

type GroupForm = { id?: string; name: string; nameEn: string; subtitle: string; image: string; badgeLabel: string; keywords: string };

/** Mirrors the public rail card: photo, gradient, English kicker, Thai name, subtitle, badge */
function RailCardPreview({ form }: { form: GroupForm }) {
  return (
    <div className="relative h-52 w-full max-w-[260px] overflow-hidden rounded-2xl bg-slate-200 shadow-2xs">
      {form.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      {form.badgeLabel && (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-slate-800">{form.badgeLabel}</span>
      )}
      <div className="absolute bottom-3 left-3 right-3 text-white">
        <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{form.nameEn || ' '}</p>
        <p className="text-sm font-black leading-tight">{form.name || 'ชื่อการ์ด'}</p>
        {form.subtitle && <p className="mt-0.5 line-clamp-1 text-[11px] opacity-90">{form.subtitle}</p>}
      </div>
    </div>
  );
}

function GroupEditor({ collection, entry, onClose, onSave, isSaving }: { collection: RailCollection; entry: MasterFeaturedGroup | null; onClose: () => void; onSave: (form: GroupForm) => void; isSaving: boolean }) {
  const [form, setForm] = useState<GroupForm>({
    id: entry?.id,
    name: entry?.name ?? '',
    nameEn: entry?.nameEn ?? '',
    subtitle: entry?.subtitle ?? '',
    image: entry?.image ?? '',
    badgeLabel: entry?.badgeLabel ?? '',
    keywords: (entry?.keywords ?? []).join(', '),
  });
  const set = <K extends keyof GroupForm>(key: K, value: GroupForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <AdminDrawer
      title={entry ? `แก้ไขการ์ด · ${COLLECTION_LABELS[collection]}` : `เพิ่มการ์ด · ${COLLECTION_LABELS[collection]}`}
      subtitle={entry ? <span>id: {entry.id}{entry.builtIn ? ' · มากับระบบ' : ''}</span> : 'id สร้างจากชื่อภาษาอังกฤษ'}
      onClose={onClose}
      preview={
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] sm:text-xs font-semibold text-slate-500">ตัวอย่างการ์ดบนหน้าเว็บ</p>
          <RailCardPreview form={form} />
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
      <FormSection title="ข้อความบนการ์ด">
        <Field label="ชื่อ (ไทย):" htmlFor="group-name" hint="ไม่ใส่ emoji">
          <input id="group-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ชื่อ (อังกฤษ):" htmlFor="group-name-en">
          <input id="group-name-en" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำโปรยใต้ชื่อ:" htmlFor="group-subtitle" wide hint="เช่น สวนเบญจกิติ • ลุมพินี • Pace 6.5-7.0">
          <input id="group-subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ป้ายบนการ์ด:" htmlFor="group-badge" hint="ไม่บังคับ เช่น Running Crew">
          <input id="group-badge" value={form.badgeLabel} onChange={(e) => set('badgeLabel', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำค้นสำหรับกรอง (คั่นด้วย ,):" htmlFor="group-keywords" wide hint="บังคับ กดการ์ดแล้วจะแสดงเนื้อหาที่มีคำเหล่านี้">
          <textarea id="group-keywords" rows={2} value={form.keywords} onChange={(e) => set('keywords', e.target.value)} className={fieldInputClass} />
        </Field>
      </FormSection>
      <FormSection title="รูปการ์ด" hint="รูปแนวตั้งหรือสี่เหลี่ยม สว่าง คมชัด">
        <div className="sm:col-span-2">
          <ImageField id="group-image" value={form.image} onChange={(url) => set('image', url)} folder="rail" />
        </div>
      </FormSection>
    </AdminDrawer>
  );
}

export function FeaturedRailsView() {
  const admin = useMasterAdmin();
  const [tab, setTab] = useState<RailCollection>('communityClubs');
  const [editing, setEditing] = useState<MasterFeaturedGroup | null | undefined>(undefined);
  const list = admin.data ? [...admin.data[tab]].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={GalleryHorizontal}
        title="การ์ดแนะนำ (rail)"
        description="การ์ดรูปที่หน้าเว็บใช้เป็นทางลัดของแต่ละเสา แก้ข้อความ รูป คำค้น ลำดับ และเปิด/ปิดได้ (จังหวัดยอดนิยมตั้งที่หน้า 77 จังหวัด)"
        actions={admin.canEdit && (
          <button type="button" onClick={() => setEditing(null)} className={adminButton.primary}>
            <Plus size={14} /> เพิ่มการ์ด
          </button>
        )}
      />
      <div className="flex flex-wrap gap-1.5">
        {FEATURED_GROUP_COLLECTIONS.map((collection) => (
          <button
            key={collection}
            type="button"
            onClick={() => setTab(collection)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${tab === collection ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {COLLECTION_LABELS[collection]} {admin.data && <span className="opacity-70">{admin.data[collection].length}</span>}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{RAIL_HINTS[tab]}</p>
      <MasterNotices admin={admin} />
      {!admin.data ? (
        <div className="space-y-1">{[1, 2, 3].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <MasterList
          collection={tab}
          admin={admin}
          onEdit={(entry) => setEditing(entry as MasterFeaturedGroup)}
          rows={list.map((group) => ({
            entry: group,
            title: group.name,
            subtitle: [group.nameEn, group.subtitle, `คำค้น ${group.keywords.length} คำ`].filter(Boolean).join(' · '),
            leading: group.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={group.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-400">ไม่มีรูป</span>,
          }))}
        />
      )}
      {editing !== undefined && (
        <GroupEditor
          key={editing?.id ?? 'new'}
          collection={tab}
          entry={editing}
          isSaving={admin.busy?.startsWith('save:') ?? false}
          onClose={() => setEditing(undefined)}
          onSave={async (form) => { if (await admin.save(tab, form, form.name)) setEditing(undefined); }}
        />
      )}
    </div>
  );
}
