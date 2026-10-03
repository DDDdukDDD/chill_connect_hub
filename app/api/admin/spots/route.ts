import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { LifestyleSpotItem } from '@/data/spotsData';
import { autoEnrichSpotImages, isValidImageUrl } from '@/lib/spotImageResolver';

const SPOT_CATEGORY_IDS = new Set<LifestyleSpotItem['category']>([
  'park', 'art', 'cafe', 'oldtown', 'workspace', 'viewpoint', 'nature',
  'temple', 'beach', 'market', 'museum', 'bar', 'coworking',
]);
const MUTABLE_SPOT_FIELDS = new Set<keyof LifestyleSpotItem>([
  'title', 'category', 'categoryLabel', 'province', 'district', 'transitInfo',
  'image', 'galleryImages', 'openHours', 'price', 'bestTime', 'vibeTags',
  'description', 'highlights', 'facilities', 'googleMapsUrl', 'rating',
  'reviewsCount', 'latitude', 'longitude', 'publicationStatus', 'sourceName',
  'sourceUrl', 'zone',
]);

async function getAllSpots(): Promise<LifestyleSpotItem[]> {
  const firstPage = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await db.findSpots({ page, limit: 100, includeDrafts: true });
    spots.push(...result.items);
  }

  return spots;
}

function getSpotValidationError(spot: Partial<LifestyleSpotItem>): string | null {
  if (typeof spot.title !== 'string' || spot.title.trim().length < 5) return 'ชื่อสถานที่ต้องมีอย่างน้อย 5 ตัวอักษร';
  if (typeof spot.province !== 'string' || !spot.province.trim()) return 'กรุณาระบุจังหวัด';
  if (typeof spot.category !== 'string' || !SPOT_CATEGORY_IDS.has(spot.category)) return 'หมวดหมู่สถานที่ไม่ถูกต้อง';
  if (typeof spot.description !== 'string' || spot.description.trim().length < 15) return 'รายละเอียดต้องมีอย่างน้อย 15 ตัวอักษร';
  if (typeof spot.openHours !== 'string' || !spot.openHours.trim()) return 'กรุณาระบุเวลาเปิดให้บริการ';
  return null;
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const filter = searchParams.get('filter'); // 'missing_image' | 'all'
    const publicationStatus = searchParams.get('status');

    const allSpots = await getAllSpots();
    let filtered = [...allSpots];

    if (province && province !== 'all') {
      filtered = filtered.filter((s) => s.province.includes(province) || province.includes(s.province));
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((s) => s.category === category);
    }

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }

    if (filter === 'missing_image') {
      filtered = filtered.filter((s) => !isValidImageUrl(s.image));
    }

    if (publicationStatus === 'draft') {
      filtered = filtered.filter((spot) => spot.publicationStatus === 'draft');
    } else if (publicationStatus === 'published') {
      filtered = filtered.filter((spot) => spot.publicationStatus !== 'draft');
    }

    const missingImagesCount = allSpots.filter((s) => !isValidImageUrl(s.image)).length;
    const distinctProvinces = new Set(allSpots.map((s) => s.province)).size;

    return NextResponse.json({
      success: true,
      spots: filtered,
      totalCount: allSpots.length,
      missingImagesCount,
      distinctProvinces,
    });
  } catch (error) {
    console.error('Error fetching admin spots:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch spots' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Auto Enrich Missing Images
    if (action === 'auto_enrich_images') {
      const allSpots = await getAllSpots();
      const { enrichedSpots, fixedCount } = autoEnrichSpotImages(allSpots);
      await db.bulkUpdateSpots(enrichedSpots);
      return NextResponse.json({
        success: true,
        message: `สแกนและเติมรูปภาพความละเอียดสูงสำเร็จ ${fixedCount} รายการ`,
        fixedCount,
        spots: await getAllSpots(),
      });
    }

    // Action 2: Create New Spot
    if (action === 'create') {
      const newSpot = body.newSpot as Partial<LifestyleSpotItem> | null;
      const validationError = newSpot ? getSpotValidationError(newSpot) : 'ข้อมูลสถานที่ไม่ครบถ้วน';
      if (!newSpot || validationError) {
        return NextResponse.json({ success: false, error: validationError }, { status: 400 });
      }

      const latitude = Number(newSpot.latitude);
      const longitude = Number(newSpot.longitude);
      const createdSpot: LifestyleSpotItem = {
        id: `spot-custom-${Date.now()}`,
        title: newSpot.title!.trim(),
        category: newSpot.category as LifestyleSpotItem['category'],
        categoryLabel: newSpot.categoryLabel || '🌿 สวน & ธรรมชาติ',
        province: newSpot.province!.trim(),
        district: newSpot.district || 'เมือง',
        image: newSpot.image || '',
        openHours: newSpot.openHours || 'เปิดทุกวัน: 08:00 - 18:00 น.',
        price: newSpot.price || 'เข้าฟรี',
        bestTime: newSpot.bestTime || 'ช่วงเช้า หรือ บ่ายแก่ๆ',
        vibeTags: newSpot.vibeTags || ['📍 จุดเช็คอินยอดฮิต', '📸 ถ่ายรูปสวย'],
        description: newSpot.description || '',
        highlights: newSpot.highlights || [],
        facilities: newSpot.facilities || ['🅿️ ลานจอดรถ', '🚻 ห้องน้ำ'],
        googleMapsUrl: newSpot.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(newSpot.title + ' ' + newSpot.province)}`,
        rating: 4.8,
        reviewsCount: 1,
        latitude: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 13.7563,
        longitude: Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : 100.5018,
        publicationStatus: newSpot.publicationStatus === 'published' ? 'published' : 'draft',
      };

      // Enrich image if empty
      const { enrichedSpots } = autoEnrichSpotImages([createdSpot]);
      const savedSpot = await db.createSpot(enrichedSpots[0]);

      return NextResponse.json({
        success: true,
        message: 'เพิ่มข้อมูลสถานที่ใหม่เรียบร้อยแล้ว',
        spot: savedSpot,
        spots: await getAllSpots(),
      });
    }

    // Action 3: Update Existing Spot
    if (action === 'update') {
      const { spotId, updatedFields } = body as { spotId?: string; updatedFields?: Record<string, unknown> };
      if (!spotId || !updatedFields || typeof updatedFields !== 'object') {
        return NextResponse.json({ success: false, error: 'ข้อมูลอัปเดตไม่ถูกต้อง' }, { status: 400 });
      }

      const existing = await db.findSpotById(spotId);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'ไม่พบสถานที่ที่ระบุ' }, { status: 404 });
      }

      const safeFields = Object.fromEntries(
        Object.entries(updatedFields).filter(([key]) => MUTABLE_SPOT_FIELDS.has(key as keyof LifestyleSpotItem))
      ) as Partial<LifestyleSpotItem>;
      const validationError = getSpotValidationError({ ...existing, ...safeFields });
      if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });

      const updatedSpot = await db.updateSpot(spotId, safeFields);

      return NextResponse.json({
        success: true,
        message: 'อัปเดตข้อมูลสถานที่เรียบร้อยแล้ว',
        spot: updatedSpot,
        spots: await getAllSpots(),
      });
    }

    // Action 4: Delete Spot
    if (action === 'delete') {
      const { spotId } = body as { spotId?: string };
      if (!spotId) return NextResponse.json({ success: false, error: 'กรุณาระบุสถานที่' }, { status: 400 });
      const deleted = await db.deleteSpot(spotId);
      if (!deleted) return NextResponse.json({ success: false, error: 'ไม่พบสถานที่ที่ระบุ' }, { status: 404 });
      return NextResponse.json({
        success: true,
        message: 'ลบสถานที่ออกจากระบบเรียบร้อยแล้ว',
        spots: await getAllSpots(),
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling admin spots POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to process spots action' }, { status: 500 });
  }
}
