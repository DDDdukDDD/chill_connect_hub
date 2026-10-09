'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { EventGrid } from '@/components/EventGrid';
import { RichTextEditor } from '@/components/RichTextEditor';
import { MASTER_COMMUNITY_MOODS } from '@/data/masterHub';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import type { EventItem } from '@/data/mockData';
import type { AdminEventItem } from '@/lib/eventsStore';
import { checkEventQuality } from '@/lib/contentQuality';
import { isEventEnded } from '@/lib/dateUtils';
import { AdminDrawer, Field, FormSection, InertPreview, PREVIEW_PLACEHOLDER_IMAGE, PreviewModeToggle, QualityPanel, fieldInputClass } from './AdminDrawer';
import { AdminStatus, AdminStatusChip, adminButton } from './AdminUI';
import { handleAdminUnauthorized } from './adminAuthUtils';

const VENUE_OPTIONS = [
  { id: '', label: 'ไม่ระบุ' },
  { id: 'qsncc', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)' },
  { id: 'bitec', label: 'ไบเทค บางนา (BITEC)' },
  { id: 'impact', label: 'อิมแพ็ค เมืองทองธานี (IMPACT)' },
  { id: 'marathon', label: 'งานวิ่ง / มาราธอน' },
  { id: 'park', label: 'สวนสาธารณะ / พื้นที่เปิด' },
] as const;

interface EventForm {
  title: string;
  category: EventItem['category'];
  tag: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  province: string;
  location: string;
  meetingPoint: string;
  locationType: 'physical' | 'online';
  onlinePlatform: string;
  onlineJoinUrl: string;
  maxParticipants: string;
  hostName: string;
  venueTag: string;
  price: string;
  image: string;
  officialUrl: string;
}

function toForm(event: AdminEventItem | null, isCommunity: boolean): EventForm {
  return {
    title: event?.title ?? '',
    category: event?.category ?? 'chill',
    tag: event?.tag ?? '',
    description: event?.description ?? '',
    date: event?.date ?? '',
    endDate: event?.endDate ?? '',
    time: event?.time ?? '',
    province: event?.province ?? 'กรุงเทพฯ',
    location: event?.location ?? '',
    meetingPoint: event?.meetingPoint ?? '',
    locationType: event?.locationType === 'online' ? 'online' : 'physical',
    onlinePlatform: event?.onlinePlatform ?? '',
    onlineJoinUrl: event?.onlineJoinUrl ?? '',
    maxParticipants: String(event?.maxParticipants ?? (isCommunity ? 10 : 500)),
    hostName: event?.hostName ?? '',
    venueTag: event?.venueTag ?? '',
    price: event?.price ?? '',
    image: event?.image ?? '',
    officialUrl: event?.externalUrl || event?.sourceUrl || event?.link || '',
  };
}

function toEventFields(form: EventForm, isCommunity: boolean): Partial<AdminEventItem> {
  const officialUrl = form.officialUrl.trim();
  const common: Partial<AdminEventItem> = {
    title: form.title.trim(),
    category: form.category,
    tag: form.tag.trim() || MASTER_COMMUNITY_MOODS.find((mood) => mood.id === form.category)?.label || '',
    description: form.description,
    date: form.date.trim(),
    endDate: form.endDate.trim() || undefined,
    time: form.time.trim(),
    province: form.province,
    location: form.location.trim(),
    hostName: form.hostName.trim(),
    price: form.price.trim() || undefined,
    image: form.image.trim(),
  };
  if (isCommunity) {
    return {
      ...common,
      eventType: 'community',
      meetingPoint: form.meetingPoint.trim() || undefined,
      locationType: form.locationType,
      onlinePlatform: form.locationType === 'online' ? form.onlinePlatform.trim() || undefined : undefined,
      onlineJoinUrl: form.locationType === 'online' ? form.onlineJoinUrl.trim() || undefined : undefined,
      maxParticipants: Number(form.maxParticipants),
    };
  }
  return {
    ...common,
    eventType: 'public_venue',
    venueTag: (form.venueTag || undefined) as AdminEventItem['venueTag'],
    externalUrl: officialUrl || undefined,
    sourceUrl: officialUrl || undefined,
    link: officialUrl || undefined,
  };
}

export function eventStatus(event: AdminEventItem): AdminStatus {
  if (event.approvalStatus === 'pending') return 'pending';
  if (event.approvalStatus === 'rejected') return 'rejected';
  return isEventEnded(event) ? 'ended' : 'published';
}

const noop = () => {};

interface EventEditorDrawerProps {
  /** null = create */
  event: AdminEventItem | null;
  type: 'community' | 'fairs';
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function EventEditorDrawer({ event, type, onClose, onSaved }: EventEditorDrawerProps) {
  const isCommunity = type === 'community';
  const isNew = event === null;
  const [form, setForm] = useState<EventForm>(() => toForm(event, isCommunity));
  const [previewMode, setPreviewMode] = useState<'card' | 'list'>('card');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fixed once per drawer so the preview stays pure across renders
  const [openedAt] = useState(() => Date.now());

  const set = <K extends keyof EventForm>(key: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  const fields = useMemo(() => toEventFields(form, isCommunity), [form, isCommunity]);
  const previewEvent = useMemo(() => ({
    ...(event ?? {
      id: 'preview',
      participantsCount: isCommunity ? 1 : 0,
      createdAtTimestamp: openedAt,
      approvalStatus: 'pending',
      status: 'recruiting',
    }),
    ...fields,
  }) as AdminEventItem, [event, fields, isCommunity, openedAt]);
  const quality = useMemo(() => checkEventQuality(previewEvent), [previewEvent]);
  const cardEvent = useMemo(() => (previewEvent.image ? previewEvent : { ...previewEvent, image: PREVIEW_PLACEHOLDER_IMAGE }), [previewEvent]);

  const save = async (approvalStatus?: 'approved' | 'pending') => {
    setIsSaving(true);
    setError(null);
    try {
      const body = isNew
        ? { action: 'create', eventData: { ...fields, approvalStatus: approvalStatus ?? 'pending' } }
        : { action: 'update_fields', id: event!.id, updatedFields: fields };
      const res = await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'บันทึกไม่สำเร็จ');
      onSaved(isNew
        ? `สร้าง "${fields.title}" ${approvalStatus === 'approved' ? 'และเผยแพร่แล้ว' : 'ไว้ในคิวตรวจแล้ว'}`
        : `บันทึก "${fields.title}" แล้ว`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const pillarLabel = isCommunity ? 'กิจกรรมคอมมูนิตี้' : 'งานมหกรรม & เอ็กซ์โป';
  const isRecurring = event?.scheduleType === 'recurring' || Boolean(event?.recurrence);

  return (
    <AdminDrawer
      title={isNew ? `สร้าง${pillarLabel}` : form.title || `แก้ไข${pillarLabel}`}
      subtitle={
        <span className="inline-flex items-center gap-2 flex-wrap">
          {!isNew && <AdminStatusChip status={eventStatus(event!)} />}
          {event?.source && <span>แหล่งที่มา: {event.source}</span>}
          {!isNew && <span className="text-slate-400">id: {event!.id}</span>}
        </span>
      }
      onClose={onClose}
      preview={
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">ตัวอย่างบนหน้าเว็บ</p>
              <PreviewModeToggle mode={previewMode} onChange={setPreviewMode} />
            </div>
            {/* EventGrid lays out 4+ columns; the preview shows one card at real card width */}
            <InertPreview className={previewMode === 'card' ? 'max-w-[300px] [&_.grid]:!grid-cols-1' : '[&_.grid]:!grid-cols-1'}>
              <EventGrid
                events={[cardEvent]}
                onSelectEvent={noop}
                favorites={[]}
                toggleFavorite={noop}
                viewMode={previewMode === 'card' ? 'grid' : 'list'}
                columns={4}
              />
            </InertPreview>
          </div>
          <QualityPanel report={quality} />
        </>
      }
      footer={
        <>
          {error && <p role="alert" className="mr-auto text-xs font-semibold text-rose-600">{error}</p>}
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          {isNew ? (
            <>
              <button type="button" disabled={isSaving} onClick={() => save('pending')} className={adminButton.dark}>บันทึกเข้าคิวตรวจ</button>
              <button type="button" disabled={isSaving || quality.requiredFailures > 0} onClick={() => save('approved')} className={adminButton.primary}
                title={quality.requiredFailures > 0 ? 'แก้ข้อบังคับให้ครบก่อนเผยแพร่' : undefined}>
                {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึกและเผยแพร่
              </button>
            </>
          ) : (
            <button type="button" disabled={isSaving} onClick={() => save()} className={adminButton.primary}>
              {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
            </button>
          )}
        </>
      }
    >
      <FormSection title="ข้อมูลหลัก">
        <Field label="ชื่อกิจกรรม:" htmlFor="event-title" wide hint="อย่างน้อย 5 ตัวอักษร ไม่ใส่ emoji">
          <input id="event-title" value={form.title} onChange={set('title')} className={fieldInputClass} />
        </Field>
        <Field label="หมวด:" htmlFor="event-category">
          <select id="event-category" value={form.category} onChange={set('category')} className={fieldInputClass}>
            {MASTER_COMMUNITY_MOODS.map((mood) => <option key={mood.id} value={mood.id}>{mood.label}</option>)}
          </select>
        </Field>
        <Field label="ป้ายหมวดที่แสดง:" htmlFor="event-tag" hint="เว้นว่างได้ ระบบใช้ชื่อหมวด">
          <input id="event-tag" value={form.tag} onChange={set('tag')} className={fieldInputClass} />
        </Field>
        <Field label={isCommunity ? 'ผู้จัด (โฮสต์):' : 'ผู้จัดอย่างเป็นทางการ:'} htmlFor="event-host" wide
          hint={isCommunity ? undefined : 'บังคับสำหรับงานแฟร์ เช่น สมาคมผู้จัดพิมพ์ฯ (PUBAT)'}>
          <input id="event-host" value={form.hostName} onChange={set('hostName')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="วันและเวลา" hint={isRecurring ? 'กิจกรรมนี้จัดประจำ: ตารางนัดประจำแก้จากหน้าเว็บของผู้จัด' : undefined}>
        <Field label="วันเริ่ม:" htmlFor="event-date" hint='รูปแบบ "12 ต.ค. 2026"'>
          <input id="event-date" value={form.date} onChange={set('date')} className={fieldInputClass} />
        </Field>
        <Field label="วันสิ้นสุด:" htmlFor="event-end-date" hint={isCommunity ? 'เว้นว่างได้ถ้าจบในวันเดียว' : 'บังคับสำหรับงานแฟร์'}>
          <input id="event-end-date" value={form.endDate} onChange={set('endDate')} className={fieldInputClass} />
        </Field>
        <Field label="เวลา:" htmlFor="event-time" wide hint='เช่น "07:00 - 09:30 น."'>
          <input id="event-time" value={form.time} onChange={set('time')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="สถานที่">
        {isCommunity && (
          <Field label="รูปแบบ:" htmlFor="event-location-type">
            <select id="event-location-type" value={form.locationType} onChange={set('locationType')} className={fieldInputClass}>
              <option value="physical">สถานที่จริง</option>
              <option value="online">ออนไลน์</option>
            </select>
          </Field>
        )}
        <Field label="จังหวัด:" htmlFor="event-province">
          <select id="event-province" value={form.province} onChange={set('province')} className={fieldInputClass}>
            {[...new Set([form.province, 'ออนไลน์', ...ALL_THAI_PROVINCES])].filter(Boolean).map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </Field>
        <Field label="ชื่อสถานที่:" htmlFor="event-location" wide hint={isCommunity ? undefined : 'ใช้ชื่อมาตรฐาน เช่น ไบเทค บางนา (BITEC)'}>
          <input id="event-location" value={form.location} onChange={set('location')} className={fieldInputClass} />
        </Field>
        {isCommunity ? (
          form.locationType === 'online' ? (
            <>
              <Field label="แพลตฟอร์ม:" htmlFor="event-platform" hint="zoom, google_meet, discord, teams">
                <input id="event-platform" value={form.onlinePlatform} onChange={set('onlinePlatform')} className={fieldInputClass} />
              </Field>
              <Field label="ลิงก์ห้องประชุม:" htmlFor="event-join-url">
                <input id="event-join-url" value={form.onlineJoinUrl} onChange={set('onlineJoinUrl')} placeholder="https://..." className={fieldInputClass} />
              </Field>
            </>
          ) : (
            <Field label="จุดนัดพบ:" htmlFor="event-meeting-point" wide hint="จุดที่หาเจอง่าย เช่น หน้าเคาน์เตอร์ Slow Bar">
              <input id="event-meeting-point" value={form.meetingPoint} onChange={set('meetingPoint')} className={fieldInputClass} />
            </Field>
          )
        ) : (
          <Field label="ศูนย์จัดงาน:" htmlFor="event-venue">
            <select id="event-venue" value={form.venueTag} onChange={set('venueTag')} className={fieldInputClass}>
              {VENUE_OPTIONS.map((venue) => <option key={venue.id} value={venue.id}>{venue.label}</option>)}
            </select>
          </Field>
        )}
      </FormSection>

      <FormSection title={isCommunity ? 'ผู้เข้าร่วม & ราคา' : 'บัตร & ลิงก์'}>
        {isCommunity && (
          <Field label="รับสูงสุด (คน):" htmlFor="event-max" hint="2-15 คน" error={Number(form.maxParticipants) < 2 || Number(form.maxParticipants) > 15 ? 'ต้องอยู่ระหว่าง 2-15 คน' : null}>
            <input id="event-max" type="number" min={2} max={15} value={form.maxParticipants} onChange={set('maxParticipants')} className={fieldInputClass} />
          </Field>
        )}
        <Field label="ราคา:" htmlFor="event-price" hint='เช่น "เข้าชมฟรี (Walk-in)" หรือ "บัตรราคา 150 บาท"'>
          <input id="event-price" value={form.price} onChange={set('price')} className={fieldInputClass} />
        </Field>
        {!isCommunity && (
          <Field label="ลิงก์หน้างานทางการ:" htmlFor="event-url" wide hint="หน้างานนี้โดยตรง ไม่ใช่หน้ารวมของศูนย์จัดงาน">
            <div className="flex gap-2">
              <input id="event-url" value={form.officialUrl} onChange={set('officialUrl')} placeholder="https://..." className={fieldInputClass} />
              {form.officialUrl && (
                <a href={form.officialUrl} target="_blank" rel="noopener noreferrer" className={adminButton.icon} title="เปิดลิงก์">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </Field>
        )}
      </FormSection>

      <FormSection title="รูป & รายละเอียด">
        <Field label="รูปหลัก (URL):" htmlFor="event-image" wide>
          <input id="event-image" value={form.image} onChange={set('image')} placeholder="https://..." className={fieldInputClass} />
        </Field>
        <div className="sm:col-span-2">
          <p className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5">รายละเอียด (อย่างน้อย 15 ตัวอักษร):</p>
          <RichTextEditor value={form.description} onChange={(html) => setForm((current) => ({ ...current, description: html }))} minHeight="160px" />
        </div>
      </FormSection>
    </AdminDrawer>
  );
}
