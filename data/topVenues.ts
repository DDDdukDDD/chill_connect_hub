/**
 * The venue circles on /events. Kept apart from components/TopVenuesRail.tsx, which imports the sample events:
 * importing this list from there shipped ~200 KB of them to /events (2026-10-28).
 */
export interface TopVenueItem {
  id: string;
  nameEn: string;
  nameTh: string;
  subtitle: string;
  venueKey: string;
  imageUrl: string;
  keywords: string[];
}

export const TOP_VENUES: TopVenueItem[] = [
  {
    id: 'qsncc',
    nameEn: 'QSNCC',
    nameTh: 'ศูนย์ฯ สิริกิติ์',
    subtitle: 'สุขุมวิท • คลองเตย (MRT)',
    venueKey: 'qsncc',
    imageUrl: '/images/venues/qsncc.jpg',
    keywords: ['สิริกิติ์', 'qsncc'],
  },
  {
    id: 'bitec',
    nameEn: 'BITEC Bangna',
    nameTh: 'ไบเทค บางนา',
    subtitle: 'บางนา • สมุทรปราการ (BTS)',
    venueKey: 'bitec',
    imageUrl: '/images/venues/bitec.jpg',
    keywords: ['ไบเทค', 'bitec'],
  },
  {
    id: 'impact',
    nameEn: 'IMPACT Muang Thong',
    nameTh: 'อิมแพ็ค เมืองทองธานี',
    subtitle: 'ชาเลนเจอร์ & อารีนา (MRT)',
    venueKey: 'impact',
    imageUrl: '/images/venues/impact.jpg',
    keywords: ['อิมแพ็ค', 'impact', 'เมืองทอง'],
  },
  {
    id: 'paragon',
    nameEn: 'Paragon & ICONSIAM',
    nameTh: 'พารากอน & ไอคอนสยาม',
    subtitle: 'รอยัล พารากอน & ทรู ไอคอน',
    venueKey: 'paragon',
    imageUrl: '/images/venues/paragon.jpg',
    keywords: ['paragon', 'พารากอน', 'iconsiam', 'ไอคอนสยาม', 'สยาม'],
  },
  {
    id: 'bacc',
    nameEn: 'BACC & Art Spaces',
    nameTh: 'หอศิลป์ BACC & ย่านอาร์ต',
    subtitle: 'ปทุมวัน • เจริญกรุง • พระนคร',
    venueKey: 'bacc',
    imageUrl: '/images/venues/bacc.jpg',
    keywords: ['bacc', 'หอศิลป', 'เจริญกรุง', 'ปทุมวัน'],
  },
  {
    id: 'park',
    nameEn: 'Parks & Open-Air',
    nameTh: 'สวนสาธารณะ & ลานเมือง',
    subtitle: 'สวนเบญจกิติ • ลุมพินี • รถไฟ',
    venueKey: 'park',
    imageUrl: '/images/venues/benjakitti.jpg',
    keywords: ['สวน', 'park', 'สนามหลวง'],
  },
  {
    id: 'regional',
    nameEn: 'Regional Mega Centers',
    nameTh: 'ศูนย์ประชุมภูมิภาค',
    subtitle: 'KICE ขอนแก่น • CMECC เชียงใหม่',
    venueKey: 'regional',
    imageUrl: '/images/venues/kice.webp',
    keywords: ['kice', 'ขอนแก่น', 'cmecc', 'เชียงใหม่', 'สงขลา', 'ภูเก็ต'],
  },
];
