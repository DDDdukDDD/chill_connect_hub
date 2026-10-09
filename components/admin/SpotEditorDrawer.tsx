'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, Loader2, MapPin } from 'lucide-react';
import { SpotCard } from '@/components/SpotCard';
import { SpotListItem } from '@/components/SpotListItem';
import { ALL_THAI_PROVINCES, LifestyleSpotItem } from '@/data/spotsData';
import { checkSpotQuality, isThaiCoordinate } from '@/lib/contentQuality';
import { coordinatesMapUrl, defaultSpotCategoryLabel, SPOT_CATEGORY_OPTIONS } from '@/lib/spotCategories';
import { AdminDrawer, Field, FormSection, InertPreview, PREVIEW_PLACEHOLDER_IMAGE, PreviewModeToggle, QualityPanel, fieldInputClass } from './AdminDrawer';
import { AdminStatusChip, adminButton } from './AdminUI';
import { handleAdminUnauthorized } from './adminAuthUtils';

/** Text form of a spot: lists are edited one item per line */
interface SpotForm {
  title: string;
  category: LifestyleSpotItem['category'];
  categoryLabel: string;
  province: string;
  district: string;
  latitude: string;
  longitude: string;
  openHours: string;
  price: string;
  entryFee: string;
  bestTime: string;
  image: string;
  galleryImages: string;
  description: string;
  highlights: string;
  vibeTags: string;
  facilities: string;
  transitInfo: string;
  phone: string;
  website: string;
  facebook: string;
  googleMapsUrl: string;
}

const lines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);

function toForm(spot: LifestyleSpotItem | null): SpotForm {
  return {
    title: spot?.title ?? '',
    category: spot?.category ?? 'nature',
    categoryLabel: spot?.categoryLabel ?? defaultSpotCategoryLabel(spot?.category ?? 'nature'),
    province: spot?.province ?? 'กรุงเทพฯ',
    district: spot?.district ?? '',
    latitude: spot ? String(spot.latitude) : '',
    longitude: spot ? String(spot.longitude) : '',
    openHours: spot?.openHours ?? '',
    price: spot?.price ?? '',
    entryFee: spot?.entryFee ?? '',
    bestTime: spot?.bestTime ?? '',
    image: spot?.image ?? '',
    galleryImages: (spot?.galleryImages ?? []).filter((img) => img !== spot?.image).join('\n'),
    description: spot?.description ?? '',
    highlights: (spot?.highlights ?? []).join('\n'),
    vibeTags: (spot?.vibeTags ?? []).join('\n'),
    facilities: (spot?.facilities ?? []).join('\n'),
    transitInfo: spot?.transitInfo ?? '',
    phone: spot?.contact?.phone ?? '',
    website: spot?.contact?.website ?? '',
    facebook: spot?.contact?.facebook ?? '',
    googleMapsUrl: spot?.googleMapsUrl ?? '',
  };
}

function toSpotFields(form: SpotForm): Partial<LifestyleSpotItem> {
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const contact = { phone: form.phone.trim(), website: form.website.trim(), facebook: form.facebook.trim() };
  const hasContact = Object.values(contact).some(Boolean);
  const image = form.image.trim();
  return {
    title: form.title.trim(),
    category: form.category,
    categoryLabel: form.categoryLabel.trim() || defaultSpotCategoryLabel(form.category),
    province: form.province,
    district: form.district.trim(),
    latitude,
    longitude,
    openHours: form.openHours.trim(),
    price: form.price.trim(),
    entryFee: form.entryFee.trim() || undefined,
    bestTime: form.bestTime.trim(),
    image,
    galleryImages: image ? [image, ...lines(form.galleryImages)] : lines(form.galleryImages),
    description: form.description.trim(),
    highlights: lines(form.highlights),
    vibeTags: lines(form.vibeTags),
    facilities: lines(form.facilities),
    transitInfo: form.transitInfo.trim() || undefined,
    contact: hasContact ? Object.fromEntries(Object.entries(contact).filter(([, v]) => v)) : undefined,
    googleMapsUrl: form.googleMapsUrl.trim() || (isThaiCoordinate(latitude, longitude) ? coordinatesMapUrl(latitude, longitude) : ''),
  };
}

const noop = () => {};

interface SpotEditorDrawerProps {
  /** null = create a new spot */
  spot: LifestyleSpotItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function SpotEditorDrawer({ spot, onClose, onSaved }: SpotEditorDrawerProps) {
  const [form, setForm] = useState<SpotForm>(() => toForm(spot));
  const [previewMode, setPreviewMode] = useState<'card' | 'list'>('card');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = spot === null;
  const isImported = Boolean(spot?.sourceUrl);

  const set = <K extends keyof SpotForm>(key: K) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const fields = useMemo(() => toSpotFields(form), [form]);
  const previewSpot = useMemo<LifestyleSpotItem>(() => ({
    ...(spot ?? { id: 'preview', rating: 0, reviewsCount: 0, publicationStatus: 'draft' }),
    ...fields,
  } as LifestyleSpotItem), [spot, fields]);
  // Quality is checked on the real data; only the rendered card gets a placeholder photo
  const quality = useMemo(() => checkSpotQuality(previewSpot), [previewSpot]);
  const cardSpot = useMemo(() => (previewSpot.image ? previewSpot : { ...previewSpot, image: PREVIEW_PLACEHOLDER_IMAGE }), [previewSpot]);
  const coordinatesOk = isThaiCoordinate(Number(form.latitude), Number(form.longitude));

  const save = async (publicationStatus?: 'draft' | 'published') => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = { ...fields, ...(publicationStatus && { publicationStatus }) };
      const body = isNew
        ? { action: 'create', newSpot: { ...payload, publicationStatus: publicationStatus ?? 'draft' } }
        : { action: 'update', spotId: spot!.id, updatedFields: payload };
      const res = await fetch('/api/admin/spots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      onSaved(isNew
        ? `สร้าง "${payload.title}" ${publicationStatus === 'published' ? 'และเผยแพร่แล้ว' : 'เป็นแบบร่างแล้ว'}`
        : `บันทึก "${payload.title}" แล้ว`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const isDraft = (spot?.publicationStatus ?? 'draft') === 'draft';

  return (
    <AdminDrawer
      title={isNew ? 'เพิ่มสถานที่' : form.title || 'แก้ไขสถานที่'}
      subtitle={
        <span className="inline-flex items-center gap-2 flex-wrap">
          {!isNew && <AdminStatusChip status={isDraft ? 'draft' : 'published'} />}
          {isImported && <span>ข้อมูลจาก {spot!.sourceName}</span>}
          {!isNew && <span className="text-slate-400">id: {spot!.id}</span>}
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
            <InertPreview className={previewMode === 'card' ? 'max-w-[280px]' : ''}>
              {previewMode === 'card'
                ? <SpotCard spot={cardSpot} isFavorite={false} onToggleFavorite={noop} />
                : <SpotListItem spot={cardSpot} isFavorite={false} onToggleFavorite={noop} />}
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
              <button type="button" disabled={isSaving} onClick={() => save('draft')} className={adminButton.dark}>บันทึกเป็นร่าง</button>
              <button type="button" disabled={isSaving || quality.requiredFailures > 0} onClick={() => save('published')} className={adminButton.primary}
                title={quality.requiredFailures > 0 ? 'แก้ข้อบังคับให้ครบก่อนเผยแพร่' : undefined}>
                {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึกและเผยแพร่
              </button>
            </>
          ) : (
            <>
              {isDraft ? (
                <button type="button" disabled={isSaving || quality.requiredFailures > 0} onClick={() => save('published')} className={adminButton.dark}
                  title={quality.requiredFailures > 0 ? 'แก้ข้อบังคับให้ครบก่อนเผยแพร่' : undefined}>บันทึกและเผยแพร่</button>
              ) : (
                <button type="button" disabled={isSaving} onClick={() => save('draft')} className={adminButton.secondary}>บันทึกและซ่อนเป็นร่าง</button>
              )}
              <button type="button" disabled={isSaving} onClick={() => save()} className={adminButton.primary}>
                {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
              </button>
            </>
          )}
        </>
      }
    >
      <FormSection title="ข้อมูลหลัก" hint="ชื่อและหมวดที่แสดงบนการ์ด">
        <Field label="ชื่อสถานที่:" htmlFor="spot-title" wide hint="อย่างน้อย 5 ตัวอักษร ไม่ใส่ emoji">
          <input id="spot-title" value={form.title} onChange={set('title')} className={fieldInputClass} />
        </Field>
        <Field label="หมวด:" htmlFor="spot-category">
          <select
            id="spot-category"
            value={form.category}
            onChange={(event) => {
              const category = event.target.value as LifestyleSpotItem['category'];
              setForm((current) => ({
                ...current,
                category,
                // Follow the category unless the label was customised
                categoryLabel: current.categoryLabel === defaultSpotCategoryLabel(current.category) ? defaultSpotCategoryLabel(category) : current.categoryLabel,
              }));
            }}
            className={fieldInputClass}
          >
            {SPOT_CATEGORY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="ป้ายหมวดที่แสดง:" htmlFor="spot-category-label" hint="ภาษาไทย เช่น ห้างสรรพสินค้า & ไลฟ์สไตล์มอลล์">
          <input id="spot-category-label" value={form.categoryLabel} onChange={set('categoryLabel')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="ที่ตั้ง" hint="พิกัดใช้กับแผนที่และการค้นหาร้านรอบย่าน">
        <Field label="จังหวัด:" htmlFor="spot-province">
          <select id="spot-province" value={form.province} onChange={set('province')} className={fieldInputClass}>
            {/* Keep a stored value that is not in the list (e.g. an imported spelling) selectable */}
            {[...new Set([form.province, ...ALL_THAI_PROVINCES])].filter(Boolean).map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </Field>
        <Field label="อำเภอ / เขต:" htmlFor="spot-district" hint='ไม่ต้องใส่ "อำเภอ" หรือ "เขต" นำหน้า'>
          <input id="spot-district" value={form.district} onChange={set('district')} className={fieldInputClass} />
        </Field>
        <Field label="ละติจูด:" htmlFor="spot-lat" error={form.latitude && !coordinatesOk ? 'พิกัดไม่อยู่ในประเทศไทย' : null}>
          <input id="spot-lat" inputMode="decimal" value={form.latitude} onChange={set('latitude')} placeholder="13.7563" className={fieldInputClass} />
        </Field>
        <Field label="ลองจิจูด:" htmlFor="spot-lng">
          <input id="spot-lng" inputMode="decimal" value={form.longitude} onChange={set('longitude')} placeholder="100.5018" className={fieldInputClass} />
        </Field>
        {coordinatesOk && (
          <a
            href={coordinatesMapUrl(Number(form.latitude), Number(form.longitude))}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:col-span-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            <MapPin size={12} /> ตรวจตำแหน่งบน Google Maps <ExternalLink size={11} />
          </a>
        )}
        <Field label="การเดินทาง:" htmlFor="spot-transit" wide hint="เช่น BTS ชิดลม ทางออก 5, มีที่จอดรถ">
          <input id="spot-transit" value={form.transitInfo} onChange={set('transitInfo')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="เวลาเปิด & ค่าเข้า">
        <Field label="เวลาเปิดให้บริการ:" htmlFor="spot-hours" wide hint="บังคับ เช่น เปิดทุกวัน 08:30 - 17:00 น. / ปิดวันจันทร์">
          <input id="spot-hours" value={form.openHours} onChange={set('openHours')} className={fieldInputClass} />
        </Field>
        <Field label="ราคาบนการ์ด:" htmlFor="spot-price" hint='เช่น เข้าชมฟรี, ฿50 - ฿100, ไม่ระบุ'>
          <input id="spot-price" value={form.price} onChange={set('price')} className={fieldInputClass} />
        </Field>
        <Field label="ช่วงเวลาที่เหมาะ:" htmlFor="spot-best-time">
          <input id="spot-best-time" value={form.bestTime} onChange={set('bestTime')} className={fieldInputClass} />
        </Field>
        <Field label="ค่าเข้าแบบละเอียด:" htmlFor="spot-entry-fee" wide hint="แสดงในหน้ารายละเอียด เช่น คนไทย 40 บาท · ต่างชาติ 200 บาท">
          <input id="spot-entry-fee" value={form.entryFee} onChange={set('entryFee')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="รูปภาพ" hint="ใช้รูปของสถานที่นี้จริงเท่านั้น">
        <Field label="รูปหลัก (URL):" htmlFor="spot-image" wide>
          <input id="spot-image" value={form.image} onChange={set('image')} placeholder="https://..." className={fieldInputClass} />
        </Field>
        <Field label="รูปเพิ่มเติม (บรรทัดละ 1 URL):" htmlFor="spot-gallery" wide hint="หน้ารายละเอียดแสดงเป็นภาพ mosaic สูงสุด 5 รูป">
          <textarea id="spot-gallery" rows={3} value={form.galleryImages} onChange={set('galleryImages')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="เนื้อหา">
        <Field label="คำอธิบาย:" htmlFor="spot-description" wide hint={`อย่างน้อย 15 ตัวอักษร · ตอนนี้ ${form.description.trim().length} ตัว`}>
          <textarea id="spot-description" rows={5} value={form.description} onChange={set('description')} className={fieldInputClass} />
        </Field>
        <Field label="จุดเด่น (บรรทัดละ 1 ข้อ):" htmlFor="spot-highlights" hint="2-3 ข้อ แสดงใน “จุดเด่น & ไฮไลต์”">
          <textarea id="spot-highlights" rows={3} value={form.highlights} onChange={set('highlights')} className={fieldInputClass} />
        </Field>
        <Field label="แท็ก vibe (บรรทัดละ 1 แท็ก):" htmlFor="spot-tags" hint="ภาษาไทยสั้นๆ ไม่ใส่ emoji">
          <textarea id="spot-tags" rows={3} value={form.vibeTags} onChange={set('vibeTags')} className={fieldInputClass} />
        </Field>
        <Field label="สิ่งอำนวยความสะดวก (บรรทัดละ 1 อย่าง):" htmlFor="spot-facilities" wide>
          <textarea id="spot-facilities" rows={2} value={form.facilities} onChange={set('facilities')} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="ช่องทางติดต่อ">
        <Field label="โทรศัพท์:" htmlFor="spot-phone">
          <input id="spot-phone" value={form.phone} onChange={set('phone')} className={fieldInputClass} />
        </Field>
        <Field label="เว็บไซต์:" htmlFor="spot-website">
          <input id="spot-website" value={form.website} onChange={set('website')} placeholder="https://..." className={fieldInputClass} />
        </Field>
        <Field label="Facebook:" htmlFor="spot-facebook">
          <input id="spot-facebook" value={form.facebook} onChange={set('facebook')} placeholder="https://facebook.com/..." className={fieldInputClass} />
        </Field>
        <Field label="ลิงก์ Google Maps:" htmlFor="spot-maps" hint="เว้นว่างได้ ระบบสร้างจากพิกัดให้">
          <input id="spot-maps" value={form.googleMapsUrl} onChange={set('googleMapsUrl')} className={fieldInputClass} />
        </Field>
      </FormSection>

      {isImported && (
        <FormSection title="แหล่งที่มา" hint="ข้อมูลที่ดึงมาต้องแสดงเครดิตแหล่งที่มาเสมอ">
          <Field label="ชื่อแหล่งข้อมูล:" htmlFor="spot-source-name">
            <input id="spot-source-name" value={spot!.sourceName ?? ''} disabled className={fieldInputClass} />
          </Field>
          <Field label="ลิงก์ต้นทาง:" htmlFor="spot-source-url">
            <a id="spot-source-url" href={spot!.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline break-all">
              เปิดหน้าต้นทาง <ExternalLink size={12} />
            </a>
          </Field>
        </FormSection>
      )}
    </AdminDrawer>
  );
}
