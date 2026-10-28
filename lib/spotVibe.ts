import type { LifestyleSpotItem } from '@/data/spotsData';
import type { SpotVibeId } from '@/data/masterHub';

// Apart from data/spotsData.ts so browser pages can use it without the bundled sample places (2026-10-28)

/**
 * Maps any LifestyleSpotItem to exactly one of the Master Spot Vibe categories, so rail totals sum to 100% of spots.
 * The stored category decides first and the title refines it (a temple-type ruin is an old town, a park with a
 * waterfall is nature). Descriptions are unreliable (temple texts mention "ศิลปะล้านนา", viewpoints "ทะเลหมอก"),
 * so they only count for nature spots and as a last resort.
 */
export function getSpotVibeCategory(spot: LifestyleSpotItem): SpotVibeId {
  // string (not the union) so stored values older than the union still compile
  const cat: string = spot.category;
  const title = (spot.title || '').toLowerCase();
  const label = spot.categoryLabel || '';
  const text = `${title} ${label.toLowerCase()} ${spot.description || ''} ${(spot.vibeTags || []).join(' ')}`.toLowerCase();
  // A café that also serves drinks or food ("Cafe & Bar", "Cafe & Restaurant") stays a café
  const isCafe = /สโลว์บาร์|กาแฟ|coffee|คาเฟ่|\bcaf[eé]\b/.test(title);

  if (cat === 'mall' || /ห้างสรรพสินค้า|มอลล์/.test(label)) return 'shopping_mall';
  if ((cat === 'bar' || /บาร์|ผับ|\bpub\b|\bbar\b|speakeasy|ค็อกเทล|cocktail|ไนท์คลับ|nightclub/.test(title)) && !isCafe) return 'nightlife_bars';
  if (cat === 'attraction' || /สวนสนุก|สวนน้ำ|water ?park|theme ?park|สวนสัตว์|\bzoo\b|ซาฟารี|safari|โกคาร์ท|go-?kart|โบว์ลิ่ง|bowling|escape room|ห้องปริศนา/.test(title)) return 'fun_activities';
  if (cat === 'restaurant' || (!isCafe && /ร้านอาหาร|ภัตตาคาร|restaurant|สตรีทฟู้ด|street food|ก๋วยเตี๋ยว|ร้านข้าว|โอมากาเสะ/.test(title))) return 'food_street';

  const isMuseum = /พิพิธภัณฑ์|museum|มิวเซียม|อควาเรียม|aquarium|ศูนย์วิทยาศาสตร์|ท้องฟ้าจำลอง/.test(title);
  const isShrine = /^วัด|ศาลเจ้า|พระธาตุ|เจดีย์|shrine/.test(title);
  const isMountain = /ดอย|ม่อน|ยอดเขา|ภูเขา|ทะเลหมอก|^ภู(?!เก็ต)/.test(title);

  switch (cat) {
    case 'beach':
      return 'sea_island';
    case 'cafe':
    case 'bar':
    case 'workspace':
    case 'coworking':
      return 'cafe_slowbar';
    case 'art':
      return 'art_creative';
    case 'museum':
      return /หอศิลป์|แกลเลอรี|gallery|\bart\b|อาร์ต/.test(title) ? 'art_creative' : 'museum_learning';
    case 'temple':
      if (isShrine) return 'temple_mu';
      if (isMuseum) return 'museum_learning';
      return /อุทยานประวัติศาสตร์|โบราณสถาน|เมืองเก่า|ปราสาท/.test(title) ? 'oldtown_culture' : 'temple_mu';
    case 'oldtown':
      if (isShrine) return 'temple_mu';
      if (isMuseum) return 'museum_learning';
      return 'oldtown_culture';
    case 'market':
      return 'market_walking';
    case 'viewpoint':
      return isMountain || /ภูเขา/.test(label) ? 'mountain_mist' : 'views_rooftop';
    case 'park':
      if (/น้ำตก|อุทยานแห่งชาติ|ป่า|ถ้ำ/.test(title)) return 'nature_camping';
      if (isMuseum) return 'museum_learning';
      return 'city_parks';
    case 'nature':
      if (/น้ำพุร้อน|บ่อน้ำร้อน|สปา|บำบัด|ฮีลใจ|ออนเซ็น/.test(text)) return 'wellness_retreat';
      if (/ทะเล(?!หมอก)|หาด|เกาะ|อ่าว/.test(title)) return 'sea_island';
      if (isMountain) return 'mountain_mist';
      if (/จุดชมวิว/.test(title)) return 'views_rooftop';
      if (/สวนสาธารณะ|สวนรถไฟ|สวนลุม|สวนเบญ/.test(title)) return 'city_parks';
      if (isMuseum) return 'museum_learning';
      return 'nature_camping';
  }

  // A stored category this code does not know: the words decide
  if (/สปา|บำบัด|ฮีลใจ|น้ำพุร้อน|ออนเซ็น/.test(text)) return 'wellness_retreat';
  if (/คาเฟ่|สโลว์บาร์|coffee|roaster/.test(text)) return 'cafe_slowbar';
  if (/หอศิลป์|แกลเลอรี|gallery/.test(text)) return 'art_creative';
  if (isMuseum) return 'museum_learning';
  if (isShrine) return 'temple_mu';
  if (/ตลาด|ถนนคนเดิน|market/.test(title)) return 'market_walking';
  if (/เมืองเก่า|ชุมชน|โบราณ|ประวัติศาสตร์/.test(text)) return 'oldtown_culture';
  if (/ทะเล(?!หมอก)|หาด|เกาะ|beach|island/.test(text)) return 'sea_island';
  if (/ดอย|หมอก|ม่อน|ยอดเขา/.test(text)) return 'mountain_mist';
  if (/จุดชมวิว|viewpoint|rooftop|รูฟท็อป/.test(text)) return 'views_rooftop';
  return 'nature_camping';
}
