import type { LifestyleSpotItem } from '@/data/spotsData';

/**
 * Stored spot categories (LifestyleSpotItem['category']) with their default Thai labels.
 * These are the data categories, not the frontend vibes (getSpotVibeCategory maps one to the other).
 * Labels follow FE-004 and contain no emoji.
 */
export const SPOT_CATEGORY_OPTIONS: Array<{ id: LifestyleSpotItem['category']; label: string }> = [
  { id: 'temple', label: 'วัด & ศาสนสถาน' },
  { id: 'nature', label: 'ธรรมชาติ & เดินป่า' },
  { id: 'oldtown', label: 'ย่านเก่า & วัฒนธรรม' },
  { id: 'cafe', label: 'คาเฟ่ & สเปซนั่งชิลล์' },
  { id: 'beach', label: 'ทะเล & เกาะสวย' },
  { id: 'market', label: 'ตลาด & ถนนคนเดิน' },
  { id: 'mall', label: 'ห้างสรรพสินค้า & ไลฟ์สไตล์มอลล์' },
  { id: 'restaurant', label: 'ร้านอาหาร & สตรีทฟู้ด' },
  { id: 'attraction', label: 'สวนสนุก & กิจกรรม' },
  { id: 'viewpoint', label: 'จุดชมวิว & รูฟท็อป' },
  { id: 'park', label: 'สวนสาธารณะ & พื้นที่สีเขียว' },
  { id: 'museum', label: 'พิพิธภัณฑ์' },
  { id: 'art', label: 'หอศิลป์ & สเปซศิลปะ' },
  { id: 'bar', label: 'บาร์ & ไนท์ไลฟ์' },
  { id: 'workspace', label: 'ที่นั่งทำงาน' },
  { id: 'coworking', label: 'Co-working Space' },
];

export function defaultSpotCategoryLabel(category: string | undefined): string {
  return SPOT_CATEGORY_OPTIONS.find((option) => option.id === category)?.label ?? 'สถานที่ท่องเที่ยว';
}

/** Google Maps search link for exact coordinates (used when a spot has no map link of its own) */
export function coordinatesMapUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
