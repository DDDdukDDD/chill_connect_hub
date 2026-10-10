'use client';

import React, { useState } from 'react';
import { Building2, ExternalLink, Loader2, Plus } from 'lucide-react';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { MasterVenue, VENUE_TAGS } from '@/lib/masterData';
import { coordinatesMapUrl } from '@/lib/spotCategories';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ImageField, MasterList, MasterNotices, useMasterAdmin } from './masterAdmin';

const VENUE_TAG_LABELS: Record<MasterVenue['venueTag'], string> = {
  qsncc: 'QSNCC',
  bitec: 'BITEC',
  impact: 'IMPACT',
  marathon: 'งานวิ่ง / มาราธอน',
  park: 'สวน / พื้นที่สาธารณะอื่น',
};

type VenueForm = { id?: string; name: string; venueTag: MasterVenue['venueTag']; province: string; location: string; transitHint: string; latitude: string; longitude: string; website: string; image: string };

function VenueEditor({ entry, onClose, onSave, isSaving }: { entry: MasterVenue | null; onClose: () => void; onSave: (form: VenueForm) => void; isSaving: boolean }) {
  const [form, setForm] = useState<VenueForm>({
    id: entry?.id,
    name: entry?.name ?? '',
    venueTag: entry?.venueTag ?? 'park',
    province: entry?.province ?? 'กรุงเทพฯ',
    location: entry?.location ?? '',
    transitHint: entry?.transitHint ?? '',
    latitude: entry?.latitude !== undefined ? String(entry.latitude) : '',
    longitude: entry?.longitude !== undefined ? String(entry.longitude) : '',
    website: entry?.website ?? '',
    image: entry?.image ?? '',
  });
  const set = <K extends keyof VenueForm>(key: K, value: VenueForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const hasCoordinates = form.latitude !== '' || form.longitude !== '';
  const coordinatesOk = isThaiCoordinate(Number(form.latitude), Number(form.longitude));

  return (
    <AdminDrawer
      title={entry ? 'แก้ไขสถานที่จัดงาน' : 'เพิ่มสถานที่จัดงาน'}
      subtitle={entry ? <span>id: {entry.id}{entry.builtIn ? ' · มากับระบบ' : ''}</span> : undefined}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          <button type="button" disabled={isSaving || (hasCoordinates && !coordinatesOk)} onClick={() => onSave(form)} className={adminButton.primary}>
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
          </button>
        </>
      }
    >
      <FormSection title="ข้อมูลสถานที่" hint="ชื่อมาตรฐานที่ใช้กับงานแฟร์และระบบจับคู่สถานที่">
        <Field label="ชื่อมาตรฐาน:" htmlFor="venue-name" wide hint="เช่น ไบเทค บางนา (BITEC)">
          <input id="venue-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ประเภท:" htmlFor="venue-tag">
          <select id="venue-tag" value={form.venueTag} onChange={(e) => set('venueTag', e.target.value as MasterVenue['venueTag'])} className={fieldInputClass}>
            {VENUE_TAGS.map((tag) => <option key={tag} value={tag}>{VENUE_TAG_LABELS[tag]}</option>)}
          </select>
        </Field>
        <Field label="จังหวัด:" htmlFor="venue-province">
          <select id="venue-province" value={form.province} onChange={(e) => set('province', e.target.value)} className={fieldInputClass}>
            {MASTER_77_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </Field>
        <Field label="ที่ตั้ง / อาคาร:" htmlFor="venue-location" wide>
          <input id="venue-location" value={form.location} onChange={(e) => set('location', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="การเดินทาง:" htmlFor="venue-transit" wide hint="เช่น MRT ศูนย์การประชุมแห่งชาติสิริกิติ์ ทางออก 3">
          <input id="venue-transit" value={form.transitHint} onChange={(e) => set('transitHint', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ละติจูด:" htmlFor="venue-lat" error={hasCoordinates && !coordinatesOk ? 'พิกัดไม่อยู่ในประเทศไทย' : null}>
          <input id="venue-lat" inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ลองจิจูด:" htmlFor="venue-lng">
          <input id="venue-lng" inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} className={fieldInputClass} />
        </Field>
        {coordinatesOk && (
          <a href={coordinatesMapUrl(Number(form.latitude), Number(form.longitude))} target="_blank" rel="noopener noreferrer" className="sm:col-span-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
            ตรวจตำแหน่งบน Google Maps <ExternalLink size={11} />
          </a>
        )}
        <Field label="เว็บไซต์ทางการ:" htmlFor="venue-website" wide>
          <input id="venue-website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." className={fieldInputClass} />
        </Field>
      </FormSection>
      <FormSection title="รูปภาพ">
        <div className="sm:col-span-2">
          <ImageField id="venue-image" value={form.image} onChange={(url) => set('image', url)} folder="venue" />
        </div>
      </FormSection>
    </AdminDrawer>
  );
}

export function VenuesManagerView() {
  const admin = useMasterAdmin();
  const [editing, setEditing] = useState<MasterVenue | null | undefined>(undefined);
  const venues = admin.data ? [...admin.data.venues].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Building2}
        title="สถานที่จัดงาน"
        description="ศูนย์ประชุม ฮอลล์ และพื้นที่สาธารณะที่ใช้บ่อย เป็นตัวเลือกในฟอร์มงานแฟร์และใช้จับคู่สถานที่ตอนดึงข้อมูล"
        actions={admin.canEdit && (
          <button type="button" onClick={() => setEditing(null)} className={adminButton.primary}>
            <Plus size={14} /> เพิ่มสถานที่
          </button>
        )}
      />
      <MasterNotices admin={admin} />
      {!admin.data ? (
        <div className="space-y-1">{[1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <MasterList
          collection="venues"
          admin={admin}
          onEdit={(entry) => setEditing(entry as MasterVenue)}
          rows={venues.map((venue) => ({
            entry: venue,
            title: venue.name,
            subtitle: [VENUE_TAG_LABELS[venue.venueTag], venue.province, venue.transitHint].filter(Boolean).join(' · '),
            leading: venue.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={venue.image} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
              : <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Building2 size={16} /></span>,
          }))}
        />
      )}
      {editing !== undefined && (
        <VenueEditor
          key={editing?.id ?? 'new'}
          entry={editing}
          isSaving={admin.busy?.startsWith('save:') ?? false}
          onClose={() => setEditing(undefined)}
          onSave={async (form) => { if (await admin.save('venues', form, form.name)) setEditing(undefined); }}
        />
      )}
    </div>
  );
}
