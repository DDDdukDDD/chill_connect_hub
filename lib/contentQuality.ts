import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';

/**
 * Quality checks for content before it is published, based on the platform standards in AGENTS.md
 * (form validation, no decorative emojis) and the frontend's data needs (FE-004).
 * `required` checks block nothing on their own, but the review queue shows them as must-fix.
 */
export interface QualityCheck {
  id: string;
  label: string;
  ok: boolean;
  severity: 'required' | 'recommended';
}

export interface QualityReport {
  checks: QualityCheck[];
  /** Passed checks as a percentage, required checks weighted double */
  score: number;
  requiredFailures: number;
}

/** Inside Thailand's bounding box; latitude === longitude catches a common source data error */
export function isThaiCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 5.5 && latitude <= 20.6 && longitude >= 97.3 && longitude <= 105.7 &&
    latitude !== longitude;
}

// Pictographic emoji (not Thai text, digits or punctuation)
const EMOJI = /\p{Extended_Pictographic}/u;
// Venue-wide listing pages: an event that links here instead of its own page has no direct link
const LISTING_PAGES = [
  /qsncc\.com\/(en|th)\/whats-on\/event-calendar\/?$/,
  /bitec\.co\.th\/(whats-on|gallery)\/?$/,
  /impact\.co\.th\/(th|en)\/visitors\/event-calendar\/?$/,
];

const plainLength = (html: string | undefined) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

function report(checks: QualityCheck[]): QualityReport {
  const weight = (c: QualityCheck) => (c.severity === 'required' ? 2 : 1);
  const total = checks.reduce((sum, c) => sum + weight(c), 0);
  const passed = checks.filter((c) => c.ok).reduce((sum, c) => sum + weight(c), 0);
  return {
    checks,
    score: total ? Math.round((passed / total) * 100) : 100,
    requiredFailures: checks.filter((c) => !c.ok && c.severity === 'required').length,
  };
}

function titleChecks(title: string | undefined): QualityCheck[] {
  const value = (title || '').trim();
  return [
    { id: 'title_length', label: 'ชื่ออย่างน้อย 5 ตัวอักษร', ok: value.length >= 5, severity: 'required' },
    { id: 'title_emoji', label: 'ชื่อไม่มี emoji ตกแต่ง', ok: !EMOJI.test(value), severity: 'required' },
  ];
}

export function checkSpotQuality(spot: Partial<LifestyleSpotItem>): QualityReport {
  const hours = (spot.openHours || '').trim();
  const imageCount = (spot.image ? 1 : 0) + (spot.galleryImages?.filter((img) => img && img !== spot.image).length ?? 0);
  return report([
    ...titleChecks(spot.title),
    { id: 'description', label: 'คำอธิบายอย่างน้อย 15 ตัวอักษร', ok: plainLength(spot.description) >= 15, severity: 'required' },
    { id: 'province', label: 'ระบุจังหวัด', ok: Boolean(spot.province?.trim()), severity: 'required' },
    {
      id: 'coordinates',
      label: 'พิกัดอยู่ในประเทศไทย',
      ok: isThaiCoordinate(Number(spot.latitude), Number(spot.longitude)),
      severity: 'required',
    },
    { id: 'open_hours', label: 'มีเวลาเปิดให้บริการ', ok: hours !== '' && hours !== 'ไม่ระบุ', severity: 'required' },
    { id: 'image', label: 'มีรูปหลัก', ok: Boolean(spot.image), severity: 'required' },
    { id: 'gallery', label: 'มีรูปอย่างน้อย 3 รูป', ok: imageCount >= 3, severity: 'recommended' },
    { id: 'category_label', label: 'ป้ายหมวดเป็นภาษาไทย', ok: /[฀-๿]/.test(spot.categoryLabel || ''), severity: 'recommended' },
    { id: 'district', label: 'ระบุอำเภอ / เขต', ok: Boolean(spot.district?.trim()), severity: 'recommended' },
    {
      id: 'source_credit',
      label: 'มีเครดิตแหล่งที่มา',
      ok: !spot.sourceUrl || Boolean(spot.sourceName?.trim()),
      severity: 'required',
    },
  ]);
}

export function checkEventQuality(event: Partial<EventItem> & { sourceUrl?: string }): QualityReport {
  const link = event.externalUrl || event.sourceUrl || event.link || '';
  const isCommunity = event.eventType === 'community';
  const checks: QualityCheck[] = [
    ...titleChecks(event.title),
    { id: 'description', label: 'คำอธิบายอย่างน้อย 15 ตัวอักษร', ok: plainLength(event.description) >= 15, severity: 'required' },
    { id: 'province', label: 'ระบุจังหวัด', ok: Boolean(event.province?.trim()), severity: 'required' },
    { id: 'location', label: 'ระบุสถานที่', ok: Boolean(event.location?.trim()), severity: 'required' },
    { id: 'date', label: 'ระบุวันที่', ok: Boolean(event.date?.trim()), severity: 'required' },
    { id: 'image', label: 'มีรูปหลัก', ok: Boolean(event.image), severity: 'required' },
  ];
  if (isCommunity) {
    const max = Number(event.maxParticipants);
    checks.push(
      { id: 'time', label: 'ระบุเวลาเริ่ม-จบ', ok: Boolean(event.time?.trim()), severity: 'required' },
      { id: 'max_participants', label: 'รับ 2-15 คน', ok: Number.isFinite(max) && max >= 2 && max <= 15, severity: 'required' },
      { id: 'meeting_point', label: 'มีจุดนัดพบ', ok: Boolean(event.meetingPoint?.trim()) || event.locationType === 'online', severity: 'recommended' },
    );
  } else {
    checks.push(
      { id: 'organizer', label: 'ระบุผู้จัดอย่างเป็นทางการ', ok: Boolean(event.hostName?.trim()), severity: 'required' },
      { id: 'end_date', label: 'ระบุวันสิ้นสุด', ok: Boolean(event.endDate?.trim()) || /[-–]/.test(event.date || ''), severity: 'recommended' },
      {
        id: 'direct_link',
        label: 'ลิงก์ไปหน้างานโดยตรง',
        ok: Boolean(link) && !LISTING_PAGES.some((pattern) => pattern.test(link)),
        severity: 'recommended',
      },
    );
  }
  return report(checks);
}
