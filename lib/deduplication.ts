import { AdminEventItem } from './eventsStore';
import { ScrapedRawEvent } from './aiTagger';

// Text Normalizer for robust comparison
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\u0E00-\u0E7F]/gi, '') // Keep alphanumeric and Thai characters
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Token Jaccard Similarity (0.0 to 1.0)
export function calculateSimilarity(strA: string, strB: string): number {
  const normA = normalizeText(strA);
  const normB = normalizeText(strB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  if (union.size === 0) return 0.0;
  return intersection.size / union.size;
}

// Check if a newly scraped event is a duplicate of an existing event in the store
export function isDuplicateEvent(
  raw: ScrapedRawEvent,
  existingEvents: AdminEventItem[]
): { isDuplicate: boolean; matchedEvent?: AdminEventItem; reason?: string } {
  const rawNormTitle = normalizeText(raw.rawTitle);
  const rawNormLoc = normalizeText(raw.rawLocation);
  const rawNormDate = normalizeText(raw.rawDate);

  for (const existing of existingEvents) {
    const existNormTitle = normalizeText(existing.title);
    const existNormLoc = normalizeText(existing.location);
    const existNormDate = normalizeText(existing.date);

    // Rule 1: Exact Normalized Title Match
    if (rawNormTitle === existNormTitle) {
      return {
        isDuplicate: true,
        matchedEvent: existing,
        reason: 'ชื่องานตรงกัน 100% (Exact Title Match)',
      };
    }

    // Rule 2: High Title Similarity (>= 75%) + Same Date OR Same Location
    const titleSim = calculateSimilarity(raw.rawTitle, existing.title);
    if (titleSim >= 0.75) {
      const isSameDate = rawNormDate && existNormDate && (rawNormDate.includes(existNormDate) || existNormDate.includes(rawNormDate));
      const isSameLoc = rawNormLoc && existNormLoc && (rawNormLoc.includes(existNormLoc) || existNormLoc.includes(rawNormLoc));

      if (isSameDate || isSameLoc) {
        return {
          isDuplicate: true,
          matchedEvent: existing,
          reason: `ความคล้ายคลึงชื่องาน ${Math.round(titleSim * 100)}% + สถานที่/วันที่ตรงกัน`,
        };
      }
    }

    // Rule 3: Exact URL Match (if available)
    if (raw.sourceUrl && existing.sourceUrl && raw.sourceUrl === existing.sourceUrl) {
      return {
        isDuplicate: true,
        matchedEvent: existing,
        reason: 'URL ต้นทางตรงกัน (Exact Source URL Match)',
      };
    }
  }

  return { isDuplicate: false };
}
