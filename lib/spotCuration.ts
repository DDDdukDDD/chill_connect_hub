import type { LifestyleSpotItem } from '@/data/spotsData';
import { getSpotVibeCategory } from '@/lib/spotVibe';
import type { SpotVibeId } from '@/data/masterHub';

/**
 * Automatic curation of the place catalog ("Curated Lifestyle", owner 2026-10-25): there is no team to hand-pick
 * places, so every place gets a score from what we know about it, a tier, and the reasons in plain Thai. Staff can
 * set a tier by hand later (`override`); a recompute never touches an override.
 *
 * - featured: shown first on /spots and in rails
 * - standard: shown after the featured ones
 * - hidden:   left out of browsing (thin entries: no photo, a line of text, little interest); still found by search
 *             and by its own link
 */
export type CurationTier = 'featured' | 'standard' | 'hidden';

export interface SpotCuration {
  score: number;
  tier: CurationTier;
  reasons: string[];
  computedAt: string;
  override?: CurationTier;
  overrideNote?: string;
  overrideBy?: string;
  overrideAt?: string;
}

export const CURATION_TIER_LABEL: Record<CurationTier, string> = { featured: 'แนะนำ', standard: 'ปกติ', hidden: 'ซ่อนจากหน้ารวม' };

/** The tier a place shows with: staff's choice first, then the computed one; places never scored count as standard */
export function effectiveTier(spot: Pick<LifestyleSpotItem, 'curation'>): CurationTier {
  return spot.curation?.override ?? spot.curation?.tier ?? 'standard';
}

// How well a kind of place fits people of 18-35 going out with friends (the product's audience)
const VIBE_FIT: Record<SpotVibeId, number> = {
  cafe_slowbar: 15, nightlife_bars: 15, art_creative: 14, market_walking: 14, food_street: 14, views_rooftop: 14,
  fun_activities: 13, shopping_mall: 12, sea_island: 12, mountain_mist: 12, nature_camping: 10, city_parks: 10,
  wellness_retreat: 10, oldtown_culture: 9, museum_learning: 7, temple_mu: 5,
};
// Provinces people travel to for a weekend or a city break
const TRIP_PROVINCES = new Set(['กรุงเทพฯ', 'เชียงใหม่', 'ภูเก็ต', 'ชลบุรี', 'ประจวบคีรีขันธ์', 'กระบี่', 'สุราษฎร์ธานี', 'นครราชสีมา', 'กาญจนบุรี', 'เชียงราย', 'พระนครศรีอยุธยา', 'ระยอง', 'เพชรบุรี', 'น่าน', 'แม่ฮ่องสอน', 'สงขลา', 'นครปฐม', 'นนทบุรี', 'ปทุมธานี', 'สมุทรสงคราม']);
// Offices and community groups listed as attractions: rarely a place to go out to
const INSTITUTIONAL = /วิสาหกิจ|สำนักงาน|องค์การบริหาร|เทศบาล|กลุ่มแม่บ้าน|กลุ่มอาชีพ|ศูนย์เรียนรู้|ศูนย์พัฒนา|ศูนย์ส่งเสริม|โรงเรียน|สถานีพัฒนา|ศูนย์ศิลปาชีพ/;
const STOCK_IMAGE = /unsplash|placeholder/i;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function scoreSpot(spot: LifestyleSpotItem): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const hasPhoto = Boolean(spot.image) && !STOCK_IMAGE.test(spot.image);
  if (hasPhoto) score += 10;
  else reasons.push('ไม่มีรูปจริง');
  if ((spot.galleryImages?.length ?? 0) >= 2) score += 5;

  const text = (spot.description || '').replace(/<[^>]+>/g, '').trim();
  if (text.length >= 150) score += 8;
  if (text.length >= 350) {
    score += 5;
    reasons.push('คำบรรยายละเอียด');
  }
  if (text.length < 60) {
    score -= 10;
    reasons.push('คำบรรยายสั้นมาก');
  }

  // Interest: views on the Tourism Directory, or monthly Wikipedia page views for OSM places
  const ttd = spot.popularity || 0;
  const wiki = spot.wikiMonthlyViews || 0;
  const interest = Math.max(clamp((Math.log10(Math.max(ttd, 1)) - 3) * 12, 0, 20), clamp((Math.log10(Math.max(wiki, 1)) - 2) * 10, 0, 20));
  score += interest;
  if (interest >= 14) reasons.push(wiki ? `คนอ่านบน Wikipedia ${wiki.toLocaleString('en-US')} ครั้ง/เดือน` : `คนเปิดดู ${ttd.toLocaleString('en-US')} ครั้ง`);
  else if (interest <= 4) reasons.push('คนสนใจน้อย');

  const vibe = getSpotVibeCategory(spot);
  const fit = VIBE_FIT[vibe] ?? 8;
  score += fit;
  if (fit >= 14) reasons.push('ตรงกับสายเที่ยวของคนรุ่นใหม่');

  if (TRIP_PROVINCES.has(spot.province)) {
    score += 5;
    reasons.push('อยู่ในเมืองท่องเที่ยวหลัก');
  }
  if (spot.openHours && !/ไม่ระบุ/.test(spot.openHours)) score += 2;
  if (spot.contact && Object.values(spot.contact).some(Boolean)) score += 2;
  if (spot.latitude && spot.longitude) score += 1;

  if (INSTITUTIONAL.test(spot.title)) {
    score -= 15;
    reasons.push('ชื่อเป็นหน่วยงานหรือกลุ่มชุมชน');
  }
  if (spot.suggestedByMemberId) reasons.push('สมาชิกแนะนำ');

  return { score: Math.round(clamp(score, 0, 100)), reasons };
}

/** Featured is a small share, so it means something: the top of the catalog, plus the best few of each province */
const FEATURED_SHARE = 0.12;
const FEATURED_PER_PROVINCE = 3;
/** The weakest quarter leaves browsing */
const HIDDEN_SHARE = 0.25;

/** The score at a share from the top (0.12 → the score the top 12% reach) */
function cutAt(scores: number[], shareFromTop: number): number {
  const sorted = [...scores].sort((a, b) => b - a);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * shareFromTop) - 1))] ?? 0;
}

/**
 * Scores and tiers for the whole catalog. Featured: the top share nationwide, or the best few of a province (when they
 * are at least in the upper half). Hidden: the weakest share. Cut points follow the catalog, so they stay fair as it grows.
 * Overrides and staff notes are kept as they are.
 */
export function curateCatalog(spots: LifestyleSpotItem[], now = new Date()): Array<{ id: string; curation: SpotCuration }> {
  const scored = spots.map((spot) => ({ spot, ...scoreSpot(spot) }));
  const scores = scored.map((row) => row.score);
  const featuredCut = cutAt(scores, FEATURED_SHARE);
  const hiddenCut = cutAt(scores, 1 - HIDDEN_SHARE);
  const median = cutAt(scores, 0.5);
  const bestOfProvince = new Set<string>();
  const byProvince = new Map<string, typeof scored>();
  for (const row of scored) byProvince.set(row.spot.province, [...(byProvince.get(row.spot.province) ?? []), row]);
  for (const rows of byProvince.values()) {
    rows.sort((a, b) => b.score - a.score).slice(0, FEATURED_PER_PROVINCE).filter((r) => r.score >= median).forEach((r) => bestOfProvince.add(r.spot.id));
  }
  const computedAt = now.toISOString();
  return scored.map(({ spot, score, reasons }) => {
    const tier: CurationTier = score >= featuredCut || bestOfProvince.has(spot.id) ? 'featured' : score < hiddenCut ? 'hidden' : 'standard';
    const kept = spot.curation;
    return {
      id: spot.id,
      curation: {
        score,
        tier,
        reasons: bestOfProvince.has(spot.id) && score < featuredCut ? [...reasons, 'ติดอันดับต้นของจังหวัด'] : reasons,
        computedAt,
        ...(kept?.override && { override: kept.override, overrideNote: kept.overrideNote, overrideBy: kept.overrideBy, overrideAt: kept.overrideAt }),
      },
    };
  });
}
