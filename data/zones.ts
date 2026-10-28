// Small shared values, apart from data/mockData.ts: a browser page importing them from there also got its
// ~200 KB of sample events (2026-10-28). data/mockData.ts re-exports them.

export const BANGKOK_ZONES = [
  { id: 'siam', label: 'สยาม / จุฬา / สามย่าน' },
  { id: 'sukhumvit', label: 'สุขุมวิท / อโศก / พร้อมพงษ์' },
  { id: 'thonglor', label: 'ทองหล่อ / เอกมัย' },
  { id: 'ari', label: 'อารีย์ / สะพานควาย / จตุจักร' },
  { id: 'silom', label: 'สีลม / สาทร / พระราม 4' },
  { id: 'bangna', label: 'บางนา / ศรีนครินทร์' },
  { id: 'ladprao', label: 'ลาดพร้าว / รัชดา / พระราม 9' },
  { id: 'nonthaburi', label: 'นนทบุรี / เมืองทองธานี' },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
