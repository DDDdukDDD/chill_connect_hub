/**
 * Smart Search Utilities for Chill & Connect Hub
 * Supports multi-token tokenization, Thai lifestyle synonym expansion, and fuzzy keyword matching.
 */

export const LIFESTYLE_SEARCH_SYNONYMS: Record<string, string[]> = {
  // Outdoor, Hiking & Trekking
  เดินป่า: ['เดินป่า', 'trekking', 'hiking', 'trail', 'เทรล', 'ศึกษาธรรมชาติ', 'ผืนป่า'],
  ปีนเขา: ['ปีนเขา', 'ปีนผา', 'ปีน', 'climbing', 'bouldering', 'ไต่เขา', 'หน้าผาจำลอง', 'ผา'],
  กางเต็นท์: ['กางเต็นท์', 'camping', 'แคมป์', 'แคมปิ้ง', 'outdoor', 'เอาต์ดอร์', 'แคมป์ปิ้ง'],
  คายัค: ['คายัค', 'kayak', 'sup board', 'ซับบอร์ด', 'พายเรือ'],

  // Running & Fitness
  วิ่ง: ['วิ่ง', 'running', 'marathon', 'มาราธอน', 'trail', 'fun run', 'hyrox', 'jogging', '10k', '21k', 'city run'],
  ฟิตเนส: ['ฟิตเนส', 'fitness', 'hyrox', 'ไฮร็อกซ์', 'bootcamp', 'workout', 'ยืดเหยียด', 'functional'],

  // Cafe, Specialty & Food
  คาเฟ่: ['คาเฟ่', 'cafe', 'coffee', 'กาแฟ', 'slow bar', 'สโลว์บาร์', 'drip', 'ดริป', 'specialty', 'roastery'],
  ชา: ['ชา', 'ชงชา', 'tea', 'มัทฉะ', 'matcha', 'tearoom'],
  อาหาร: ['อาหาร', 'cooking', 'baking', 'ทำอาหาร', 'อบขนม', 'เบเกอรี่', 'sourdough'],

  // Wellness & Healing
  โยคะ: ['โยคะ', 'yoga', 'sound bath', 'soundbath', 'สมาธิ', 'ฮีลใจ', 'mindfulness', 'บำบัด', 'ขันธิเบต', 'พักใจ'],

  // Arts, Crafts & Workshop
  ศิลปะ: ['ศิลปะ', 'art', 'craft', 'คราฟต์', 'workshop', 'เวิร์กช็อป', 'เซรามิก', 'pottery', 'ปั้นดิน', 'painting', 'สีน้ำ', 'เทียน', 'candle', 'ภาพวาด', 'tufting'],

  // Board Games & Social
  บอร์ดเกม: ['บอร์ดเกม', 'board game', 'boardgame', 'catan', 'quiz', 'party', 'เกมกระดาน'],

  // Music & Festivals
  ดนตรี: ['ดนตรี', 'music', 'acoustic', 'jazz', 'concert', 'คอนเสิร์ต', 'ไวนิล', 'vinyl', 'live music'],

  // Expos, Fairs & Conventions
  เอ็กซ์โป: ['expo', 'มหกรรม', 'fair', 'festival', 'qsncc', 'bitec', 'impact', 'สิริกิติ์', 'นิทรรศการ'],

  // Photography & City Walk
  ถ่ายรูป: ['ถ่ายรูป', 'ถ่ายภาพ', 'photo', 'photowalk', 'กล้อง', 'ฟิล์ม', 'สตรีท', 'street'],
};

/**
 * Extracts clean search tokens from a raw user query string.
 * Splits by whitespace, comma, slash, and common delimiters.
 */
export function getSearchTokens(query: string): string[] {
  if (!query || typeof query !== 'string') return [];
  return query
    .toLowerCase()
    .split(/[\s,&/()+_—–-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Smart search matcher for event & spot text.
 * Returns true if the query matches via exact phrase, multi-token matching, or synonym expansion.
 */
export function matchSearchQuery(searchableText: string, query: string): boolean {
  if (!query || !query.trim()) return true;

  const normalizedText = searchableText.toLowerCase();
  const rawQ = query.toLowerCase().trim();

  // 1. Direct or partial full phrase match (highest fidelity)
  if (normalizedText.includes(rawQ)) {
    return true;
  }

  // 2. Tokenize into individual keyword terms
  const tokens = getSearchTokens(rawQ);
  if (tokens.length === 0) return true;

  // 3. Check if ANY token directly matches or matches via lifestyle synonyms
  return tokens.some((token) => {
    // 3.1 Direct token match
    if (normalizedText.includes(token)) return true;

    // 3.2 Check synonym groups
    for (const [key, synonyms] of Object.entries(LIFESTYLE_SEARCH_SYNONYMS)) {
      if (token.includes(key) || key.includes(token)) {
        if (synonyms.some((syn) => normalizedText.includes(syn))) {
          return true;
        }
      }
    }

    return false;
  });
}
