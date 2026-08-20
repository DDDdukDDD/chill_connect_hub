import { EventItem, BANGKOK_ZONES } from '@/data/mockData';

export interface ScrapedRawEvent {
  source: 'Zipevent' | 'Eventpop' | 'QSNCC' | 'QSNCC Events' | 'BITEC' | 'BITEC Events' | 'BMA_Bangkok' | 'BMA Events' | 'ThaiRun' | 'SET_Thailand' | 'The Concert' | 'Ticketmelon' | 'Money Expo' | 'Facebook' | string;
  sourceUrl?: string;
  rawTitle: string;
  rawDate: string;
  rawTime?: string;
  rawLocation: string;
  rawPrice?: string;
  rawDescription?: string;
  rawImage: string;
}

// Bangkok Known Venues & Landmarks Coordinate Database
const VENUE_COORDINATES: Record<string, { lat: number; lng: number; zone: string }> = {
  // SET / Stock Exchange / Ratchada / Rama 9
  'อาคารตลาดหลักทรัพย์แห่งประเทศไทย': { lat: 13.7634, lng: 100.5701, zone: 'ladprao_rama9' },
  'ตลาดหลักทรัพย์': { lat: 13.7634, lng: 100.5701, zone: 'ladprao_rama9' },
  'set building': { lat: 13.7634, lng: 100.5701, zone: 'ladprao_rama9' },
  'ห้องสมุดมารวย': { lat: 13.7634, lng: 100.5701, zone: 'ladprao_rama9' },
  'เซ็นทรัล พระราม 9': { lat: 13.7587, lng: 100.5661, zone: 'ladprao_rama9' },
  'fortune town': { lat: 13.7578, lng: 100.5652, zone: 'ladprao_rama9' },
  'เซ็นทรัล ลาดพร้าว': { lat: 13.8164, lng: 100.5614, zone: 'ladprao_rama9' },
  'รัชดา': { lat: 13.7634, lng: 100.5701, zone: 'ladprao_rama9' },

  // QSNCC / Asoke / Sukhumvit
  'ศูนย์การประชุมแห่งชาติสิริกิติ์': { lat: 13.7237, lng: 100.5594, zone: 'sukhumvit' },
  'qsncc': { lat: 13.7237, lng: 100.5594, zone: 'sukhumvit' },
  'สวนเบญจกิติ': { lat: 13.7289, lng: 100.5574, zone: 'sukhumvit' },
  'สวนเบญจกิตติ': { lat: 13.7289, lng: 100.5574, zone: 'sukhumvit' },
  'อโศก': { lat: 13.7372, lng: 100.5604, zone: 'sukhumvit' },
  'พร้อมพงษ์': { lat: 13.7303, lng: 100.5698, zone: 'sukhumvit' },
  'ทองหล่อ': { lat: 13.7346, lng: 100.5829, zone: 'thonglor_ekkamai' },
  'เอกมัย': { lat: 13.7196, lng: 100.5852, zone: 'thonglor_ekkamai' },
  'emquartier': { lat: 13.7319, lng: 100.5694, zone: 'sukhumvit' },
  'emsphere': { lat: 13.7329, lng: 100.5663, zone: 'sukhumvit' },

  // Sports Stadiums & Arenas
  'ราชมังคลากีฬาสถาน': { lat: 13.7553, lng: 100.6223, zone: 'ladprao_rama9' },
  'สนามศุภชลาศัย': { lat: 13.7466, lng: 100.5285, zone: 'siam' },
  'สนามลู่ปั่นจักรยานเจริญสุขมงคลจิต': { lat: 13.7042, lng: 100.7512, zone: 'bangna' },
  'skylane': { lat: 13.7042, lng: 100.7512, zone: 'bangna' },

  // Siam / Chula / Pathum Wan
  'สยามพารากอน': { lat: 13.7466, lng: 100.5349, zone: 'siam' },
  'siam paragon': { lat: 13.7466, lng: 100.5349, zone: 'siam' },
  'สยามสแควร์': { lat: 13.7443, lng: 100.5317, zone: 'siam' },
  'siam square': { lat: 13.7443, lng: 100.5317, zone: 'siam' },
  'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร': { lat: 13.7468, lng: 100.5303, zone: 'siam' },
  'bacc': { lat: 13.7468, lng: 100.5303, zone: 'siam' },
  'จุฬา': { lat: 13.7384, lng: 100.5323, zone: 'siam' },
  'สามย่าน มิตรทาวน์': { lat: 13.7335, lng: 100.5283, zone: 'siam' },
  'samyan mitrtown': { lat: 13.7335, lng: 100.5283, zone: 'siam' },
  'สวนหลวงสแควร์': { lat: 13.7412, lng: 100.5262, zone: 'siam' },
  'central world': { lat: 13.7466, lng: 100.5393, zone: 'siam' },

  // BITEC / Bangna
  'ไบเทค บางนา': { lat: 13.6698, lng: 100.6053, zone: 'bangna' },
  'bitec': { lat: 13.6698, lng: 100.6053, zone: 'bangna' },
  'bitec hall': { lat: 13.6698, lng: 100.6053, zone: 'bangna' },
  'เมกาบางนา': { lat: 13.6469, lng: 100.6802, zone: 'bangna' },
  'mega bangna': { lat: 13.6469, lng: 100.6802, zone: 'bangna' },
  'สวนหลวง ร.9': { lat: 13.6873, lng: 100.6631, zone: 'bangna' },

  // Muang Thong Thani / Impact
  'อิมแพ็ค เมืองทองธานี': { lat: 13.9114, lng: 100.5489, zone: 'muangthong' },
  'impact': { lat: 13.9114, lng: 100.5489, zone: 'muangthong' },
  'เมืองทองธานี': { lat: 13.9114, lng: 100.5489, zone: 'muangthong' },

  // Ari / Chatuchak / Phahonyothin
  'อารีย์': { lat: 13.7797, lng: 100.5447, zone: 'ari' },
  'สวนจตุจักร': { lat: 13.8037, lng: 100.5539, zone: 'ari' },
  'สวนรถไฟ': { lat: 13.8118, lng: 100.5562, zone: 'ari' },
  'chatuchak': { lat: 13.8037, lng: 100.5539, zone: 'ari' },

  // Silom / Sathorn / Lumpini
  'สวนลุมพินี': { lat: 13.7314, lng: 100.5414, zone: 'silom' },
  'สีลม': { lat: 13.7285, lng: 100.5342, zone: 'silom' },
  'สาทร': { lat: 13.7214, lng: 100.5303, zone: 'silom' },
  'king power mahanakhon': { lat: 13.7237, lng: 100.5285, zone: 'silom' },

  // Rattanakosin / Sanam Luang / Old Town
  'สนามหลวง': { lat: 13.7553, lng: 100.4930, zone: 'rattanakosin' },
  'ถนนข้าวสาร': { lat: 13.7588, lng: 100.4974, zone: 'rattanakosin' },
  'มิวเซียมสยาม': { lat: 13.7441, lng: 100.4941, zone: 'rattanakosin' },
  'ท่ามหาราช': { lat: 13.7554, lng: 100.4889, zone: 'rattanakosin' },
};

export function resolveLocationAndZone(rawLocation: string): { lat: number; lng: number; zone: string; formattedLocation: string } {
  const locLower = rawLocation.toLowerCase();

  for (const [key, val] of Object.entries(VENUE_COORDINATES)) {
    if (locLower.includes(key.toLowerCase())) {
      return {
        lat: val.lat,
        lng: val.lng,
        zone: val.zone,
        formattedLocation: rawLocation,
      };
    }
  }

  // Default Central Bangkok (Siam Square) if unmatched
  return {
    lat: 13.7466,
    lng: 100.5349,
    zone: 'siam',
    formattedLocation: rawLocation || 'กรุงเทพมหานคร',
  };
}

export function classifyEventCategoryAndTags(title: string, description: string = ''): {
  category: 'heal' | 'move' | 'chill' | 'learn';
  tag: string;
  badgeText: string;
} {
  const text = `${title} ${description}`.toLowerCase();

  // 1. FINANCIAL / STOCK / SET / WEALTH (ตลาดหลักทรัพย์, หุ้น, การเงิน, Money Expo) ➔ LEARN
  if (
    text.includes('set') ||
    text.includes('ตลาดหลักทรัพย์') ||
    text.includes('หุ้น') ||
    text.includes('การเงิน') ||
    text.includes('ลงทุน') ||
    text.includes('กองทุน') ||
    text.includes('money expo') ||
    text.includes('wealth') ||
    text.includes('crypto') ||
    text.includes('bitcoin') ||
    text.includes('อสังหา') ||
    text.includes('ภาษี') ||
    text.includes('การออม') ||
    text.includes('สัมมนาการเงิน')
  ) {
    let tag = '📈 สัมมนา & การเงิน';
    if (text.includes('หุ้น') || text.includes('set')) tag = '📈 สัมมนาหุ้น & การลงทุน (SET)';
    if (text.includes('money expo')) tag = '💰 มหกรรมการเงิน Money Expo';
    if (text.includes('crypto') || text.includes('bitcoin')) tag = '🪙 เวิร์กช็อป Web3 & Crypto';
    if (text.includes('วางแผนการเงิน') || text.includes('ภาษี')) tag = '💡 วางแผนการเงิน & ภาษี';

    return {
      category: 'learn',
      tag,
      badgeText: '💡 สัมมนาเพื่ออนาคต',
    };
  }

  // 2. MOVE (ออกกำลังกาย, วิ่ง, มาราธอน, ThaiRun, ไตรกีฬา, HYROX, โยคะ, แบดมินตัน, ปีนผา)
  if (
    text.includes('run') ||
    text.includes('marathon') ||
    text.includes('วิ่ง') ||
    text.includes('มาราธอน') ||
    text.includes('thairun') ||
    text.includes('trail') ||
    text.includes('เทรล') ||
    text.includes('10k') ||
    text.includes('21k') ||
    text.includes('42k') ||
    text.includes('hyrox') ||
    text.includes('bootcamp') ||
    text.includes('fitness') ||
    text.includes('badminton') ||
    text.includes('แบดมินตัน') ||
    text.includes('climb') ||
    text.includes('ปีนผา') ||
    text.includes('yoga') ||
    text.includes('โยคะ') ||
    text.includes('sport') ||
    text.includes('ปั่นจักรยาน') ||
    text.includes('ไตรกีฬา') ||
    text.includes('triathlon')
  ) {
    let tag = '🏃 ออกกำลังกาย';
    if (text.includes('run') || text.includes('วิ่ง') || text.includes('marathon') || text.includes('thairun')) tag = '🏃 งานวิ่ง & มาราธอน';
    if (text.includes('trail') || text.includes('เทรล')) tag = '⛰️ วิ่งเทรล & ผจญภัย';
    if (text.includes('hyrox')) tag = '⚡ HYROX Challenge';
    if (text.includes('yoga') || text.includes('โยคะ')) tag = '🧘 โยคะ & ยืดเหยียด';
    if (text.includes('badminton') || text.includes('แบดมินตัน')) tag = '🏸 ตีแบดมินตัน';
    if (text.includes('ปั่นจักรยาน') || text.includes('bike')) tag = '🚴 นัดปั่นจักรยาน';

    return {
      category: 'move',
      tag,
      badgeText: '🔥 ยอดนิยม',
    };
  }

  // 3. HEAL (ฮีลใจ, สมาธิ, Sound Bath, สวนธรรมชาติ, ดูดาว, ศิลปะบำบัด)
  if (
    text.includes('heal') ||
    text.includes('ฮีล') ||
    text.includes('sound bath') ||
    text.includes('meditation') ||
    text.includes('สมาธิ') ||
    text.includes('ธรรมชาติ') ||
    text.includes('ต้นไม้') ||
    text.includes('plant') ||
    text.includes('sunset') ||
    text.includes('ดูดาว') ||
    text.includes('บำบัด') ||
    text.includes('mindfulness') ||
    text.includes('จิตวิทยา') ||
    text.includes('พักใจ')
  ) {
    let tag = '🌿 ฮีลใจ';
    if (text.includes('sound bath')) tag = '🔔 Sound Bath สมาธิ';
    if (text.includes('sunset') || text.includes('ดูดาว')) tag = '✨ ดูดาว & ชมพระอาทิตย์ตก';
    if (text.includes('ต้นไม้') || text.includes('สวน')) tag = '🌱 สวนธรรมชาติ & ชาร์จพลัง';

    return {
      category: 'heal',
      tag,
      badgeText: '🌿 พักผ่อนฮีลใจ',
    };
  }

  // 4. LEARN & CREATIVE (เวิร์กช็อป, งานคราฟต์, ปั้นเซรามิก, วาดรูป, อบขนม, ถ่ายภาพ, เทคโนโลยี)
  if (
    text.includes('workshop') ||
    text.includes('เวิร์กช็อป') ||
    text.includes('craft') ||
    text.includes('คราฟต์') ||
    text.includes('ceramic') ||
    text.includes('เซรามิก') ||
    text.includes('paint') ||
    text.includes('วาดรูป') ||
    text.includes('art') ||
    text.includes('ศิลปะ') ||
    text.includes('baking') ||
    text.includes('ขนมปัง') ||
    text.includes('cook') ||
    text.includes('photo') ||
    text.includes('ถ่ายภาพ') ||
    text.includes('ai') ||
    text.includes('coding') ||
    text.includes('class')
  ) {
    let tag = '🎨 เวิร์กช็อป';
    if (text.includes('ceramic') || text.includes('เซรามิก')) tag = '🏺 ปั้นเซรามิก';
    if (text.includes('paint') || text.includes('วาดรูป')) tag = '🎨 วาดรูปสีน้ำ';
    if (text.includes('ขนม') || text.includes('baking')) tag = '🍞 อบขนมปัง & ทำอาหาร';
    if (text.includes('photo') || text.includes('ถ่ายภาพ') || text.includes('darkroom')) tag = '📸 เวิร์กช็อปถ่ายภาพ';

    return {
      category: 'learn',
      tag,
      badgeText: '✨ เวิร์กช็อปสร้างสรรค์',
    };
  }

  // 5. CHILL & ENTERTAINMENT (คอนเสิร์ต, เทศกาลดนตรี, คาเฟ่, บอร์ดเกม, ดนตรีในสวน, เดินตลาด, หนังสือ)
  let tag = '☕ นัดชิลล์';
  if (text.includes('boardgame') || text.includes('บอร์ดเกม')) tag = '🎲 บอร์ดเกมไนท์';
  if (text.includes('concert') || text.includes('คอนเสิร์ต') || text.includes('cat expo') || text.includes('maho rasop') || text.includes('orchestra') || text.includes('t-pop')) tag = '🎸 คอนเสิร์ต & ดนตรีสด';
  else if (text.includes('music') || text.includes('ดนตรี') || text.includes('jazz') || text.includes('folk')) tag = '🎵 ดนตรีในสวน & Acoustic';
  else if (text.includes('photowalk') || text.includes('photo walk') || text.includes('สตรีท') || text.includes('biennale')) tag = '📷 เดินถ่ายภาพ Photo Walk';
  else if (text.includes('coffee') || text.includes('cafe') || text.includes('กาแฟ')) tag = '☕ คาเฟ่ & คุยสบายๆ';
  else if (text.includes('book') || text.includes('หนังสือ')) tag = '📚 ชมรมคนรักหนังสือ';
  else if (text.includes('expo') || text.includes('anime') || text.includes('fair') || text.includes('market') || text.includes('ตลาด')) tag = '🏛️ นิทรรศการ & เดินเล่น';

  const isBigExpo = text.includes('expo') || text.includes('fair') || text.includes('festival') || text.includes('bitec') || text.includes('qsncc') || text.includes('hall');

  return {
    category: 'chill',
    tag,
    badgeText: isBigExpo ? '🎟️ เทศกาล & นิทรรศการ' : '☕ บรรยากาศเป็นกันเอง',
  };
}

export function processRawEventWithAI(raw: ScrapedRawEvent, idSuffix: number): EventItem {
  const classification = classifyEventCategoryAndTags(raw.rawTitle, raw.rawDescription || '');
  const locationInfo = resolveLocationAndZone(raw.rawLocation);

  const priceClean = raw.rawPrice ? raw.rawPrice.trim() : 'ฟรี!';

  // ALL Scraped / Aggregated Events from external sources are strictly PUBLIC_VENUE events!
  // Community events are reserved solely for user-created / official Chill & Connect meetups.
  const eventType: 'public_venue' | 'community' = 'public_venue';

  return {
    id: `live-agg-${Date.now()}-${idSuffix}`,
    title: raw.rawTitle.trim(),
    category: classification.category,
    eventType: eventType,
    image: raw.rawImage || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    badgeText: classification.badgeText,
    tag: classification.tag,
    date: raw.rawDate.trim(),
    time: raw.rawTime?.trim() || '10:00 - 18:00 น.',
    location: locationInfo.formattedLocation,
    venueTag: raw.rawLocation.toLowerCase().includes('qsncc') || raw.rawLocation.includes('สิริกิติ์')
      ? 'qsncc'
      : raw.rawLocation.toLowerCase().includes('bitec') || raw.rawLocation.includes('ไบเทค')
      ? 'bitec'
      : raw.rawLocation.toLowerCase().includes('impact') || raw.rawLocation.includes('อิมแพ็ค')
      ? 'impact'
      : raw.rawLocation.includes('สวน')
      ? 'park'
      : undefined,
    latitude: locationInfo.lat,
    longitude: locationInfo.lng,
    zone: locationInfo.zone,
    hostName: 
      raw.source === 'ThaiRun' ? 'ThaiRun ฮับคนรักการวิ่ง' :
      raw.source === 'SET_Thailand' ? 'ตลาดหลักทรัพย์แห่งประเทศไทย (SET)' :
      raw.source === 'Zipevent' ? 'Zipevent Hub' :
      raw.source === 'Eventpop' ? 'Eventpop Community' :
      raw.source === 'QSNCC' ? 'QSNCC Bangkok' :
      raw.source === 'BITEC' ? 'BITEC Bangkok' : 'BMA Event กทม.',
    hostAvatar: 
      raw.source === 'SET_Thailand' ? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=150&q=80' :
      raw.source === 'ThaiRun' ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=150&q=80' :
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    participantsCount: Math.floor(Math.random() * 80) + 40,
    maxParticipants: 500,
    description: raw.rawDescription?.trim() || `งานกิจกรรมน่าสนใจจัดที่ ${raw.rawLocation} มาผ่อนคลายและเชื่อมต่อกับเพื่อนใหม่ในวันหยุดสุดสัปดาห์นี้`,
    price: priceClean,
    rating: 4.8 + Math.round(Math.random() * 2) / 10,
    reviewsCount: Math.floor(Math.random() * 50) + 10,
    status: 'active',
    isNew: true,
    createdAtTimestamp: Date.now(),
  };
}
