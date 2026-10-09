/**
 * Price Formatting & Parsing Utilities
 * Chill & Connect Hub - Luxury Editorial Design System
 * 
 * Provides unified, bulletproof price formatting for:
 * 1. Card Views (clean single-line badge: price range or clean free badge)
 * 2. Detail Views (summary header + parsed ticket tier chips / breakdown)
 */

export interface ParsedEventPriceTier {
  label?: string;
  price: string;
  value: number;
  isOnline?: boolean;
}

export interface ParsedEventPrice {
  isFree: boolean;
  badge: string; // Compact badge string for cards e.g. "฿1,200 - ฿6,900" or "เข้าชมฟรี"
  displayPrice: string; // Header display for detail pages
  min?: number;
  max?: number;
  hasMultipleTiers: boolean;
  tiers: ParsedEventPriceTier[];
  rawText: string;
  remark?: string;
}

/**
 * Clean and normalize a tier label (removes brackets, trailing 'บาท', excess whitespace)
 */
function cleanTierLabel(label?: string): string | undefined {
  if (!label) return undefined;
  const cleaned = label
    .replace(/บาท/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned && cleaned !== 'บาท' ? cleaned : undefined;
}

/**
 * Checks if a price string represents a free event
 */
export function isPriceFree(rawPrice?: string | null): boolean {
  if (!rawPrice) return true;
  const clean = rawPrice.trim();
  if (clean === '' || clean.startsWith('ฟรี') || clean.startsWith('เข้าฟรี') || clean.startsWith('เข้าร่วมฟรี')) {
    // If it contains free and no standalone high price numbers, treat as free
    return !/\b[1-9]\d{2,}\b/.test(clean.replace(/\([^)]*\)/g, ''));
  }
  return clean.includes('ฟรี') && !/\b[1-9]\d{2,}\b/.test(clean.replace(/\([^)]*\)/g, ''));
}

/**
 * Parses any raw event price string into structured, editorial-ready data
 */
export function parseEventPrice(rawPrice?: string | null, fallbackFreeText: string = 'เข้าชมฟรี'): ParsedEventPrice {
  if (!rawPrice || rawPrice.trim() === '') {
    return {
      isFree: true,
      badge: fallbackFreeText === 'ฟรี' ? 'ฟรี' : 'เข้าชมฟรี',
      displayPrice: fallbackFreeText,
      hasMultipleTiers: false,
      tiers: [],
      rawText: ''
    };
  }

  const clean = rawPrice.trim();

  // 1. Free detection
  if (isPriceFree(clean)) {
    const remark = clean
      .replace(/^(เข้าชม|เข้าร่วม)?ฟรี!?\s*/, '')
      .replace(/[()]/g, '')
      .trim();

    return {
      isFree: true,
      badge: 'ฟรี',
      displayPrice: clean.includes('(') ? clean : fallbackFreeText,
      remark: remark || undefined,
      hasMultipleTiers: false,
      tiers: [],
      rawText: clean
    };
  }

  // 2. Unspecified price
  if (clean === 'ไม่ระบุราคา') {
    return {
      isFree: false,
      badge: 'ไม่ระบุราคา',
      displayPrice: 'ไม่ระบุราคา',
      hasMultipleTiers: false,
      tiers: [],
      rawText: clean
    };
  }

  // 3. Extract all valid currency numbers
  // Matches formatted numbers like 6,900 or 1200 or ฿1,500
  const numMatches = clean.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d{3,6}\b/g);
  let min = Infinity;
  let max = -Infinity;
  const numbers: number[] = [];

  if (numMatches) {
    for (const m of numMatches) {
      const val = parseInt(m.replace(/,/g, ''), 10);
      // Valid ticket price range between 50 and 100,000 THB
      if (!isNaN(val) && val >= 50 && val <= 100000) {
        numbers.push(val);
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
  }

  let badge = clean.replace(/\s*\([^)]*\)/g, '').trim();
  let hasRange = false;

  if (numbers.length >= 2 && min !== max) {
    badge = `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
    hasRange = true;
  } else if (numbers.length >= 1) {
    badge = `฿${numbers[0].toLocaleString()}`;
  } else if (badge.length > 14) {
    badge = badge.slice(0, 12) + '...';
  }

  // 4. Multi-tier parsing (split by / or comma between non-digits)
  const isMultiTier = clean.includes('/') || (/[^\d],[^\d]/.test(clean) && numbers.length > 1) || (/, \D/.test(clean) && numbers.length > 1);
  const tiers: ParsedEventPriceTier[] = [];

  if (isMultiTier) {
    // Split by slash OR comma followed by non-digits
    const tokens = clean
      .split(/\s*\/\s*|,\s*(?=[^\d\s]|[\u0E00-\u0E7F])/g)
      .map(t => t.trim())
      .filter(Boolean);

    for (const t of tokens) {
      // Check for combined tokens like "1,500 บาท Live Streaming 1,500"
      const streamingMatch = t.match(/^(.*?บาท)?\s*(Live Streaming.*|Rerun.*)$/i);
      let subTokens = [t];
      if (streamingMatch && streamingMatch[1] && streamingMatch[2]) {
        subTokens = [streamingMatch[1].trim(), streamingMatch[2].trim()];
      }

      for (const item of subTokens) {
        const itemNumMatch = item.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d{3,6}\b/);
        if (itemNumMatch) {
          const val = parseInt(itemNumMatch[0].replace(/,/g, ''), 10);
          const rawLabel = item.replace(itemNumMatch[0], '');
          const label = cleanTierLabel(rawLabel);
          tiers.push({
            label,
            price: `฿${val.toLocaleString()}`,
            value: val,
            isOnline: /live|streaming|rerun/i.test(item)
          });
        }
      }
    }
  }

  return {
    isFree: false,
    badge,
    displayPrice: hasRange ? badge : clean,
    min: min !== Infinity ? min : undefined,
    max: max !== -Infinity ? max : undefined,
    hasMultipleTiers: tiers.length > 1,
    tiers,
    rawText: clean
  };
}

/**
 * Returns a compact 1-line badge for card views (e.g. "฿1,200 - ฿6,900" or "ฟรี")
 */
export function formatEventBadgePrice(rawPrice?: string | null, fallbackFreeText: string = 'ฟรี'): string {
  const parsed = parseEventPrice(rawPrice, fallbackFreeText);
  return parsed.badge;
}
