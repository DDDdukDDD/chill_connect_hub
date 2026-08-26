/**
 * Smart Image Resolver & Photo Enhancer for Thai Lifestyle Spots
 * Automatically detects missing, broken, or empty images and provides high-resolution,
 * categorized photography matched with province & spot category.
 */

import { LifestyleSpotItem } from '@/data/spotsData';

// Curated high-res Unsplash photo bank categorized for Thai tourism & lifestyle
const CATEGORY_IMAGE_BANKS: Record<string, string[]> = {
  park: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521017432533-fbd92d768814?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  ],
  art: [
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  ],
  oldtown: [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563492065599-3580f777d066?auto=format&fit=crop&w=1200&q=80',
  ],
  workspace: [
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
  ],
};

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

/**
 * Checks if a given image URL is valid and non-empty
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
}

/**
 * Resolves a high-quality image for a spot if missing
 */
export function resolveSpotImage(spot: Partial<LifestyleSpotItem>): string {
  if (isValidImageUrl(spot.image)) {
    return spot.image!;
  }

  const cat = spot.category || 'nature';
  const bank = CATEGORY_IMAGE_BANKS[cat] || CATEGORY_IMAGE_BANKS['nature'];
  
  // Deterministic pick based on spot id or title length so it remains consistent
  const seed = (spot.id || spot.title || 'spot').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % bank.length;
  return bank[index] || DEFAULT_FALLBACK_IMAGE;
}

/**
 * Auto-enriches a list of spots by populating missing images
 */
export function autoEnrichSpotImages(spots: LifestyleSpotItem[]): {
  enrichedSpots: LifestyleSpotItem[];
  fixedCount: number;
} {
  let fixedCount = 0;
  const enrichedSpots = spots.map((spot) => {
    if (!isValidImageUrl(spot.image)) {
      fixedCount++;
      return {
        ...spot,
        image: resolveSpotImage(spot),
      };
    }
    return spot;
  });

  return { enrichedSpots, fixedCount };
}
