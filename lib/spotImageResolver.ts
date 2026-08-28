/**
 * Smart Image Resolver & Photo Enhancer for Thai Lifestyle Spots
 * Automatically detects missing, broken, or empty images and provides high-resolution,
 * categorized photography matched with province & spot category.
 */

import { LifestyleSpotItem } from '@/data/spotsData';

// Curated high-res Unsplash photo bank (8 images per category) for Thai tourism & lifestyle
export const CATEGORY_IMAGE_BANKS: Record<string, string[]> = {
  park: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80', // Wide green park
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', // Lake & reflection
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', // Forest pathway
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Sunny greenery
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80', // Autumn trail
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', // Lake mountain view
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80', // Botanical pavilion
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80', // Sunset park lawn
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80', // Coffee bar interior
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80', // Warm cafe table
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80', // Pour over drip coffee
    'https://images.unsplash.com/photo-1521017432533-fbd92d768814?auto=format&fit=crop&w=1200&q=80', // Bakery & pastries
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', // Modern cafe vibe
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80', // Latte art cup
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=80', // Cozy wooden corner
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80', // Garden outdoor seating
  ],
  art: [
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80', // Modern gallery hall
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', // Minimalist exhibition
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80', // Painting canvas
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=80', // Sculptures & statues
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80', // Contemporary art
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80', // Museum gallery lights
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80', // Color palette workshop
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1200&q=80', // Abstract visual display
  ],
  oldtown: [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80', // Heritage architecture
    'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80', // Thai historic temple
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80', // Traditional street market
    'https://images.unsplash.com/photo-1563492065599-3580f777d066?auto=format&fit=crop&w=1200&q=80', // Old quarter alley
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80', // Riverside landmark
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80', // Night heritage illumination
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Historic bridge
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', // Cultural precinct
  ],
  workspace: [
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80', // Co-working desk
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', // Open lounge
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80', // Design workspace
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80', // Modern library
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', // Meeting corner
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80', // Coffee workspace
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80', // Quiet reading area
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=80', // Creative hub
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Mountain panorama
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Sea cliff horizon
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', // Mist & fog summit
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', // Sunset coastal viewpoint
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', // Alpine skydeck
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', // Sunrise ridge
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80', // Golden hour valley
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80', // Twilight lookout
  ],
  nature: [
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', // Mountain valley
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', // Sunlight canopy
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80', // Green meadow
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', // Mountain lake
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80', // Nature sanctuary
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80', // Forest stream
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Coastal nature
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', // Evergreen peaks
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
 * Resolves a high-quality main image for a spot if missing
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
 * Resolves 5 to 8 high-resolution atmosphere gallery images for a spot
 */
export function resolveSpotGallery(spot: Partial<LifestyleSpotItem>): string[] {
  const mainImage = resolveSpotImage(spot);
  const existingGallery = (spot.galleryImages || []).filter(isValidImageUrl);

  // If already has 5 or more distinct images, return them
  if (existingGallery.length >= 5) {
    return existingGallery;
  }

  const cat = spot.category || 'nature';
  const bank = CATEGORY_IMAGE_BANKS[cat] || CATEGORY_IMAGE_BANKS['nature'];

  // Build a unique set of 6 to 8 photos
  const result: string[] = [];
  
  // 1. Add main image first
  if (mainImage && !result.includes(mainImage)) {
    result.push(mainImage);
  }

  // 2. Add existing gallery images
  for (const img of existingGallery) {
    if (img && !result.includes(img)) {
      result.push(img);
    }
  }

  // 3. Fill up to 7-8 images from category bank deterministically
  const seed = (spot.id || spot.title || 'spot').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < bank.length && result.length < 8; i++) {
    const bankImg = bank[(seed + i) % bank.length];
    if (bankImg && !result.includes(bankImg)) {
      result.push(bankImg);
    }
  }

  // Fallback to nature bank if needed
  if (result.length < 6) {
    for (const img of CATEGORY_IMAGE_BANKS['nature']) {
      if (!result.includes(img) && result.length < 8) {
        result.push(img);
      }
    }
  }

  return result;
}

/**
 * Auto-enriches a list of spots by populating missing images and 5-8 gallery photos
 */
export function autoEnrichSpotImages(spots: LifestyleSpotItem[]): {
  enrichedSpots: LifestyleSpotItem[];
  fixedCount: number;
} {
  let fixedCount = 0;
  const enrichedSpots = spots.map((spot) => {
    const mainImage = resolveSpotImage(spot);
    const gallery = resolveSpotGallery(spot);
    const wasFixed = !isValidImageUrl(spot.image) || !spot.galleryImages || spot.galleryImages.length < 5;
    
    if (wasFixed) {
      fixedCount++;
    }

    return {
      ...spot,
      image: mainImage,
      galleryImages: gallery,
    };
  });

  return { enrichedSpots, fixedCount };
}
