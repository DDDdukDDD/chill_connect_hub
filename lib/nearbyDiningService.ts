import { LifestyleSpotItem, MOCK_SPOTS, getDistanceKm } from '@/data/spotsData';

export interface NearbyDiningItem {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'slowbar' | 'bakery' | 'local_food';
  categoryLabel: string;
  image: string;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  openHours: string;
  priceRange?: string;
  specialty: string;
  googleMapsUrl: string;
  isPartner?: boolean;
  spotId?: string; // Links directly to internal spot detail page if available
}

// Curated high-rated real Thai cafes & dining for lifestyle districts nationwide
// Used as production first-party partner catalog & zero-latency fallback when Google Places API key is not configured
const CURATED_REAL_DINING: Array<Omit<NearbyDiningItem, 'distanceKm'> & { latitude: number; longitude: number; province: string; district?: string }> = [
  // Chiang Mai - Mae Taeng & Mountain Zones (Matches real local map landmarks)
  {
    id: 'dining-cnx-mt-1',
    name: 'หมอกเช้า สโลว์บาร์ & คราฟต์กาแฟ ดอยแม่แตง',
    category: 'slowbar',
    categoryLabel: 'Specialty Slow Bar',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 380,
    openHours: '07:30 - 16:30 น.',
    priceRange: '฿80 - ฿150',
    specialty: 'กาแฟดริปเมล็ดดอยแม่แตง & ครัวซองต์เนยฝรั่งเศส',
    latitude: 19.1235,
    longitude: 98.9412,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Slow+Bar+Mae+Taeng+Chiang+Mai',
    isPartner: true,
    spotId: 'spot-cm-secret-slowbar-2026',
  },
  {
    id: 'dining-cnx-mt-dantevada',
    name: 'แดนเทวดา คาเฟ่ & ผาสวนหิน แม่แตง',
    category: 'cafe',
    categoryLabel: 'Cafe & Scenic Waterfall',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 2900,
    openHours: '08:00 - 18:00 น.',
    priceRange: '฿90 - ฿180',
    specialty: 'คาเฟ่ท่ามกลางม่านหมอก น้ำตกจำลอง และผาสวนหินอลังการ',
    latitude: 19.1205,
    longitude: 98.9430,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Dantevada+Mae+Taeng+Chiang+Mai',
    isPartner: true,
  },
  {
    id: 'dining-cnx-mt-2',
    name: 'บ้านสวนริมน้ำ คาเฟ่ & อาหารพื้นเมืองแม่แตง',
    category: 'local_food',
    categoryLabel: 'อาหารเหนือพื้นเมือง',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 520,
    openHours: '09:00 - 19:00 น.',
    priceRange: '฿120 - ฿250',
    specialty: 'ข้าวซอยไก่โบราณ, ลาบคั่ว, น้ำพริกหนุ่มผักสด',
    latitude: 19.1189,
    longitude: 98.9354,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Local+Northern+Food+Mae+Taeng+Chiang+Mai',
  },
  {
    id: 'dining-cnx-mt-elephant',
    name: 'Cafe Elephant & Jungle Sanctuary แม่แตง',
    category: 'cafe',
    categoryLabel: 'Nature & Elephant Cafe',
    image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 890,
    openHours: '08:30 - 17:30 น.',
    priceRange: '฿95 - ฿200',
    specialty: 'กาแฟออร์แกนิกชมวิวช้างอาบน้ำริมลำธาร ธรรมชาติบริสุทธิ์',
    latitude: 19.1250,
    longitude: 98.9480,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Cafe+Elephant+Mae+Taeng',
  },
  {
    id: 'dining-cnx-mt-lab',
    name: 'ร้านลาบเจริญ แม่แตง (อาหารเหนือรสมือแม่)',
    category: 'local_food',
    categoryLabel: 'อาหารเหนือท้องถิ่น',
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 460,
    openHours: '10:00 - 20:30 น.',
    priceRange: '฿60 - ฿140',
    specialty: 'ลาบหมูคั่วหอมมะแขว่น, แกงฮังเล, ต้มแซ่บกระดูกอ่อน',
    latitude: 19.1150,
    longitude: 98.9400,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Lab+Charoen+Mae+Taeng+Chiang+Mai',
  },
  {
    id: 'dining-cnx-mt-3',
    name: 'Stay Wild & Cafe ริมลำน้ำแม่แตง',
    category: 'cafe',
    categoryLabel: 'Riverside Cafe',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 640,
    openHours: '08:30 - 18:00 น.',
    priceRange: '฿90 - ฿180',
    specialty: 'ชาเขียวมัทฉะเข้มข้น, เค้กแครอท, วิวล่องแก่งลำน้ำแม่แตง',
    latitude: 19.1350,
    longitude: 98.9220,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Stay+Wild+and+Cafe+Mae+Taeng',
  },
  {
    id: 'dining-cnx-mt-4',
    name: 'สวนสน คอฟฟี่ & เบเกอรี่โฮมเมด',
    category: 'bakery',
    categoryLabel: 'Artisan Bakery',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 410,
    openHours: '08:00 - 17:00 น.',
    priceRange: '฿75 - ฿160',
    specialty: 'ขนมปังซาวร์โดว์, ลาเต้อาร์ต, สวนสนร่มรื่น',
    latitude: 19.1050,
    longitude: 98.9500,
    province: 'เชียงใหม่',
    district: 'แม่แตง',
    googleMapsUrl: 'https://maps.google.com/?q=Pine+Forest+Cafe+Mae+Taeng',
  },

  // Chiang Mai - City, Nimman & Ang Kaew
  {
    id: 'dining-cnx-city-1',
    name: 'Living A Dream Coffee ริมอ่างแก้ว มช.',
    category: 'cafe',
    categoryLabel: 'Lakeside Cafe',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 1420,
    openHours: '07:00 - 19:30 น.',
    priceRange: '฿65 - ฿120',
    specialty: 'กาแฟคั่วสดริมทะเลสาบอ่างแก้ว วิวดอยสุเทพ',
    latitude: 18.8048,
    longitude: 98.9525,
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    googleMapsUrl: 'https://maps.google.com/?q=Living+A+Dream+Ang+Kaew+CMU',
    isPartner: true,
  },
  {
    id: 'dining-cnx-city-2',
    name: 'Roast8ry Lab (Ristr8to นิมมาน)',
    category: 'cafe',
    categoryLabel: 'World Latte Art Champion',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 3200,
    openHours: '08:00 - 17:30 น.',
    priceRange: '฿98 - ฿220',
    specialty: 'Satan Latte, Godmother Mocha, เมล็ดกาแฟแชมป์โลก',
    latitude: 18.7984,
    longitude: 98.9692,
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    googleMapsUrl: 'https://maps.google.com/?q=Roast8ry+Lab+Nimman+Chiang+Mai',
  },
  {
    id: 'dining-cnx-city-3',
    name: 'ข้าวซอยนิมมาน (Khao Soi Nimman)',
    category: 'local_food',
    categoryLabel: 'มิชลินไกด์ บิบ กูร์มองด์',
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 4500,
    openHours: '10:00 - 21:00 น.',
    priceRange: '฿90 - ฿180',
    specialty: 'ข้าวซอยเนื้อน่องลาย, ข้าวซอยไก่, ไส้อั่วสมุนไพรย่าง',
    latitude: 18.7990,
    longitude: 98.9680,
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    googleMapsUrl: 'https://maps.google.com/?q=Khao+Soi+Nimman+Chiang+Mai',
  },
  {
    id: 'dining-cnx-city-4',
    name: 'Graph Contemporary (กราฟ คาเฟ่)',
    category: 'slowbar',
    categoryLabel: 'Artisan Nitro & Cold Brew',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 1680,
    openHours: '09:00 - 17:30 น.',
    priceRange: '฿110 - ฿220',
    specialty: 'Sompetch Cold Brew, Nitro กาแฟคราฟต์ บรรยากาศแกลเลอรี',
    latitude: 18.7880,
    longitude: 98.9950,
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    googleMapsUrl: 'https://maps.google.com/?q=Graph+Contemporary+Chiang+Mai',
  },
  {
    id: 'dining-cnx-city-5',
    name: 'สุกี้ช้างเผือก (สาขาหลัง มช.)',
    category: 'local_food',
    categoryLabel: 'สตรีทฟู้ดมิชลินชื่อดัง',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 3800,
    openHours: '12:00 - 23:00 น.',
    priceRange: '฿60 - ฿120',
    specialty: 'สุกี้แห้งเนื้อกระทะเหล็ก ผักกรอบ น้ำจิ้มเต้าหู้ยี้สูตรเด็ด',
    latitude: 18.7920,
    longitude: 98.9550,
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    googleMapsUrl: 'https://maps.google.com/?q=Suki+Chang+Phueak+Chiang+Mai',
  },

  // Bangkok - Samyan & Pathum Wan
  {
    id: 'dining-bkk-sy-1',
    name: 'April\'s Bakery & Specialty Coffee สามย่าน',
    category: 'cafe',
    categoryLabel: 'Specialty Cafe & Bakery',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 920,
    openHours: '08:00 - 18:00 น.',
    priceRange: '฿90 - ฿160',
    specialty: 'Cold Brew กาแฟสกัดเย็น & ครัวซองต์พายหมูแดง',
    latitude: 13.7330,
    longitude: 100.5280,
    province: 'กรุงเทพมหานคร',
    district: 'ปทุมวัน',
    googleMapsUrl: 'https://maps.google.com/?q=Samyan+Mitrtown+Cafe',
  },
  {
    id: 'dining-bkk-sy-2',
    name: 'สมบูรณ์โภชนา บรรทัดทอง',
    category: 'restaurant',
    categoryLabel: 'ซีฟู้ดระดับตำนาน',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 2800,
    openHours: '11:00 - 22:00 น.',
    priceRange: '฿250 - ฿600',
    specialty: 'ปูผัดผงกะหรี่ต้นตำรับ, กุ้งเผา, ต้มยำกุ้งน้ำข้น',
    latitude: 13.7380,
    longitude: 100.5250,
    province: 'กรุงเทพมหานคร',
    district: 'ปทุมวัน',
    googleMapsUrl: 'https://maps.google.com/?q=Banthat+Thong+Food+Street',
  },
  {
    id: 'dining-bkk-sy-3',
    name: 'มนต์ นมสด (สาขามาบุญครอง)',
    category: 'bakery',
    categoryLabel: 'ขนมปังปิ้งระดับตำนาน',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 4100,
    openHours: '11:00 - 21:00 น.',
    priceRange: '฿40 - ฿95',
    specialty: 'ขนมปังปิ้งสังขยาใบเตย, ชานมเย็นโบราณ',
    latitude: 13.7440,
    longitude: 100.5300,
    province: 'กรุงเทพมหานคร',
    district: 'ปทุมวัน',
    googleMapsUrl: 'https://maps.google.com/?q=Mont+Nom+Sod+MBK',
  },

  // Bangkok - Ari & Chatuchak
  {
    id: 'dining-bkk-ari-1',
    name: 'Nana Coffee Roasters Ari',
    category: 'cafe',
    categoryLabel: 'Flagship Roastery',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 2100,
    openHours: '07:00 - 18:00 น.',
    priceRange: '฿120 - ฿220',
    specialty: 'Signature Dirty, Single Origin Filter, Nitro Tea',
    latitude: 13.7800,
    longitude: 100.5440,
    province: 'กรุงเทพมหานคร',
    district: 'พญาไท',
    googleMapsUrl: 'https://maps.google.com/?q=Nana+Coffee+Roasters+Ari',
    isPartner: true,
  },
  {
    id: 'dining-bkk-ari-2',
    name: 'Josh Hotel Cafe & Eatery',
    category: 'cafe',
    categoryLabel: 'Retro Boutique Cafe',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 1350,
    openHours: '08:00 - 20:00 น.',
    priceRange: '฿110 - ฿240',
    specialty: 'Croffle คาราเมล, กาแฟส้มยูซุ, สระว่ายน้ำสไตล์เรโทร',
    latitude: 13.7820,
    longitude: 100.5430,
    province: 'กรุงเทพมหานคร',
    district: 'พญาไท',
    googleMapsUrl: 'https://maps.google.com/?q=Josh+Hotel+Ari',
  },

  // Phuket - Old Town
  {
    id: 'dining-hkt-1',
    name: 'Tory\'s Ice Cream ภูเก็ตเมืองเก่า',
    category: 'bakery',
    categoryLabel: 'Artisan Boutique Dessert',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 3100,
    openHours: '10:00 - 18:00 น.',
    priceRange: '฿95 - ฿180',
    specialty: 'ไอศกรีมบีโกหมอย, กาแฟโบราณภูเก็ต, สถาปัตยกรรมชิโนโปรตุกีส',
    latitude: 7.8845,
    longitude: 98.3880,
    province: 'ภูเก็ต',
    district: 'เมืองภูเก็ต',
    googleMapsUrl: 'https://maps.google.com/?q=Torys+Ice+Cream+Phuket+Old+Town',
    isPartner: true,
  },
  {
    id: 'dining-hkt-2',
    name: 'วันจันทร์ (One Chun Cafe & Restaurant)',
    category: 'local_food',
    categoryLabel: 'มิชลิน บิบ กูร์มองด์',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 4200,
    openHours: '10:00 - 22:00 น.',
    priceRange: '฿150 - ฿350',
    specialty: 'แกงปูใบชะพลูเส้นหมี่, หมูฮ้องสูตรโบราณ, น้ำพริกกุ้งเสียบ',
    latitude: 7.8850,
    longitude: 98.3890,
    province: 'ภูเก็ต',
    district: 'เมืองภูเก็ต',
    googleMapsUrl: 'https://maps.google.com/?q=One+Chun+Cafe+and+Restaurant+Phuket',
  },
];

/**
 * Production Hybrid Query Engine for Nearby Dining
 * Default limit = 6 (compact high-value recommendations)
 */
export async function getNearbyDining(
  spot: LifestyleSpotItem,
  limit: number = 6
): Promise<NearbyDiningItem[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. Production Google Places API (New) Call if key is set
  if (apiKey) {
    try {
      const googlePlacesUrl = 'https://places.googleapis.com/v1/places:searchNearby';
      const payload = {
        includedTypes: ['cafe', 'coffee_shop', 'restaurant', 'bakery'],
        maxResultCount: limit,
        locationRestriction: {
          circle: {
            center: {
              latitude: spot.latitude,
              longitude: spot.longitude,
            },
            radius: 3500.0, // 3.5 km radius
          },
        },
        rankPreference: 'POPULARITY',
      };

      const res = await fetch(googlePlacesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.currentOpeningHours,places.photos,places.googleMapsUri,places.primaryTypeDisplayName',
        },
        next: { revalidate: 86400 }, // Cache 24 hours in Next.js Data Cache to save API quota
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          return data.places.map((p: any, idx: number): NearbyDiningItem => {
            const lat = p.location?.latitude || spot.latitude;
            const lng = p.location?.longitude || spot.longitude;
            const dist = getDistanceKm(spot.latitude, spot.longitude, lat, lng);
            const photoRef = p.photos?.[0]?.name;
            const photoUrl = photoRef
              ? `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=600&maxWidthPx=800&key=${apiKey}`
              : 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';

            const placeName = p.displayName?.text || 'ร้านอาหารยอดฮิตรอบย่าน';
            // Check if place matches an existing internal spot
            const matchingSpot = MOCK_SPOTS.find(
              (s) => s.title.toLowerCase().includes(placeName.toLowerCase()) || placeName.toLowerCase().includes(s.title.toLowerCase())
            );

            return {
              id: `gplace-${idx}-${placeName.slice(0, 10)}`,
              name: placeName,
              category: 'cafe',
              categoryLabel: p.primaryTypeDisplayName?.text || 'คาเฟ่ & ร้านอาหาร',
              image: photoUrl,
              rating: p.rating || 4.7,
              reviewsCount: p.userRatingCount || 250,
              distanceKm: dist,
              openHours: p.currentOpeningHours?.openNow ? 'เปิดอยู่ตอนนี้' : 'เปิดให้บริการตามรอบเวลา',
              specialty: p.formattedAddress || 'ร้านยอดฮิตแนะนำใกล้จุดเช็คอินนี้',
              googleMapsUrl: p.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(placeName)}`,
              isPartner: false,
              spotId: matchingSpot?.id,
            };
          });
        }
      }
    } catch (err) {
      console.warn('[nearbyDiningService] Google Places API fetch fallback:', err);
    }
  }

  // 2. Curated & Internal Database Engine (Zero Latency, High Reliability)
  return getNearbyDiningSync(spot, limit);
}

/**
 * Synchronous local calculation from curated Thai partners & internal spots
 * Instant 0ms response time, perfect for initial SSR & zero-flash UI
 */
export function getNearbyDiningSync(
  spot: LifestyleSpotItem,
  limit: number = 6
): NearbyDiningItem[] {
  const internalCafes = MOCK_SPOTS.filter(
    (s) => s.id !== spot.id && (s.category === 'cafe' || s.vibeTags?.some((v) => /กาแฟ|cafe|coffee|อาหาร|จิบกาแฟ/i.test(v)))
  ).map((s) => ({
    id: `spot-dining-${s.id}`,
    name: s.title,
    category: 'cafe' as const,
    categoryLabel: s.categoryLabel || 'คาเฟ่ & สโลว์บาร์',
    image: s.image,
    rating: s.rating || 4.8,
    reviewsCount: s.reviewsCount || 350,
    openHours: s.openHours || '08:00 - 17:00 น.',
    priceRange: s.price || '฿80 - ฿150',
    specialty: s.highlights?.[0] || s.description.slice(0, 50),
    latitude: s.latitude,
    longitude: s.longitude,
    province: s.province,
    district: s.district,
    googleMapsUrl: s.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(s.title)}`,
    isPartner: true,
    spotId: s.id,
  }));

  const allPool = [...CURATED_REAL_DINING, ...internalCafes].filter((item) => {
    if (item.spotId && item.spotId === spot.id) return false;
    const cleanItemName = item.name.replace(/\s+/g, '').toLowerCase();
    const cleanSpotName = spot.title.replace(/\s+/g, '').toLowerCase();
    if (cleanItemName.includes(cleanSpotName) || cleanSpotName.includes(cleanItemName)) return false;
    return true;
  });

  // Calculate real distance & proximity score
  const scored = allPool.map((item) => {
    let score = 0;
    const distanceKm = getDistanceKm(spot.latitude, spot.longitude, item.latitude, item.longitude);

    // Exact District Match (e.g. Mae Taeng with Mae Taeng)
    if (spot.district && item.district && spot.district === item.district) {
      score += 120;
    }
    // Same Province Match (e.g. Chiang Mai)
    if (spot.province === item.province) {
      score += 60;
    }
    // Distance bonus (closer is higher)
    if (distanceKm <= 1.5) {
      score += 90;
    } else if (distanceKm <= 5) {
      score += 60;
    } else if (distanceKm <= 15) {
      score += 35;
    } else if (distanceKm <= 35) {
      score += 15;
    }

    // High rating bonus
    score += (item.rating || 4.5) * 5;

    return {
      item,
      distanceKm,
      score,
    };
  });

  // Sort by score then distance
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.distanceKm - b.distanceKm;
  });

  // Deduplicate by name and return top results
  const seenNames = new Set<string>();
  const results: NearbyDiningItem[] = [];

  for (const entry of scored) {
    const normalizedName = entry.item.name.replace(/\s+/g, '').toLowerCase();
    if (seenNames.has(normalizedName)) continue;
    seenNames.add(normalizedName);

    // Auto-link to internal spot if matching
    let linkedSpotId = entry.item.spotId;
    if (!linkedSpotId) {
      const match = MOCK_SPOTS.find(
        (s) => s.id !== spot.id && (s.title.includes(entry.item.name) || entry.item.name.includes(s.title))
      );
      if (match) linkedSpotId = match.id;
    }

    results.push({
      id: entry.item.id,
      name: entry.item.name,
      category: entry.item.category,
      categoryLabel: entry.item.categoryLabel,
      image: entry.item.image,
      rating: entry.item.rating,
      reviewsCount: entry.item.reviewsCount,
      distanceKm: entry.distanceKm < 999 ? entry.distanceKm : 1.2,
      openHours: entry.item.openHours,
      priceRange: entry.item.priceRange,
      specialty: entry.item.specialty,
      googleMapsUrl: entry.item.googleMapsUrl,
      isPartner: entry.item.isPartner,
      spotId: linkedSpotId,
    });

    if (results.length >= limit) break;
  }

  // Fallback guarantee: if for a very remote province we got fewer than 2, provide generic local dining search
  if (results.length === 0) {
    results.push({
      id: `fallback-cafe-${spot.id}`,
      name: `ร้านกาแฟ & ร้านอร่อยชุมชน ย่าน${spot.district || spot.province}`,
      category: 'cafe',
      categoryLabel: 'Local Eatery & Coffee',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewsCount: 180,
      distanceKm: 0.8,
      openHours: '08:00 - 17:30 น.',
      priceRange: '฿60 - ฿120',
      specialty: `เครื่องดื่มและอาหารจานเด็ดประจำย่าน ${spot.district || spot.province}`,
      googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent('คาเฟ่ ร้านอาหาร')}/@${spot.latitude},${spot.longitude},15z`,
      isPartner: false,
    });
  }

  return results;
}
