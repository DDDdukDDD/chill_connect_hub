import { NextResponse } from 'next/server';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { autoEnrichSpotImages, isValidImageUrl } from '@/lib/spotImageResolver';

// In-memory / dynamic store for spots (seeded from MOCK_SPOTS)
let SPOTS_STORE: LifestyleSpotItem[] = [...MOCK_SPOTS];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const filter = searchParams.get('filter'); // 'missing_image' | 'all'

    let filtered = [...SPOTS_STORE];

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

    const missingImagesCount = SPOTS_STORE.filter((s) => !isValidImageUrl(s.image)).length;
    const distinctProvinces = new Set(SPOTS_STORE.map((s) => s.province)).size;

    return NextResponse.json({
      success: true,
      spots: filtered,
      totalCount: SPOTS_STORE.length,
      missingImagesCount,
      distinctProvinces,
    });
  } catch (error) {
    console.error('Error fetching admin spots:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch spots' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Auto Enrich Missing Images
    if (action === 'auto_enrich_images') {
      const { enrichedSpots, fixedCount } = autoEnrichSpotImages(SPOTS_STORE);
      SPOTS_STORE = enrichedSpots;
      return NextResponse.json({
        success: true,
        message: `สแกนและเติมรูปภาพความละเอียดสูงสำเร็จ ${fixedCount} รายการ`,
        fixedCount,
        spots: SPOTS_STORE,
      });
    }

    // Action 2: Create New Spot
    if (action === 'create') {
      const { newSpot } = body;
      if (!newSpot || !newSpot.title || !newSpot.province) {
        return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อและจังหวัดของสถานที่' }, { status: 400 });
      }

      const spotId = `spot-custom-${Date.now()}`;
      const createdSpot: LifestyleSpotItem = {
        id: spotId,
        title: newSpot.title,
        category: newSpot.category || 'nature',
        categoryLabel: newSpot.categoryLabel || '🌿 สวน & ธรรมชาติ',
        province: newSpot.province,
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
        latitude: Number(newSpot.latitude) || 13.7563,
        longitude: Number(newSpot.longitude) || 100.5018,
      };

      // Enrich image if empty
      const { enrichedSpots } = autoEnrichSpotImages([createdSpot]);
      SPOTS_STORE.unshift(enrichedSpots[0]);

      return NextResponse.json({
        success: true,
        message: 'เพิ่มข้อมูลสถานที่ใหม่เรียบร้อยแล้ว',
        spot: enrichedSpots[0],
        spots: SPOTS_STORE,
      });
    }

    // Action 3: Update Existing Spot
    if (action === 'update') {
      const { spotId, updatedFields } = body;
      const index = SPOTS_STORE.findIndex((s) => s.id === spotId);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'ไม่พบสถานที่ที่ระบุ' }, { status: 404 });
      }

      SPOTS_STORE[index] = {
        ...SPOTS_STORE[index],
        ...updatedFields,
      };

      return NextResponse.json({
        success: true,
        message: 'อัปเดตข้อมูลสถานที่เรียบร้อยแล้ว',
        spot: SPOTS_STORE[index],
        spots: SPOTS_STORE,
      });
    }

    // Action 4: Delete Spot
    if (action === 'delete') {
      const { spotId } = body;
      SPOTS_STORE = SPOTS_STORE.filter((s) => s.id !== spotId);
      return NextResponse.json({
        success: true,
        message: 'ลบสถานที่ออกจากระบบเรียบร้อยแล้ว',
        spots: SPOTS_STORE,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling admin spots POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to process spots action' }, { status: 500 });
  }
}
