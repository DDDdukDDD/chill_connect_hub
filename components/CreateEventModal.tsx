'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building, Calendar, Check, ChevronRight, Loader2, Lock, MapPin, Plus, Target, Trash2, Upload, Users } from 'lucide-react';
import { DayOfWeek, EventItem } from '@/data/mockData';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import { formatThaiDateBE, isValidTimeRange } from '@/lib/dateUtils';
import { compressImage } from '@/lib/media/compressor';
import { SPOT_CATEGORY_OPTIONS } from '@/lib/spotCategories';
import { useAuth } from '@/lib/useAuth';
import { useMemberSession } from '@/lib/useMemberSession';
import { activityActions } from '@/lib/useMyActivity';
import { DialogShell, dialogButton } from './auth/DialogShell';
import { useMasterData } from '@/lib/useMasterData';
import { LocationPinPicker, Pin } from './LocationPinPicker';
import { SUBMISSION_SENT_EVENT } from './MySubmissions';
import { RichTextEditor, renderDescriptionContent, stripHtmlToPlainText } from './RichTextEditor';

/**
 * The one create dialog of the public site: a community event, a fair, a place suggestion or a challenge idea.
 * Each type is a short wizard (three steps of a few fields, then a review step). What happens after sending is
 * decided by the server: approved hosts publish community events at once, everything else waits for staff.
 */
export type CreationEntityType = 'community' | 'fair' | 'spot' | 'challenge';
type Category = 'move' | 'heal' | 'chill' | 'learn';

const CATEGORIES: Array<{ id: Category; label: string; hint: string; tag: string }> = [
  { id: 'chill', label: 'นัดชิลล์', hint: 'คาเฟ่ กินข้าว บอร์ดเกม', tag: 'นัดชิลล์' },
  { id: 'move', label: 'ขยับร่างกาย', hint: 'วิ่ง เดิน ปั่น กีฬา', tag: 'ออกกำลังกาย' },
  { id: 'heal', label: 'ฮีลใจ', hint: 'ธรรมชาติ โยคะ สมาธิ', tag: 'ฮีลใจ' },
  { id: 'learn', label: 'เรียนรู้', hint: 'เวิร์กช็อป งานคราฟต์ เสวนา', tag: 'เวิร์กช็อป' },
];

const DAYS: Array<{ id: DayOfWeek; label: string }> = [
  { id: 'MO', label: 'จ.' }, { id: 'TU', label: 'อ.' }, { id: 'WE', label: 'พ.' }, { id: 'TH', label: 'พฤ.' },
  { id: 'FR', label: 'ศ.' }, { id: 'SA', label: 'ส.' }, { id: 'SU', label: 'อา.' },
];

const PLATFORMS = [
  { id: 'zoom', label: 'Zoom' }, { id: 'google_meet', label: 'Google Meet' }, { id: 'discord', label: 'Discord' },
  { id: 'teams', label: 'Microsoft Teams' }, { id: 'other', label: 'แพลตฟอร์มอื่น' },
];

const VENUES = [
  { id: 'qsncc', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์', tag: 'qsncc' as const, province: 'กรุงเทพฯ' },
  { id: 'bitec', label: 'ไบเทค บางนา', tag: 'bitec' as const, province: 'กรุงเทพฯ' },
  { id: 'impact', label: 'อิมแพ็ค เมืองทองธานี', tag: 'impact' as const, province: 'นนทบุรี' },
  { id: 'other', label: 'สถานที่อื่น', tag: 'park' as const, province: '' },
];

const BRING_OPTIONS = ['ขวดน้ำส่วนตัว', 'รองเท้าผ้าใบ', 'ครีมกันแดด', 'เสื้อกันฝน', 'เงินสดเล็กน้อย'];
const VERIFY_OPTIONS = ['ถ่ายรูปแล้วโพสต์ลงโมเมนต์', 'เช็กอินที่สถานที่', 'ถ่ายรูปและเช็กอินที่สถานที่'];
const CANCEL_OPTIONS = [
  { id: 'free_anytime', label: 'ยกเลิกได้ตลอด' },
  { id: 'free_24h', label: 'ยกเลิกได้ก่อน 24 ชั่วโมง' },
  { id: 'free_48h', label: 'ยกเลิกได้ก่อน 48 ชั่วโมง' },
  { id: 'chat_notice', label: 'แจ้งในแชตกลุ่มก่อน' },
] as const;

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
/** Which community sample photo fits each mood (index into PRESET_IMAGES.community) */
const MOOD_PRESET: Record<string, number> = { chill: 0, move: 1, heal: 2, learn: 3 };
const PRESET_IMAGES: Record<CreationEntityType, Array<{ label: string; url: string }>> = {
  community: [
    { label: 'คาเฟ่', url: photo('1554118811-1e0d58224f24') }, { label: 'วิ่ง', url: photo('1476480862126-209bfaa8edc8') },
    { label: 'ธรรมชาติ', url: photo('1464822759023-fed622ff2c3b') }, { label: 'เวิร์กช็อป', url: photo('1513364776144-60967b0f800f') },
  ],
  fair: [
    { label: 'งานเอ็กซ์โป', url: photo('1540575467063-178a50c2df87') }, { label: 'งานศิลปะ', url: photo('1531058020387-3be344556be6') },
    { label: 'งานหนังสือ', url: photo('1497633762265-9d179a990aa6') }, { label: 'งานกาแฟ', url: photo('1442512595331-e89e73853f31') },
  ],
  spot: [
    { label: 'คาเฟ่', url: photo('1501339847302-ac426a4a7cbb') }, { label: 'ภูเขา', url: photo('1506744038136-46273834b3fb') },
    { label: 'ศิลปะ', url: photo('1499856871958-5b9627545d1a') }, { label: 'ริมน้ำ', url: photo('1507525428034-b723cf961d3e') },
  ],
  challenge: [
    { label: 'สำรวจเมือง', url: photo('1476480862126-209bfaa8edc8') }, { label: 'ธรรมชาติ', url: photo('1464822759023-fed622ff2c3b') },
    { label: 'คาเฟ่', url: photo('1554118811-1e0d58224f24') }, { label: 'ออกกำลังกาย', url: photo('1517838277536-f5f99be501cd') },
  ],
};

const TYPE_INFO: Record<CreationEntityType, { title: string; text: string; steps: string[]; icon: React.ElementType }> = {
  community: { title: 'ตี้', text: 'นัดกลุ่มเล็ก เช่น วิ่งเช้า บอร์ดเกม เวิร์กช็อป', steps: ['เรื่องพื้นฐาน', 'วันเวลาและสถานที่', 'รายละเอียด', 'ตรวจและส่ง'], icon: Users },
  fair: { title: 'อีเวนต์', text: 'งานจัดแสดง นิทรรศการ เอ็กซ์โป งานวิ่ง', steps: ['เรื่องพื้นฐาน', 'วันและสถานที่', 'รายละเอียด', 'ตรวจและส่ง'], icon: Building },
  spot: { title: 'แนะนำสถานที่', text: 'ที่เที่ยว คาเฟ่ หรือมุมพักใจที่อยากให้คนอื่นรู้จัก', steps: ['เรื่องพื้นฐาน', 'ที่ตั้งและเวลาเปิด', 'รายละเอียด', 'ตรวจและส่ง'], icon: MapPin },
  challenge: { title: 'เสนอชาเลนจ์', text: 'ภารกิจให้คนในคอมมูนิตี้ทำร่วมกัน', steps: ['เรื่องพื้นฐาน', 'ภารกิจ', 'ช่วงเวลาและเหรียญ', 'ตรวจและส่ง'], icon: Target },
};

const isoDay = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function recurrenceText(days: DayOfWeek[], frequency: 'weekly' | 'biweekly' | 'monthly'): string {
  const sorted = DAYS.filter((day) => days.includes(day.id));
  const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR'];
  const names = sorted.length === 7 ? 'ทุกวัน'
    : sorted.length === 5 && sorted.every((day) => weekdays.includes(day.id)) ? 'ทุกวันจันทร์ - ศุกร์'
    : sorted.length === 2 && days.includes('SA') && days.includes('SU') ? 'ทุกวันเสาร์ - อาทิตย์'
    : `ทุกวัน${sorted.map((day) => day.label).join(' ')}`;
  return `${names}${frequency === 'biweekly' ? ' (เว้นสัปดาห์)' : frequency === 'monthly' ? ' (เดือนละครั้ง)' : ''}`;
}

type Seed = { title?: string; location?: string; category?: Category; image?: string; place?: PlacePick; itinerary?: Array<{ time: string; title: string }> };

const initialForm = (type: CreationEntityType, seed: Seed) => ({
  title: seed.title ?? '',
  category: seed.category ?? ('chill' as Category),
  image: seed.image || PRESET_IMAGES[type][0].url,
  description: '',
  province: seed.place?.province && ALL_THAI_PROVINCES.includes(seed.place.province) ? seed.place.province : 'กรุงเทพฯ',
  district: seed.place?.district ?? '',
  locationName: seed.location ?? seed.place?.name ?? '',
  priceMode: 'free' as 'free' | 'paid',
  priceText: '',
  itinerary: seed.itinerary ?? ([] as Array<{ time: string; title: string }>),
  // community
  scheduleType: 'single' as 'single' | 'recurring',
  date: '',
  startTime: '',
  endTime: '',
  frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
  days: [] as DayOfWeek[],
  repeatUntil: '',
  locationType: 'physical' as 'physical' | 'online',
  meetingPoint: '',
  // A place picked from the suggestions (our catalog); typing the name again unlinks it
  placeId: seed.place?.placeId ?? '',
  onlinePlatform: 'zoom',
  onlineJoinUrl: '',
  maxParticipants: 8,
  targetGender: 'all' as 'all' | 'female_only' | 'male_only',
  targetAge: '',
  whatToBring: [] as string[],
  transportation: '',
  isSoloFriendly: true,
  isBeginnerFriendly: true,
  isPetFriendly: false,
  isIntrovertFriendly: false,
  canBringFriend: false,
  isEnglishFriendly: false,
  isKidFriendly: false,
  cancellationPolicy: 'free_24h' as (typeof CANCEL_OPTIONS)[number]['id'],
  // fair
  organizer: '',
  // The group on the ค้นพบ tabs: a meetup category (its mood follows) or a fair group
  lifestyleCategory: '',
  fairCategory: '',
  venueId: 'qsncc',
  startDate: '',
  endDate: '',
  ticketUrl: '',
  // spot
  spotCategory: '',
  openHours: '',
  bestTime: '',
  googleMapsUrl: '',
  pin: (seed.place?.pin ?? null) as Pin | null,
  highlights: [] as string[],
  // challenge
  objective: '',
  steps: [''] as string[],
  total: 3,
  verificationMethod: VERIFY_OPTIONS[0],
  badgeLabel: '',
});
type Form = ReturnType<typeof initialForm>;
type Errors = Partial<Record<keyof Form, string>>;

/** A starting structure for the description; the bracketed lines are prompts the writer replaces */
const DESCRIPTION_TEMPLATES: Partial<Record<CreationEntityType, string>> = {
  community: [
    '<p><strong>ภาพรวมกิจกรรม</strong></p>',
    '<p>[เล่าสั้นๆ ว่าจะทำอะไรกัน ที่ไหน และบรรยากาศเป็นแบบไหน]</p>',
    '<p><strong>เหมาะกับใคร</strong></p>',
    '<ul><li>[เช่น มือใหม่ร่วมได้ ไม่ต้องมีประสบการณ์]</li><li>[เช่น มาคนเดียวได้ มีคนคอยต้อนรับ]</li></ul>',
    '<p><strong>สิ่งที่จะได้กลับไป</strong></p>',
    '<p>[เช่น เพื่อนใหม่ที่ชอบเรื่องเดียวกัน หรือทักษะที่ได้ลอง]</p>',
    '<p><strong>ข้อควรรู้ก่อนมา</strong></p>',
    '<p>[เช่น การแต่งกาย ค่าใช้จ่ายที่ต้องจ่ายเอง หรือกรณีฝนตก]</p>',
  ].join(''),
  fair: [
    '<p><strong>ภาพรวมของงาน</strong></p>',
    '<p>[เล่าว่างานนี้คืองานอะไร จัดเพื่อใคร และมีผู้ร่วมออกบูธประมาณเท่าไร]</p>',
    '<p><strong>ไฮไลต์ในงาน</strong></p>',
    '<ul><li>[โซนหรือกิจกรรมเด่นที่ 1]</li><li>[โซนหรือกิจกรรมเด่นที่ 2]</li><li>[โปรโมชันหรือของที่มีเฉพาะในงาน]</li></ul>',
    '<p><strong>เหมาะกับใคร</strong></p>',
    '<p>[เช่น คนรักงานคราฟต์ ครอบครัว หรือผู้ประกอบการ]</p>',
    '<p><strong>ข้อมูลการเข้างาน</strong></p>',
    '<p>[เช่น ต้องลงทะเบียนล่วงหน้าหรือไม่ การเดินทาง และที่จอดรถ]</p>',
  ].join(''),
  spot: [
    '<p><strong>บรรยากาศของสถานที่</strong></p>',
    '<p>[เล่าว่าที่นี่เป็นแบบไหน เงียบหรือคึกคัก และอะไรทำให้น่ามา]</p>',
    '<p><strong>สิ่งที่แนะนำ</strong></p>',
    '<ul><li>[มุมหรือจุดที่ไม่ควรพลาด]</li><li>[เมนูหรือกิจกรรมที่ควรลอง]</li></ul>',
    '<p><strong>เหมาะกับใคร</strong></p>',
    '<p>[เช่น มานั่งทำงาน มากับครอบครัว หรือมาคนเดียว]</p>',
    '<p><strong>ข้อควรรู้</strong></p>',
    '<p>[เช่น ที่จอดรถ ช่วงที่คนเยอะ หรือสิ่งที่ควรเตรียมมา]</p>',
  ].join(''),
};

/** True while a prompt of the template is still in the text, so a half-filled template is never sent */
const hasTemplatePrompt = (description: string): boolean => /\[[^\]]{3,}\]/.test(stripHtmlToPlainText(description));

/** What must be filled in on each step; the server checks again */
function validate(type: CreationEntityType, step: number, f: Form, minDate: string, publishesNow = false): Errors {
  const e: Errors = {};
  const need = (key: keyof Form, ok: boolean, message: string) => { if (!ok && !e[key]) e[key] = message; };
  if (step === 0) {
    need('title', f.title.trim().length >= 5, 'ตั้งชื่ออย่างน้อย 5 ตัวอักษร');
    if (type === 'community') need('lifestyleCategory', Boolean(f.lifestyleCategory), 'เลือกหมวดตี้');
    if (type === 'fair') need('fairCategory', Boolean(f.fairCategory), 'เลือกประเภทงาน');
    if (type === 'fair') need('organizer', f.organizer.trim().length >= 2, 'ใส่ชื่อผู้จัดงาน');
    if (type === 'spot') need('spotCategory', Boolean(f.spotCategory), 'เลือกประเภทสถานที่');
  }
  if (step === 1 && type === 'community') {
    if (f.scheduleType === 'single') {
      need('date', Boolean(f.date), 'เลือกวันที่');
      need('date', !f.date || f.date >= minDate, publishesNow ? 'เลือกวันตั้งแต่พรุ่งนี้ เพื่อให้คนมีเวลาเห็นและสมัคร' : 'เลือกวันล่วงหน้าอย่างน้อย 3 วัน เพื่อให้ทีมงานตรวจทัน');
    } else {
      need('days', f.days.length > 0, 'เลือกอย่างน้อย 1 วัน');
    }
    need('startTime', Boolean(f.startTime), 'ใส่เวลาเริ่ม');
    need('endTime', Boolean(f.endTime), 'ใส่เวลาเลิก');
    need('endTime', !f.startTime || !f.endTime || isValidTimeRange(f.startTime, f.endTime), 'เวลาเลิกต้องไม่ตรงกับเวลาเริ่ม');
    if (f.locationType === 'physical') {
      need('province', Boolean(f.province), 'เลือกจังหวัด');
      need('locationName', f.locationName.trim().length >= 2, 'ใส่ชื่อสถานที่');
      need('meetingPoint', f.meetingPoint.trim().length >= 2, 'บอกจุดนัดพบที่หาง่าย');
    } else {
      need('onlineJoinUrl', !f.onlineJoinUrl.trim() || f.onlineJoinUrl.trim().startsWith('https://'), 'ลิงก์ต้องขึ้นต้นด้วย https://');
    }
  }
  if (step === 1 && type === 'fair') {
    need('startDate', Boolean(f.startDate), 'เลือกวันเริ่มงาน');
    need('endDate', Boolean(f.endDate), 'เลือกวันสิ้นสุดงาน');
    need('endDate', !f.startDate || !f.endDate || f.endDate >= f.startDate, 'วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม');
    need('province', Boolean(f.province), 'เลือกจังหวัด');
    if (f.venueId === 'other') need('locationName', f.locationName.trim().length >= 2, 'ใส่ชื่อสถานที่จัดงาน');
  }
  if (step === 1 && type === 'spot') {
    need('province', Boolean(f.province), 'เลือกจังหวัด');
    need('openHours', f.openHours.trim().length >= 2, 'ใส่เวลาเปิด เช่น ทุกวัน 08:00 - 18:00 น.');
    need('pin', Boolean(f.pin), 'ปักหมุดตำแหน่งของสถานที่ก่อน: ค้นหาชื่อ หรือแตะบนแผนที่');
  }
  if (step === 1 && type === 'challenge') {
    need('objective', f.objective.trim().length >= 15, 'อธิบายเป้าหมายอย่างน้อย 15 ตัวอักษร');
    need('steps', f.steps.some((item) => item.trim()), 'ใส่ขั้นตอนอย่างน้อย 1 ข้อ');
    need('total', f.total >= 1 && f.total <= 100, 'ใส่จำนวนระหว่าง 1 ถึง 100');
  }
  if (step === 2 && type !== 'challenge') {
    need('description', stripHtmlToPlainText(f.description).length >= 15, 'เล่ารายละเอียดอย่างน้อย 15 ตัวอักษร');
    need('description', !hasTemplatePrompt(f.description), 'แตะข้อความในวงเล็บ [ ] แล้วพิมพ์รายละเอียดจริงทับได้เลย');
    if (type !== 'spot' && f.priceMode === 'paid') need('priceText', f.priceText.trim().length >= 1, 'ใส่ราคา เช่น 150 บาท');
    if (type === 'community') need('maxParticipants', f.maxParticipants >= 2 && f.maxParticipants <= 15, 'รับได้ 2 ถึง 15 คน');
    if (type === 'fair') need('ticketUrl', !f.ticketUrl.trim() || f.ticketUrl.trim().startsWith('https://'), 'ลิงก์ต้องขึ้นต้นด้วย https://');
  }
  if (step === 2 && type === 'challenge') {
    need('startDate', Boolean(f.startDate), 'เลือกวันเริ่ม');
    need('endDate', Boolean(f.endDate), 'เลือกวันสิ้นสุด');
    need('endDate', !f.startDate || !f.endDate || f.endDate >= f.startDate, 'วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม');
    need('badgeLabel', f.badgeLabel.trim().length >= 2, 'ตั้งชื่อเหรียญ');
  }
  return e;
}

const inputClass = (bad?: boolean) =>
  `w-full px-4 py-3 border rounded-2xl text-base sm:text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-medium focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 ${bad ? 'border-rose-400' : 'border-slate-300'}`;

function Field({ label, optional, hint, error, children, htmlFor }: { label: string; optional?: boolean; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div data-field-error={error ? 'true' : undefined}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-slate-900 mb-1.5">
        {label}
        {optional && <span className="ml-1.5 text-xs font-medium text-slate-500">(ไม่บังคับ)</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p> : hint ? <p className="mt-1.5 text-xs font-medium text-slate-500 leading-relaxed">{hint}</p> : null}
    </div>
  );
}

const isoToDmy = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
function dmyToIso(text: string): string {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  return date.getUTCDate() === Number(dd) && date.getUTCMonth() === Number(mm) - 1 ? `${yyyy}-${mm}-${dd}` : '';
}

/**
 * A date typed as DD/MM/YYYY whatever the browser's language (the browser's own date box follows the device and showed
 * MM/DD/YYYY; owner 2026-10-25). The calendar button opens the browser's picker. The value stays YYYY-MM-DD.
 */
function DateInput({ id, value, min, bad, onChange }: { id: string; value: string; min?: string; bad?: boolean; onChange: (iso: string) => void }) {
  // What is being typed, until it is a whole date; otherwise the box shows the value (also one set by the picker or a draft)
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? isoToDmy(value);
  const pickerRef = useRef<HTMLInputElement>(null);
  const type = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const next = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
    const iso = dmyToIso(next);
    setTyped(iso ? null : next);
    onChange(iso);
  };
  return (
    <div className="relative">
      <input id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="วว/ดด/ปปปป (ค.ศ.)" value={text} onChange={(e) => type(e.target.value)} className={`${inputClass(bad)} pr-12 tabular-nums`} />
      <input ref={pickerRef} type="date" tabIndex={-1} aria-hidden="true" min={min} value={value} onChange={(e) => { setTyped(null); onChange(e.target.value); }} className="absolute right-3 bottom-0 w-8 h-0 opacity-0 pointer-events-none" />
      <button
        type="button"
        aria-label="เลือกจากปฏิทิน"
        onClick={() => {
          const picker = pickerRef.current;
          if (!picker) return;
          if (typeof picker.showPicker === 'function') picker.showPicker();
          else picker.click();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
      >
        <Calendar className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * A time typed as 24-hour HH:MM (the browser's own time box showed 06:00 AM on English devices; owner 2026-10-25).
 * Digits only, the colon comes by itself; the value stays HH:MM, or '' until it is a whole time.
 */
function TimeInput({ id, value, bad, ariaLabel, onChange }: { id?: string; value: string; bad?: boolean; ariaLabel?: string; onChange: (hhmm: string) => void }) {
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? value;
  const type = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const next = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    const whole = /^([01]\d|2[0-3]):[0-5]\d$/.test(next) ? next : '';
    setTyped(whole ? null : next);
    onChange(whole);
  };
  return (
    <input id={id} type="text" inputMode="numeric" autoComplete="off" aria-label={ariaLabel} placeholder="ชช:นน" value={text} onChange={(e) => type(e.target.value)}
      className={`${inputClass(bad)} tabular-nums`} />
  );
}

type PlaceSpot = { id: string; title: string; province: string; district?: string; latitude?: number; longitude?: number };
type PlaceVenue = { id: string; label: string; province: string };
export type PlacePick = { placeId?: string; name: string; province?: string; district?: string; pin?: Pin };

/**
 * The place of a ตี้: typing suggests places from our catalog and the event venues, so a ตี้ can link to the place's
 * page and fill the province, area and map pin; anything else can still be typed (owner 2026-10-25).
 */
function PlaceSuggest({ id, value, linked, bad, venues, province, onType, onPick }: {
  id: string; value: string; linked: boolean; bad?: boolean; venues: PlaceVenue[]; province: string;
  onType: (text: string) => void; onPick: (pick: PlacePick) => void;
}) {
  const [open, setOpen] = useState(false);
  const [spots, setSpots] = useState<PlaceSpot[]>([]);
  const [active, setActive] = useState(-1);
  const word = value.trim();
  useEffect(() => {
    if (!open || linked || word.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/spots?q=${encodeURIComponent(word)}&limit=40`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { spots?: PlaceSpot[] } | null) => setSpots(json?.spots ?? []))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [word, open, linked]);
  const lower = word.toLowerCase();
  // The search also reads descriptions; only names that hold the word are offered, the chosen province first
  const rank = (title: string, place: string) => (place === province ? 0 : 2) + (title.toLowerCase().startsWith(lower) ? 0 : 1);
  const spotHits = spots
    .filter((s) => s.title.toLowerCase().includes(lower))
    .sort((a, b) => rank(a.title, a.province) - rank(b.title, b.province))
    .slice(0, 5);
  const venueHits = word.length < 2 ? [] : venues.filter((v) => v.label.toLowerCase().includes(lower)).slice(0, 3);
  const options: Array<{ key: string; title: string; detail: string; pick: PlacePick }> = word.length < 2 || linked ? [] : [
    ...spotHits.map((s) => ({
      key: `spot-${s.id}`, title: s.title, detail: [s.district, s.province].filter(Boolean).join(' · '),
      pick: { placeId: s.id, name: s.title, province: s.province, district: s.district, pin: s.latitude && s.longitude ? { latitude: s.latitude, longitude: s.longitude } : undefined },
    })),
    ...venueHits.map((v) => ({ key: `venue-${v.id}`, title: v.label, detail: `${v.province} · สถานที่จัดงาน`, pick: { name: v.label, province: v.province } })),
  ];
  const choose = (pick: PlacePick) => {
    onPick(pick);
    setOpen(false);
    setActive(-1);
  };
  const listId = `${id}-list`;
  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        maxLength={100}
        placeholder="พิมพ์ชื่อสถานที่ เช่น สวนเบญจกิติ"
        onChange={(e) => {
          onType(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || options.length === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? options.length - 1 : i - 1)); }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(options[active].pick); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        className={inputClass(bad)}
      />
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-lg py-1">
          {options.map((option, i) => (
            <li key={option.key} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(option.pick)}
                className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left cursor-pointer ${i === active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                <MapPin className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 truncate">{option.title}</span>
                  {option.detail && <span className="block text-xs font-medium text-slate-500 truncate">{option.detail}</span>}
                </span>
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs font-medium text-slate-500 border-t border-slate-100">ไม่มีในรายการ พิมพ์ชื่อเองได้เลย</li>
        </ul>
      )}
    </div>
  );
}

/** Two or three options side by side */
function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ id: T; label: string }>; onChange: (id: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex p-1 rounded-2xl bg-slate-100">
      {options.map((option) => (
        <button key={option.id} type="button" role="radio" aria-checked={value === option.id} onClick={() => onChange(option.id)}
          className={`flex-1 min-h-10 px-3 rounded-xl text-sm font-bold cursor-pointer transition-colors ${value === option.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`min-h-9 px-3.5 rounded-full border text-sm font-bold cursor-pointer transition-colors ${selected ? 'bg-blue-50 border-[#2563EB] text-[#1D4ED8]' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}`}>
      {children}
    </button>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 text-sm">
      <dt className="w-24 shrink-0 font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 font-bold text-slate-900 break-words">{children}</dd>
    </div>
  );
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open straight on this type's form; without it the dialog starts with the type chooser */
  initialType?: CreationEntityType;
  initialCategory?: Category;
  initialLocation?: string;
  initialTitle?: string;
  initialImage?: string;
  /** A catalog place the ตี้ meets at (linked by placeId) */
  initialPlace?: PlacePick;
  /** A schedule to start from, e.g. the Smart Plan's stops */
  initialItinerary?: Array<{ time: string; title: string }>;
  onCreateSuccess: (newEvent: EventItem) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = (props) => (props.isOpen ? <CreateDialog {...props} /> : null);

function CreateDialog({ onClose, initialType, initialCategory, initialLocation, initialTitle, initialImage, initialPlace, initialItinerary, onCreateSuccess }: CreateEventModalProps) {
  const { userProfile, isOrganizer, isVenueOwner, isHost } = useAuth();
  const { member, isLoaded } = useMemberSession();
  const titleId = useId();
  const uid = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const seed = useMemo<Seed>(
    () => ({ title: initialTitle, location: initialLocation, category: initialCategory, image: initialImage, place: initialPlace, itinerary: initialItinerary }),
    [initialTitle, initialLocation, initialCategory, initialImage, initialPlace, initialItinerary],
  );

  const canCreate = Boolean(member) && member?.trust?.level !== 'new';
  const canCreateFair = isOrganizer || isVenueOwner;
  const startType = initialType && (initialType !== 'fair' || canCreateFair) ? initialType : null;

  const [type, setType] = useState<CreationEntityType | null>(startType);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(() => initialForm(startType ?? 'community', seed));
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  /** Set when ส่ง was pressed without the agreement ticked; the box turns red and scrolls into view */
  const [agreeMissed, setAgreeMissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extraInput, setExtraInput] = useState('');
  const [sent, setSent] = useState<{ title: string } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };
  const id = (name: string) => `${uid}-${name}`;
  const draftKey = (t: CreationEntityType) => `chill_draft_v2_${t}`;

  const openType = (next: CreationEntityType) => {
    let nextForm = initialForm(next, seed);
    let fromDraft = false;
    try {
      const saved = sessionStorage.getItem(draftKey(next));
      if (saved) {
        nextForm = { ...nextForm, ...(JSON.parse(saved) as Partial<Form>) };
        // A plan the page hands over wins over an older draft's schedule
        if (seed.itinerary?.length) nextForm.itinerary = seed.itinerary;
        fromDraft = true;
      }
    } catch {
      // No draft to bring back
    }
    setForm(nextForm);
    setRestored(fromDraft);
    setType(next);
    setStep(0);
    setErrors({});
    setServerError(null);
    setAccepted(false);
    setAgreeMissed(false);
  };

  // A type given by the page opens with its saved draft, like one picked in the chooser
  useEffect(() => {
    if (startType) openType(startType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // What has been typed survives closing the dialog by accident
  useEffect(() => {
    if (!type || sent) return;
    try {
      const typed = JSON.stringify(form);
      // An untouched form is not a draft
      if (typed === JSON.stringify(initialForm(type, seed))) sessionStorage.removeItem(draftKey(type));
      else sessionStorage.setItem(draftKey(type), typed);
    } catch {
      // Storage is unavailable; the form still works
    }
  }, [form, type, sent, seed]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step, type]);

  const info = type ? TYPE_INFO[type] : null;
  const lastStep = info ? info.steps.length - 1 : 0;
  const publishesNow = type === 'community' && isHost;
  // An approved host's ตี้ goes live at once, so it needs no time for the team's check
  const minDate = isoDay(type === 'fair' ? 7 : type === 'challenge' ? 0 : publishesNow ? 1 : 3);
  const price = form.priceMode === 'free' ? 'ฟรี' : form.priceText.trim();
  // The "เหมาะกับ" chips as the detail page lists them, for the review step
  const inPerson = form.locationType === 'physical';
  const suits = [
    inPerson && form.isSoloFriendly && 'มาคนเดียวได้',
    form.isBeginnerFriendly && 'มือใหม่มาได้',
    form.isIntrovertFriendly && 'สายอินโทรเวิร์ตมาได้',
    form.canBringFriend && 'พาเพื่อนมาได้',
    form.isEnglishFriendly && 'ใช้ภาษาอังกฤษได้',
    inPerson && form.isPetFriendly && 'พาสัตว์เลี้ยงมาได้',
    inPerson && form.isKidFriendly && 'พาเด็กมาได้',
  ].filter((text): text is string => Boolean(text));
  const venue = VENUES.find((item) => item.id === form.venueId) ?? VENUES[0];
  const fairLocation = form.venueId === 'other' ? form.locationName.trim() : [venue.label, form.locationName.trim()].filter(Boolean).join(' · ');
  const dateText = type === 'community'
    ? (form.scheduleType === 'recurring' ? recurrenceText(form.days, form.frequency) : form.date ? formatThaiDateBE(form.date) : '')
    : form.startDate && form.endDate
      ? (form.startDate === form.endDate ? formatThaiDateBE(form.startDate) : `${formatThaiDateBE(form.startDate)} - ${formatThaiDateBE(form.endDate)}`)
      : '';
  const timeText = form.startTime && form.endTime ? `${form.startTime} - ${form.endTime} น.` : '';

  const goNext = () => {
    if (!type) return;
    const found = validate(type, step, form, minDate, publishesNow);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => bodyRef.current?.querySelector('[data-field-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setStep((current) => Math.min(current + 1, lastStep));
  };

  const goBack = () => {
    setServerError(null);
    if (step > 0) setStep(step - 1);
    else if (!startType) setType(null);
    else onClose();
  };

  const startOver = () => {
    if (!type) return;
    try {
      sessionStorage.removeItem(draftKey(type));
    } catch {
      // Nothing stored
    }
    setForm(initialForm(type, seed));
    setRestored(false);
    setStep(0);
    setErrors({});
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setUploadError(null);
    if (!file || !type) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) return setUploadError('ใช้ได้เฉพาะไฟล์รูป .jpg .png .webp หรือ .avif');
    if (file.size > 10 * 1024 * 1024) return setUploadError('รูปใหญ่เกิน 10MB ลองเลือกรูปที่เล็กลง');
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      const body = new FormData();
      body.append('file', compressed);
      body.append('folder', type);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.url) set('image', data.url);
      else setUploadError(data?.message || 'อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } catch {
      setUploadError('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const eventPayload = (): EventItem => {
    const base = {
      title: form.title.trim(),
      image: form.image,
      price: price || 'ฟรี',
      description: form.description.trim(),
      itinerary: form.itinerary.filter((row) => row.title.trim()),
      hostAvatar: userProfile.avatar,
      isNew: true,
      createdAtTimestamp: Date.now(),
    };
    if (type === 'fair') {
      return {
        ...base,
        id: `fair-user-${Date.now()}`,
        category: 'chill',
        eventType: 'public_venue',
        badgeText: 'ศูนย์จัดแสดง',
        tag: 'งานมหกรรม',
        date: dateText,
        time: timeText || 'ดูเวลาที่หน้างาน',
        province: form.province,
        location: fairLocation,
        venueTag: venue.tag,
        fairCategory: form.fairCategory || undefined,
        hostName: form.organizer.trim(),
        participantsCount: 0,
        maxParticipants: 9999,
        externalUrl: form.ticketUrl.trim() || undefined,
      };
    }
    const online = form.locationType === 'online';
    const recurring = form.scheduleType === 'recurring';
    const category = CATEGORIES.find((item) => item.id === form.category) ?? CATEGORIES[0];
    return {
      ...base,
      id: `comm-user-${Date.now()}`,
      category: form.category,
      lifestyleCategory: form.lifestyleCategory || undefined,
      eventType: 'community',
      badgeText: 'เปิดรับสมัคร',
      tag: category.tag,
      date: dateText,
      time: timeText,
      province: online ? 'ออนไลน์' : form.province,
      zone: online ? 'online' : form.district.trim() || undefined,
      location: online ? `ออนไลน์ (${PLATFORMS.find((item) => item.id === form.onlinePlatform)?.label})` : `${form.locationName.trim()} (จุดนัดพบ: ${form.meetingPoint.trim()})`,
      meetingPoint: online ? undefined : form.meetingPoint.trim(),
      placeId: online ? undefined : form.placeId || undefined,
      venueTag: 'park',
      scheduleType: form.scheduleType,
      recurrence: recurring ? {
        frequency: form.frequency,
        daysOfWeek: form.days,
        endType: form.repeatUntil ? 'on_date' : 'never',
        endDate: form.repeatUntil || undefined,
        customSummary: `${dateText} • ${timeText}`,
      } : undefined,
      locationType: form.locationType,
      onlinePlatform: online ? form.onlinePlatform : undefined,
      onlineJoinUrl: online && form.onlineJoinUrl.trim() ? form.onlineJoinUrl.trim() : undefined,
      hostName: userProfile.name,
      participantsCount: 1,
      maxParticipants: form.maxParticipants,
      targetGender: form.targetGender,
      targetAge: form.targetAge.trim() || 'ไม่จำกัดอายุ',
      energyLevel: 'chill',
      whatToBring: form.whatToBring,
      transportation: form.transportation.trim() || undefined,
      isSoloFriendly: form.isSoloFriendly,
      isBeginnerFriendly: form.isBeginnerFriendly,
      isIntrovertFriendly: form.isIntrovertFriendly,
      canBringFriend: form.canBringFriend,
      isEnglishFriendly: form.isEnglishFriendly,
      isKidFriendly: online ? false : form.isKidFriendly,
      isPetFriendly: online ? false : form.isPetFriendly,
      cancellationPolicy: form.cancellationPolicy,
    };
  };

  const submit = async () => {
    if (!type || isSubmitting) return;
    if (!accepted) {
      setAgreeMissed(true);
      // After the warning line renders, so the box and the line under it both come into view
      requestAnimationFrame(() => bodyRef.current?.querySelector('[data-agreement]')?.scrollIntoView({ block: 'end', behavior: 'smooth' }));
      return;
    }
    setServerError(null);
    setIsSubmitting(true);
    try {
      const request = type === 'spot'
        ? { url: '/api/spots', body: { title: form.title, category: form.spotCategory, image: form.image, province: form.province, district: form.district, googleMapsUrl: form.googleMapsUrl.trim().startsWith('https://') ? form.googleMapsUrl.trim() : '', latitude: form.pin?.latitude, longitude: form.pin?.longitude, openHours: form.openHours, bestTime: form.bestTime, price: form.priceText, description: form.description, highlights: form.highlights } }
        : type === 'challenge'
          ? { url: '/api/quests', body: { title: form.title, category: form.category, image: form.image, objective: form.objective, steps: form.steps.filter((item) => item.trim()), total: form.total, verificationMethod: form.verificationMethod, startDate: form.startDate, endDate: form.endDate, badgeLabel: form.badgeLabel } }
          : { url: '/api/events', body: { eventData: eventPayload() } };
      const res = await fetch(request.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setServerError(data?.message || 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      try {
        sessionStorage.removeItem(draftKey(type));
      } catch {
        // Nothing stored
      }
      // Waiting for staff: its page is not public yet, so the form says so instead of handing the page a link that 404s
      if (data.event && (data.event as EventItem).approvalStatus === 'pending') {
        void activityActions.refresh();
        window.dispatchEvent(new Event(SUBMISSION_SENT_EVENT));
        setSent({ title: form.title.trim() });
      } else if (data.event) {
        const saved = data.event as EventItem;
        try {
          // Older pages still look here to recognise events this browser created
          const created = JSON.parse(localStorage.getItem('user_created_events') || '[]');
          localStorage.setItem('user_created_events', JSON.stringify([saved, ...created]));
        } catch {
          // Storage is unavailable
        }
        void activityActions.refresh();
        onCreateSuccess(saved);
        onClose();
      } else {
        window.dispatchEvent(new Event(SUBMISSION_SENT_EVENT));
        setSent({ title: form.title.trim() });
      }
    } catch {
      setServerError('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- pieces shared by the forms ---------- */
  const titleField = (label: string, placeholder: string) => (
    <Field label={label} htmlFor={id('title')} error={errors.title}>
      <input id={id('title')} data-autofocus value={form.title} maxLength={100} onChange={(e) => set('title', e.target.value)} placeholder={placeholder} className={inputClass(Boolean(errors.title))} />
    </Field>
  );

  const { communityCategories: questCategories, fairCategories, venues } = useMasterData();
  const pillClass = (selected: boolean) =>
    `inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${selected ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`;
  const questCategoryField = (
    <Field label="หมวด">
      <div className="grid grid-cols-2 gap-2">
        {questCategories.map((item) => {
          const selected = (form.category as string) === item.id;
          return (
            <button key={item.id} type="button" aria-pressed={selected} onClick={() => set('category', item.id as Category)}
              className={`relative text-left p-3 rounded-2xl border cursor-pointer transition-colors ${selected ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-300 hover:border-slate-400'}`}>
              <span className="block text-sm font-bold text-slate-900 pr-5">{item.name}</span>
              <span className="block mt-0.5 text-xs font-medium text-slate-500">{item.desc}</span>
              {selected && <Check className="absolute top-3 right-3 w-4 h-4 text-[#2563EB]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </Field>
  );
  // A meetup picks one of the categories, most popular first; the mood behind it is set from it but not shown
  // (owner 2026-10-25: kept for grouping later, not a choice members make)
  const categoryField = (
    <Field label="หมวดตี้" error={errors.lifestyleCategory}>
      <div className="flex flex-wrap gap-2">
        {questCategories.map((item) => {
          const selected = form.lifestyleCategory === item.id;
          return (
            <button key={item.id} type="button" aria-pressed={selected} title={item.desc}
              onClick={() => {
                set('lifestyleCategory', item.id);
                set('category', item.coreMood);
                // While the cover is still the first sample, show one that fits the mood (a run gets the running photo)
                const fitting = PRESET_IMAGES.community[MOOD_PRESET[item.coreMood] ?? 0];
                if (form.image === PRESET_IMAGES.community[0].url && fitting) set('image', fitting.url);
              }}
              className={pillClass(selected)}>
              {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              {item.name}
            </button>
          );
        })}
      </div>
    </Field>
  );
  const fairCategoryField = (
    <Field label="ประเภทงาน" error={errors.fairCategory}>
      <div className="flex flex-wrap gap-2">
        {fairCategories.map((item) => {
          const selected = form.fairCategory === item.id;
          return (
            <button key={item.id} type="button" aria-pressed={selected} onClick={() => set('fairCategory', item.id)} className={pillClass(selected)}>
              {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              {item.name}
            </button>
          );
        })}
      </div>
    </Field>
  );

  const imageField = type && (
    <Field label="รูปปก" hint={uploadError ? undefined : 'เลือกรูปตัวอย่างหรืออัปโหลดรูปของคุณ (แนวนอนจะสวยที่สุด)'} error={uploadError ?? undefined}>
      <div className="flex gap-3">
        <div className="relative w-28 sm:w-36 aspect-[4/3] shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.image} alt="รูปปกที่เลือก" className="w-full h-full object-cover" />
          {isUploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" aria-hidden="true" /></div>}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_IMAGES[type].map((preset) => (
              <button key={preset.url} type="button" aria-pressed={form.image === preset.url} aria-label={`ใช้รูป${preset.label}`} onClick={() => set('image', preset.url)}
                className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${form.image === preset.url ? 'border-[#2563EB]' : 'border-transparent hover:border-slate-300'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" aria-hidden="true" />
            {isUploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={isUploading} onChange={handleUpload} />
          </label>
        </div>
      </div>
    </Field>
  );

  const provinceField = (
    <Field label="จังหวัด" htmlFor={id('province')} error={errors.province}>
      <select id={id('province')} value={form.province} onChange={(e) => set('province', e.target.value)} className={inputClass(Boolean(errors.province))}>
        {ALL_THAI_PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </Field>
  );

  const priceField = (freeLabel: string, paidLabel: string) => (
    <Field label="ค่าใช้จ่าย" error={errors.priceText}>
      <div className="space-y-2">
        <Segmented label="ค่าใช้จ่าย" value={form.priceMode} onChange={(value) => set('priceMode', value)} options={[{ id: 'free', label: freeLabel }, { id: 'paid', label: paidLabel }]} />
        {form.priceMode === 'paid' && (
          <input aria-label="ราคา" value={form.priceText} maxLength={60} onChange={(e) => set('priceText', e.target.value)} placeholder="เช่น 150 บาท หรือ หารค่าเครื่องดื่มกันเอง" className={inputClass(Boolean(errors.priceText))} />
        )}
      </div>
    </Field>
  );

  const descriptionField = (label: string, placeholder: string) => (
    <Field label={label} error={errors.description} hint="อย่างน้อย 15 ตัวอักษร ห้ามใส่ไลน์ เบอร์โทร หรือลิงก์ส่วนตัว">
      <RichTextEditor value={form.description} onChange={(value) => set('description', value)} placeholder={placeholder} minHeight="130px"
        templateLabel="ใช้โครงตัวอย่าง"
        onApplyTemplate={type && DESCRIPTION_TEMPLATES[type] ? () => {
          // Text already written is kept; the structure goes below it
          const written = stripHtmlToPlainText(form.description).length > 0;
          set('description', `${written ? form.description : ''}${DESCRIPTION_TEMPLATES[type]}`);
        } : undefined} />
    </Field>
  );

  /** A list of short lines the member adds one at a time */
  const listField = (key: 'whatToBring' | 'highlights', label: string, placeholder: string, max: number, suggestions: string[] = []) => (
    <Field label={label} optional>
      <div className="space-y-2">
        {(suggestions.length > 0 || form[key].length > 0) && (
          <div className="flex flex-wrap gap-2">
            {[...new Set([...suggestions, ...form[key]])].map((item) => {
              const selected = form[key].includes(item);
              return <Chip key={item} selected={selected} onClick={() => set(key, selected ? form[key].filter((value) => value !== item) : [...form[key], item].slice(0, max))}>{item}</Chip>;
            })}
          </div>
        )}
        <div className="flex gap-2">
          <input aria-label={`เพิ่ม${label}`} value={extraInput} maxLength={60} onChange={(e) => setExtraInput(e.target.value)} placeholder={placeholder} className={inputClass()}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (extraInput.trim() && !form[key].includes(extraInput.trim())) set(key, [...form[key], extraInput.trim()].slice(0, max));
              setExtraInput('');
            }} />
          <button type="button" aria-label={`เพิ่ม${label}`} onClick={() => { if (extraInput.trim() && !form[key].includes(extraInput.trim())) set(key, [...form[key], extraInput.trim()].slice(0, max)); setExtraInput(''); }}
            className="w-12 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer">
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Field>
  );

  const itineraryField = (
    <Field label="กำหนดการ" optional hint="ใส่เฉพาะช่วงสำคัญ เช่น 07:00 รวมตัวที่จุดนัดพบ">
      <div className="space-y-2">
        {form.itinerary.map((row, index) => (
          <div key={index} className="flex gap-2">
            <div className="w-32 shrink-0"><TimeInput ariaLabel={`เวลาของช่วงที่ ${index + 1}`} value={row.time} onChange={(hhmm) => set('itinerary', form.itinerary.map((item, i) => (i === index ? { ...item, time: hhmm } : item)))} /></div>
            <input aria-label={`สิ่งที่ทำในช่วงที่ ${index + 1}`} value={row.title} maxLength={80} onChange={(e) => set('itinerary', form.itinerary.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)))} placeholder="ทำอะไร" className={inputClass()} />
            <button type="button" aria-label={`ลบช่วงที่ ${index + 1}`} onClick={() => set('itinerary', form.itinerary.filter((_, i) => i !== index))} className="w-12 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {form.itinerary.length < 8 && (
          <button type="button" onClick={() => set('itinerary', [...form.itinerary, { time: '', title: '' }])} className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" aria-hidden="true" /> เพิ่มช่วงเวลา
          </button>
        )}
      </div>
    </Field>
  );

  const dateInput = (key: 'date' | 'startDate' | 'endDate' | 'repeatUntil', label: string, min: string, optional = false) => (
    <Field label={label} htmlFor={id(key)} error={errors[key]} optional={optional} hint={form[key] ? formatThaiDateBE(form[key]) : undefined}>
      <DateInput id={id(key)} min={min} value={form[key]} bad={Boolean(errors[key])} onChange={(iso) => set(key, iso)} />
    </Field>
  );
  const timeInput = (key: 'startTime' | 'endTime', label: string, optional = false) => (
    <Field label={label} htmlFor={id(key)} error={errors[key]} optional={optional}>
      <TimeInput id={id(key)} value={form[key]} bad={Boolean(errors[key])} onChange={(hhmm) => set(key, hhmm)} />
    </Field>
  );

  /* ---------- the steps of each type ---------- */
  const renderStep = () => {
    if (!type) return null;
    if (step === 0) {
      return (
        <>
          {type === 'community' && titleField('ชื่อตี้', 'เช่น วิ่งเช้าสวนเบญจกิติ แล้วไปกินกาแฟ')}
          {type === 'fair' && titleField('ชื่องาน', 'เช่น สัปดาห์หนังสือแห่งชาติ ครั้งที่ 54')}
          {type === 'spot' && titleField('ชื่อสถานที่', 'เช่น ไร่ชาลุงเดช')}
          {type === 'challenge' && titleField('ชื่อชาเลนจ์', 'เช่น ตะลุย 3 คาเฟ่ย่านอารีย์')}
          {type === 'community' && categoryField}
          {type === 'challenge' && questCategoryField}
          {type === 'fair' && fairCategoryField}
          {type === 'fair' && (
            <Field label="ผู้จัดงาน" htmlFor={id('organizer')} error={errors.organizer} hint="ชื่อองค์กรหรือทีมที่จัดงานนี้">
              <input id={id('organizer')} value={form.organizer} maxLength={80} onChange={(e) => set('organizer', e.target.value)} className={inputClass(Boolean(errors.organizer))} />
            </Field>
          )}
          {type === 'spot' && (
            <Field label="ประเภทสถานที่" htmlFor={id('spotCategory')} error={errors.spotCategory}>
              <select id={id('spotCategory')} value={form.spotCategory} onChange={(e) => set('spotCategory', e.target.value)} className={inputClass(Boolean(errors.spotCategory))}>
                <option value="">เลือกประเภท</option>
                {SPOT_CATEGORY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </Field>
          )}
          {imageField}
        </>
      );
    }

    if (step === 1 && type === 'community') {
      return (
        <>
          <Field label="จัดกี่ครั้ง">
            <Segmented label="จัดกี่ครั้ง" value={form.scheduleType} onChange={(value) => set('scheduleType', value)} options={[{ id: 'single', label: 'ครั้งเดียว' }, { id: 'recurring', label: 'จัดเป็นประจำ' }]} />
          </Field>
          {form.scheduleType === 'single' ? dateInput('date', 'วันที่', minDate) : (
            <>
              <Field label="จัดวันไหนบ้าง" error={errors.days}>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => <Chip key={day.id} selected={form.days.includes(day.id)} onClick={() => set('days', form.days.includes(day.id) ? form.days.filter((value) => value !== day.id) : [...form.days, day.id])}>{day.label}</Chip>)}
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ความถี่" htmlFor={id('frequency')}>
                  <select id={id('frequency')} value={form.frequency} onChange={(e) => set('frequency', e.target.value as Form['frequency'])} className={inputClass()}>
                    <option value="weekly">ทุกสัปดาห์</option>
                    <option value="biweekly">สัปดาห์เว้นสัปดาห์</option>
                    <option value="monthly">เดือนละครั้ง</option>
                  </select>
                </Field>
                {dateInput('repeatUntil', 'จัดถึงวันที่', minDate, true)}
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            {timeInput('startTime', 'เวลาเริ่ม')}
            {timeInput('endTime', 'เวลาเลิก')}
          </div>
          <Field label="เจอกันที่ไหน">
            <Segmented label="เจอกันที่ไหน" value={form.locationType} onChange={(value) => set('locationType', value)} options={[{ id: 'physical', label: 'นัดเจอกัน' }, { id: 'online', label: 'ออนไลน์' }]} />
          </Field>
          {form.locationType === 'physical' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {provinceField}
                <Field label="ย่านหรือเขต" htmlFor={id('district')} optional>
                  <input id={id('district')} value={form.district} maxLength={60} onChange={(e) => set('district', e.target.value)} placeholder="เช่น คลองเตย" className={inputClass()} />
                </Field>
              </div>
              <Field label="สถานที่" htmlFor={id('locationName')} error={errors.locationName} hint="นัดในที่สาธารณะที่มีคนอื่นอยู่ด้วยเสมอ">
                <PlaceSuggest
                  id={id('locationName')}
                  value={form.locationName}
                  linked={Boolean(form.placeId)}
                  bad={Boolean(errors.locationName)}
                  venues={venues}
                  province={form.province}
                  onType={(text) => {
                    set('locationName', text);
                    if (form.placeId) set('placeId', '');
                  }}
                  onPick={(pick) => {
                    set('locationName', pick.name);
                    set('placeId', pick.placeId ?? '');
                    if (pick.province && ALL_THAI_PROVINCES.includes(pick.province)) set('province', pick.province);
                    if (pick.district) set('district', pick.district);
                    if (pick.pin) set('pin', pick.pin);
                  }}
                />
                {form.placeId && <p className="mt-1.5 text-xs font-semibold text-[#4A7C59]">เชื่อมกับหน้าสถานที่นี้แล้ว คนที่เปิดตี้จะกดไปดูที่นี่ได้</p>}
              </Field>
              <Field label="จุดนัดพบ" htmlFor={id('meetingPoint')} error={errors.meetingPoint}>
                <input id={id('meetingPoint')} value={form.meetingPoint} maxLength={100} onChange={(e) => set('meetingPoint', e.target.value)} placeholder="เช่น หน้าร้านกาแฟทางเข้าฝั่งศูนย์สิริกิติ์" className={inputClass(Boolean(errors.meetingPoint))} />
              </Field>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="แพลตฟอร์ม" htmlFor={id('platform')}>
                <select id={id('platform')} value={form.onlinePlatform} onChange={(e) => set('onlinePlatform', e.target.value)} className={inputClass()}>
                  {PLATFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="ลิงก์ห้อง" htmlFor={id('joinUrl')} optional error={errors.onlineJoinUrl} hint="ใส่ทีหลังในแชตกลุ่มก็ได้">
                <input id={id('joinUrl')} type="url" value={form.onlineJoinUrl} maxLength={300} onChange={(e) => set('onlineJoinUrl', e.target.value)} placeholder="https://" className={inputClass(Boolean(errors.onlineJoinUrl))} />
              </Field>
            </div>
          )}
        </>
      );
    }

    if (step === 1 && type === 'fair') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dateInput('startDate', 'วันเริ่มงาน', minDate)}
            {dateInput('endDate', 'วันสิ้นสุดงาน', form.startDate || minDate)}
            {timeInput('startTime', 'เวลาเปิด', true)}
            {timeInput('endTime', 'เวลาปิด', true)}
          </div>
          <Field label="สถานที่จัดงาน" htmlFor={id('venue')}>
            <select id={id('venue')} value={form.venueId} className={inputClass()}
              onChange={(e) => {
                const next = VENUES.find((item) => item.id === e.target.value);
                setForm((prev) => ({ ...prev, venueId: e.target.value, province: next?.province || prev.province }));
              }}>
              {VENUES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label={form.venueId === 'other' ? 'ชื่อสถานที่' : 'ฮอลล์หรือโซน'} htmlFor={id('locationName')} optional={form.venueId !== 'other'} error={errors.locationName}>
            <input id={id('locationName')} value={form.locationName} maxLength={100} onChange={(e) => set('locationName', e.target.value)} placeholder={form.venueId === 'other' ? 'เช่น มิวเซียมสยาม' : 'เช่น ฮอลล์ 5-7 ชั้น LG'} className={inputClass(Boolean(errors.locationName))} />
          </Field>
          {provinceField}
        </>
      );
    }

    if (step === 1 && type === 'spot') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {provinceField}
            <Field label="อำเภอหรือเขต" htmlFor={id('district')} optional>
              <input id={id('district')} value={form.district} maxLength={60} onChange={(e) => set('district', e.target.value)} className={inputClass()} />
            </Field>
          </div>
          <LocationPinPicker pin={form.pin} onPinChange={(pin) => set('pin', pin)} mapUrl={form.googleMapsUrl} onMapUrlChange={(value) => set('googleMapsUrl', value)}
            searchText={[form.title.trim(), form.district.trim(), form.province].filter(Boolean).join(' ')} error={errors.pin} />
          <Field label="เวลาเปิด" htmlFor={id('openHours')} error={errors.openHours}>
            <input id={id('openHours')} value={form.openHours} maxLength={100} onChange={(e) => set('openHours', e.target.value)} placeholder="เช่น ทุกวัน 08:00 - 18:00 น." className={inputClass(Boolean(errors.openHours))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ช่วงเวลาที่แนะนำ" htmlFor={id('bestTime')} optional>
              <input id={id('bestTime')} value={form.bestTime} maxLength={80} onChange={(e) => set('bestTime', e.target.value)} placeholder="เช่น ช่วงเย็นก่อนพระอาทิตย์ตก" className={inputClass()} />
            </Field>
            <Field label="ค่าเข้าหรือราคาโดยประมาณ" htmlFor={id('spotPrice')} optional>
              <input id={id('spotPrice')} value={form.priceText} maxLength={60} onChange={(e) => set('priceText', e.target.value)} placeholder="เช่น ฟรี หรือ 80-150 บาท" className={inputClass()} />
            </Field>
          </div>
        </>
      );
    }

    if (step === 1 && type === 'challenge') {
      return (
        <>
          <Field label="เป้าหมาย" htmlFor={id('objective')} error={errors.objective} hint="ชวนให้ทำอะไร และทำไมถึงน่าทำ">
            <textarea id={id('objective')} rows={3} value={form.objective} maxLength={600} onChange={(e) => set('objective', e.target.value)} placeholder="เช่น ชวนกันออกไปลองร้านกาแฟเล็กๆ ในย่านอารีย์ให้ครบ 3 ร้าน" className={inputClass(Boolean(errors.objective))} />
          </Field>
          <Field label="ขั้นตอน" error={errors.steps}>
            <div className="space-y-2">
              {form.steps.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="w-6 text-center text-sm font-bold text-slate-500" aria-hidden="true">{index + 1}</span>
                  <input aria-label={`ขั้นตอนที่ ${index + 1}`} value={item} maxLength={160} onChange={(e) => set('steps', form.steps.map((value, i) => (i === index ? e.target.value : value)))} placeholder={index === 0 ? 'เช่น ไปร้านกาแฟในย่านอารีย์' : 'ขั้นตอนถัดไป'} className={inputClass(Boolean(errors.steps) && !item.trim())} />
                  {form.steps.length > 1 && (
                    <button type="button" aria-label={`ลบขั้นตอนที่ ${index + 1}`} onClick={() => set('steps', form.steps.filter((_, i) => i !== index))} className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
              {form.steps.length < 8 && (
                <button type="button" onClick={() => set('steps', [...form.steps, ''])} className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                  <Plus className="w-4 h-4" aria-hidden="true" /> เพิ่มขั้นตอน
                </button>
              )}
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ต้องทำกี่ครั้งจึงสำเร็จ" htmlFor={id('total')} error={errors.total}>
              <input id={id('total')} type="number" inputMode="numeric" min={1} max={100} value={form.total} onChange={(e) => set('total', Number(e.target.value))} className={inputClass(Boolean(errors.total))} />
            </Field>
            <Field label="วิธียืนยันว่าทำแล้ว" htmlFor={id('verify')}>
              <select id={id('verify')} value={form.verificationMethod} onChange={(e) => set('verificationMethod', e.target.value)} className={inputClass()}>
                {VERIFY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </div>
        </>
      );
    }

    if (step === 2 && type === 'community') {
      return (
        <>
          {descriptionField('รายละเอียดกิจกรรม', 'เล่าบรรยากาศ สิ่งที่จะทำ และเหมาะกับใคร')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="รับกี่คน" error={errors.maxParticipants} hint="รวมตัวคุณด้วย 2 ถึง 15 คน">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="ลดจำนวนคน" disabled={form.maxParticipants <= 2} onClick={() => set('maxParticipants', form.maxParticipants - 1)} className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 text-slate-700 text-xl font-bold cursor-pointer disabled:cursor-not-allowed">−</button>
                <output aria-live="polite" className="flex-1 h-12 rounded-2xl border border-slate-300 flex items-center justify-center text-base font-bold text-slate-900">{form.maxParticipants} คน</output>
                <button type="button" aria-label="เพิ่มจำนวนคน" disabled={form.maxParticipants >= 15} onClick={() => set('maxParticipants', form.maxParticipants + 1)} className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:text-slate-300 text-slate-700 text-xl font-bold cursor-pointer disabled:cursor-not-allowed">+</button>
              </div>
            </Field>
            {priceField('ฟรี', 'มีค่าใช้จ่าย')}
          </div>
          <details open={initialItinerary?.length ? true : undefined} className="group rounded-2xl border border-slate-200">
            <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-bold text-slate-900">ตัวเลือกเพิ่มเติม</span>
                <span className="block text-xs font-medium text-slate-500">ใครเข้าร่วมได้ ของที่ต้องเตรียม กำหนดการ การยกเลิก</span>
              </span>
              <ChevronRight className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4 pt-1 space-y-5 border-t border-slate-100">
              <Field label="เปิดรับ">
                <Segmented label="เปิดรับ" value={form.targetGender} onChange={(value) => set('targetGender', value)} options={[{ id: 'all', label: 'ทุกเพศ' }, { id: 'female_only', label: 'เฉพาะผู้หญิง' }, { id: 'male_only', label: 'เฉพาะผู้ชาย' }]} />
              </Field>
              <Field label="ช่วงอายุ" htmlFor={id('age')} optional>
                <input id={id('age')} value={form.targetAge} maxLength={40} onChange={(e) => set('targetAge', e.target.value)} placeholder="เช่น 20-35 ปี" className={inputClass()} />
              </Field>
              <Field label="เหมาะกับ" optional>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={form.isSoloFriendly} onClick={() => set('isSoloFriendly', !form.isSoloFriendly)}>มาคนเดียวได้</Chip>
                  <Chip selected={form.isBeginnerFriendly} onClick={() => set('isBeginnerFriendly', !form.isBeginnerFriendly)}>มือใหม่มาได้</Chip>
                  {form.locationType === 'physical' && <Chip selected={form.isPetFriendly} onClick={() => set('isPetFriendly', !form.isPetFriendly)}>พาสัตว์เลี้ยงมาได้</Chip>}
                  <Chip selected={form.isIntrovertFriendly} onClick={() => set('isIntrovertFriendly', !form.isIntrovertFriendly)}>สายอินโทรเวิร์ตมาได้</Chip>
                  <Chip selected={form.canBringFriend} onClick={() => set('canBringFriend', !form.canBringFriend)}>พาเพื่อนมาได้</Chip>
                  <Chip selected={form.isEnglishFriendly} onClick={() => set('isEnglishFriendly', !form.isEnglishFriendly)}>ใช้ภาษาอังกฤษได้</Chip>
                  {form.locationType === 'physical' && <Chip selected={form.isKidFriendly} onClick={() => set('isKidFriendly', !form.isKidFriendly)}>พาเด็กมาได้</Chip>}
                </div>
              </Field>
              {form.locationType === 'physical' && listField('whatToBring', 'ของที่ต้องเตรียม', 'พิมพ์แล้วกดเพิ่ม', 8, BRING_OPTIONS)}
              {form.locationType === 'physical' && (
                <Field label="การเดินทาง" htmlFor={id('transport')} optional>
                  <input id={id('transport')} value={form.transportation} maxLength={120} onChange={(e) => set('transportation', e.target.value)} placeholder="เช่น MRT ศูนย์สิริกิติ์ ทางออก 3" className={inputClass()} />
                </Field>
              )}
              {itineraryField}
              <Field label="การยกเลิก" htmlFor={id('cancel')}>
                <select id={id('cancel')} value={form.cancellationPolicy} onChange={(e) => set('cancellationPolicy', e.target.value as Form['cancellationPolicy'])} className={inputClass()}>
                  {CANCEL_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </Field>
            </div>
          </details>
          <p className="text-xs font-medium text-slate-600 leading-relaxed p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            ผู้เข้าร่วมคุยกับคุณได้ในแชตกลุ่มของตี้ ซึ่งเปิดให้อัตโนมัติ จึงไม่ต้องใส่ไลน์หรือเบอร์โทร
          </p>
        </>
      );
    }

    if (step === 2 && type === 'fair') {
      return (
        <>
          {descriptionField('รายละเอียดงาน', 'เล่าว่างานนี้มีอะไรให้ดู ไฮไลต์ และเหมาะกับใคร')}
          {priceField('เข้าฟรี', 'มีค่าบัตร')}
          <Field label="ลิงก์เว็บไซต์หรือจองบัตร" htmlFor={id('ticket')} optional error={errors.ticketUrl}>
            <input id={id('ticket')} type="url" value={form.ticketUrl} maxLength={300} onChange={(e) => set('ticketUrl', e.target.value)} placeholder="https://" className={inputClass(Boolean(errors.ticketUrl))} />
          </Field>
          {itineraryField}
        </>
      );
    }

    if (step === 2 && type === 'spot') {
      return (
        <>
          {descriptionField('เล่าเกี่ยวกับสถานที่', 'บรรยากาศเป็นอย่างไร มีอะไรน่าสนใจ เหมาะกับใคร')}
          {listField('highlights', 'จุดเด่น', 'เช่น มุมถ่ายรูปแสงธรรมชาติ', 6)}
        </>
      );
    }

    if (step === 2 && type === 'challenge') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dateInput('startDate', 'วันเริ่ม', minDate)}
            {dateInput('endDate', 'วันสิ้นสุด', form.startDate || minDate)}
          </div>
          <Field label="ชื่อเหรียญที่จะได้รับ" htmlFor={id('badge')} error={errors.badgeLabel} hint="ตั้งให้สั้นและจำง่าย">
            <input id={id('badge')} value={form.badgeLabel} maxLength={40} onChange={(e) => set('badgeLabel', e.target.value)} placeholder="เช่น นักสำรวจกาแฟ" className={inputClass(Boolean(errors.badgeLabel))} />
          </Field>
          <p className="text-xs font-medium text-slate-600 leading-relaxed p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            คะแนนและรางวัลของชาเลนจ์ ทีมงานเป็นผู้กำหนดตอนตรวจ เพื่อให้ทุกชาเลนจ์ใช้เกณฑ์เดียวกัน
          </p>
        </>
      );
    }

    /* ---------- review ---------- */
    const editLink = (target: number) => (
      <button type="button" onClick={() => setStep(target)} className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer whitespace-nowrap">แก้ไข</button>
    );
    const section = (target: number, children: React.ReactNode) => (
      <section className="rounded-2xl border border-slate-200 px-4 py-2">
        <div className="flex items-center justify-between gap-3 pt-1.5">
          <h3 className="text-sm font-bold text-slate-900">{info!.steps[target]}</h3>
          {editLink(target)}
        </div>
        <dl className="divide-y divide-slate-100">{children}</dl>
      </section>
    );
    return (
      <>
        <div className="flex gap-3.5 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.image} alt="" className="w-24 sm:w-28 aspect-[4/3] rounded-2xl object-cover bg-slate-100 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">{info!.title}</p>
            <p className="text-lg font-bold text-slate-900 leading-snug break-words">{form.title.trim()}</p>
          </div>
        </div>

        {section(0, (
          <>
            {type === 'community' && <SummaryRow label="หมวด">{questCategories.find((item) => item.id === form.lifestyleCategory)?.name}</SummaryRow>}
            {type === 'challenge' && <SummaryRow label="หมวด">{questCategories.find((item) => item.id === form.category)?.name}</SummaryRow>}
            {type === 'fair' && <SummaryRow label="ประเภทงาน">{fairCategories.find((item) => item.id === form.fairCategory)?.name}</SummaryRow>}
            {type === 'fair' && <SummaryRow label="ผู้จัดงาน">{form.organizer.trim()}</SummaryRow>}
            {type === 'spot' && <SummaryRow label="ประเภท">{SPOT_CATEGORY_OPTIONS.find((option) => option.id === form.spotCategory)?.label}</SummaryRow>}
          </>
        ))}

        {type === 'community' && section(1, (
          <>
            <SummaryRow label="วัน">{dateText}{form.scheduleType === 'recurring' && form.repeatUntil ? ` ถึง ${formatThaiDateBE(form.repeatUntil)}` : ''}</SummaryRow>
            <SummaryRow label="เวลา">{timeText}</SummaryRow>
            {form.locationType === 'physical' ? (
              <>
                <SummaryRow label="สถานที่">{form.locationName.trim()} · {[form.district.trim(), form.province].filter(Boolean).join(' ')}</SummaryRow>
                <SummaryRow label="จุดนัดพบ">{form.meetingPoint.trim()}</SummaryRow>
              </>
            ) : <SummaryRow label="สถานที่">ออนไลน์ ({PLATFORMS.find((item) => item.id === form.onlinePlatform)?.label})</SummaryRow>}
          </>
        ))}
        {type === 'fair' && section(1, (
          <>
            <SummaryRow label="วัน">{dateText}</SummaryRow>
            {timeText && <SummaryRow label="เวลา">{timeText}</SummaryRow>}
            <SummaryRow label="สถานที่">{fairLocation} · {form.province}</SummaryRow>
          </>
        ))}
        {type === 'spot' && section(1, (
          <>
            <SummaryRow label="ที่ตั้ง">{[form.district.trim(), form.province].filter(Boolean).join(' ')}</SummaryRow>
            <SummaryRow label="เวลาเปิด">{form.openHours.trim()}</SummaryRow>
            {form.bestTime.trim() && <SummaryRow label="ช่วงแนะนำ">{form.bestTime.trim()}</SummaryRow>}
            {form.priceText.trim() && <SummaryRow label="ราคา">{form.priceText.trim()}</SummaryRow>}
            <SummaryRow label="แผนที่">{form.pin ? 'ปักหมุดแล้ว' : 'ยังไม่ได้ปักหมุด'}</SummaryRow>
          </>
        ))}
        {type === 'challenge' && section(1, (
          <>
            <SummaryRow label="เป้าหมาย">{form.objective.trim()}</SummaryRow>
            <SummaryRow label="ขั้นตอน">
              <ol className="list-decimal pl-5 space-y-0.5">{form.steps.filter((item) => item.trim()).map((item, index) => <li key={index}>{item.trim()}</li>)}</ol>
            </SummaryRow>
            <SummaryRow label="สำเร็จเมื่อ">ทำครบ {form.total} ครั้ง · {form.verificationMethod}</SummaryRow>
          </>
        ))}

        {type === 'challenge' ? section(2, (
          <>
            <SummaryRow label="ช่วงเวลา">{dateText}</SummaryRow>
            <SummaryRow label="เหรียญ">{form.badgeLabel.trim()}</SummaryRow>
          </>
        )) : section(2, (
          <>
            <SummaryRow label="รายละเอียด"><div className="font-medium text-slate-700 text-sm max-h-40 overflow-y-auto">{renderDescriptionContent(form.description)}</div></SummaryRow>
            {type === 'community' && <SummaryRow label="รับ">{form.maxParticipants} คน · {form.targetGender === 'all' ? 'ทุกเพศ' : form.targetGender === 'female_only' ? 'เฉพาะผู้หญิง' : 'เฉพาะผู้ชาย'}{form.targetAge.trim() ? ` · ${form.targetAge.trim()}` : ''}</SummaryRow>}
            {type !== 'spot' && <SummaryRow label="ค่าใช้จ่าย">{price}</SummaryRow>}
            {type === 'fair' && form.ticketUrl.trim() && <SummaryRow label="ลิงก์เว็บไซต์หรือจองบัตร"><span className="break-all">{form.ticketUrl.trim()}</span></SummaryRow>}
            {type === 'community' && form.locationType === 'physical' && form.whatToBring.length > 0 && <SummaryRow label="ของที่ต้องเตรียม">{form.whatToBring.join(' · ')}</SummaryRow>}
            {type === 'community' && suits.length > 0 && <SummaryRow label="เหมาะกับ">{suits.join(' · ')}</SummaryRow>}
            {type === 'community' && form.locationType === 'physical' && form.transportation.trim() && <SummaryRow label="การเดินทาง">{form.transportation.trim()}</SummaryRow>}
            {type === 'spot' && form.highlights.length > 0 && <SummaryRow label="จุดเด่น">{form.highlights.join(' · ')}</SummaryRow>}
            {type !== 'spot' && form.itinerary.some((row) => row.title.trim()) && (
              <SummaryRow label="กำหนดการ">{form.itinerary.filter((row) => row.title.trim()).map((row, index) => <span key={index} className="block">{row.time ? `${row.time} น. ` : ''}{row.title.trim()}</span>)}</SummaryRow>
            )}
            {type === 'community' && <SummaryRow label="การยกเลิก">{CANCEL_OPTIONS.find((option) => option.id === form.cancellationPolicy)?.label}</SummaryRow>}
          </>
        ))}

        <div data-agreement>
          <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${agreeMissed ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200'}`}>
            <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setAgreeMissed(false); setServerError(null); }} className="mt-0.5 w-5 h-5 shrink-0 accent-[#2563EB]" />
            <span className="text-sm font-medium text-slate-700 leading-relaxed">
              {type === 'spot'
                ? 'ข้อมูลนี้เป็นความจริงเท่าที่ฉันทราบ รูปที่ใช้เป็นรูปของฉันหรือรูปที่ใช้ได้ และไม่ใช่การโฆษณาแอบแฝง'
                : type === 'fair'
                  ? 'ข้อมูลนี้เป็นความจริง ฉันเป็นผู้จัดงานหรือได้รับอนุญาตให้ลงประกาศ และราคากับลิงก์ตรงกับของผู้จัดงาน'
                  : type === 'challenge'
                    ? 'ชาเลนจ์นี้ทำได้จริงและปลอดภัย ไม่ขายของ ไม่ชวนลงทุน และเป็นไปตามคำมั่นของคอมมูนิตี้'
                    : 'ข้อมูลนี้เป็นความจริง ตี้นัดในที่สาธารณะ ไม่ขายของ ไม่ชวนลงทุน และเป็นไปตามคำมั่นของคอมมูนิตี้'}
            </span>
          </label>
          {agreeMissed && <p role="alert" className="mt-2 text-sm font-bold text-rose-600">ติ๊กยอมรับข้อตกลงก่อนส่งนะ</p>}
        </div>
      </>
    );
  };

  /* ---------- screens ---------- */
  if (sent) {
    return (
      <DialogShell onClose={onClose} size="sm" title="ส่งให้ทีมงานแล้ว" subtitle={`"${sent.title}" จะขึ้นบนเว็บเมื่อทีมงานตรวจผ่าน โดยปกติใช้เวลา 1-3 วัน`}>
        <div className="flex justify-center">
          <button type="button" data-autofocus onClick={onClose} className={dialogButton.primary}>เข้าใจแล้ว</button>
        </div>
      </DialogShell>
    );
  }

  if (!type || !info) {
    const options: Array<{ id: CreationEntityType; note: string; locked?: boolean }> = [
      { id: 'community', note: isHost ? 'เผยแพร่ทันที' : 'ทีมงานตรวจก่อนเผยแพร่' },
      { id: 'fair', note: canCreateFair ? 'ทีมงานตรวจก่อนเผยแพร่' : 'สำหรับผู้จัดงานและเจ้าของพื้นที่ที่อนุมัติแล้ว', locked: !canCreateFair },
      { id: 'spot', note: 'ทีมงานตรวจก่อนเผยแพร่' },
      { id: 'challenge', note: 'ทีมงานตรวจและกำหนดคะแนน' },
    ];
    return (
      <DialogShell onClose={onClose} size="md" bare labelledBy={titleId}>
        <header className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 shrink-0">
          <h2 id={titleId} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 pr-12">อยากสร้างอะไร</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">เลือกหนึ่งอย่าง แล้วกรอกทีละขั้นสั้นๆ</p>
        </header>
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 overflow-y-auto flex-1 space-y-2.5">
          {isLoaded && !canCreate && (
            <div role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-medium text-amber-900 leading-relaxed">
              {member ? 'ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อน จึงจะสร้างได้ ' : 'เข้าสู่ระบบก่อน จึงจะสร้างได้ '}
              <a href={member ? '/profile/settings#trust' : '/login'} className="font-bold underline whitespace-nowrap">{member ? 'ไปที่ตั้งค่าบัญชี' : 'เข้าสู่ระบบ'}</a>
            </div>
          )}
          {options.map((option) => {
            const item = TYPE_INFO[option.id];
            const Icon = item.icon;
            const disabled = option.locked || !canCreate;
            return (
              <button key={option.id} type="button" disabled={disabled} onClick={() => openType(option.id)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-colors ${disabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/40 cursor-pointer'}`}>
                <span className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${disabled ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-[#2563EB]'}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-base font-bold ${disabled ? 'text-slate-500' : 'text-slate-900'}`}>{item.title}</span>
                  <span className="block text-sm font-medium text-slate-500 leading-snug">{item.text}</span>
                  <span className="block mt-1 text-xs font-bold text-slate-500">{option.note}</span>
                </span>
                {option.locked ? <Lock className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" /> : <ChevronRight className="w-5 h-5 shrink-0 text-slate-400" aria-hidden="true" />}
              </button>
            );
          })}
          {canCreate && (!isHost || !canCreateFair) && (
            <p className="pt-2 text-sm font-medium text-slate-500 leading-relaxed">
              {!isHost && !canCreateFair ? 'อยากให้ตี้เผยแพร่ทันที หรืออยากลงอีเวนต์ ' : 'อยากลงอีเวนต์ '}
              <a href="/profile/settings#host" className="font-bold text-[#2563EB] hover:underline whitespace-nowrap">ส่งคำขอที่ตั้งค่าบัญชี</a>
            </p>
          )}
        </div>
      </DialogShell>
    );
  }

  const isReview = step === lastStep;
  return (
    <DialogShell onClose={onClose} size="lg" bare labelledBy={titleId}>
      <header className="px-5 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-slate-100 shrink-0">
        <p className="text-xs font-bold text-slate-500">{info.title} · ขั้นที่ {step + 1} จาก {info.steps.length}</p>
        <h2 id={titleId} className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 pr-12">{info.steps[step]}</h2>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {info.steps.map((label, index) => <span key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />)}
        </div>
      </header>

      <div ref={bodyRef} className="px-5 sm:px-8 py-5 overflow-y-auto flex-1 space-y-5">
        {restored && step === 0 && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">นำข้อมูลที่กรอกค้างไว้กลับมาให้แล้ว</p>
            <button type="button" onClick={startOver} className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer whitespace-nowrap">เริ่มใหม่</button>
          </div>
        )}
        {isReview && (
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            {publishesNow ? 'ตรวจอีกครั้ง เมื่อกดเผยแพร่ กิจกรรมจะขึ้นบนเว็บทันที' : 'ตรวจอีกครั้งก่อนส่ง ทีมงานจะตรวจแล้วจึงเผยแพร่ โดยปกติใช้เวลา 1-3 วัน'}
          </p>
        )}
        {renderStep()}
        {serverError && <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700">{serverError}</div>}
      </div>

      <footer className="px-5 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <button type="button" onClick={goBack} className={`${dialogButton.quiet} !px-5`}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {step === 0 && startType ? 'ยกเลิก' : 'ย้อนกลับ'}
        </button>
        {isReview ? (
          <button type="button" onClick={submit} disabled={isSubmitting} className={dialogButton.primary}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> กำลังส่ง…</> : publishesNow ? 'เผยแพร่' : 'ส่งให้ทีมงานตรวจ'}
          </button>
        ) : (
          <button type="button" onClick={goNext} disabled={isUploading} className={dialogButton.primary}>
            ถัดไป <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </footer>
    </DialogShell>
  );
}
