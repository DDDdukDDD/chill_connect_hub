import { NextRequest, NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { cacheManager } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const stats = cacheManager.getStats();
    const activeTags = cacheManager.getActiveTags ? cacheManager.getActiveTags() : [];

    return NextResponse.json({
      success: true,
      stats,
      activeTags,
      timestamp: new Date().toISOString(),
      supportedTags: [
        { tag: 'spots', label: 'Lifestyle Spots (77 จังหวัด)', description: 'แคชรายการจุดเที่ยวและหมวดหมู่ไลฟ์สไตล์' },
        { tag: 'events', label: 'Community Meetups', description: 'แคชกิจกรรมนัดพบ สมาชิก และสถานะสมัคร' },
        { tag: 'fairs', label: 'Fairs & Public Venues', description: 'แคชงานแฟร์ นิทรรศการ และศูนย์จัดแสดง' },
        { tag: 'taxonomy', label: 'Master Taxonomy Hub', description: 'แคชโครงสร้างหมวดหมู่, Mood/Vibe, แท็กกลาง' },
        { tag: 'venues', label: 'Venue Hub Master', description: 'แคชศูนย์ประชุมและจุดจัดแสดงหลัก' },
      ],
    });
  } catch (error) {
    console.error('Error in cache GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve cache stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminApiAccess(request, 'system.manage');
  if (denied) return denied;

  try {
    const body = await request.json();
    const { action, tag, tags } = body;
    if (['flush_all', 'flush_tag', 'flush_tags'].includes(action)) {
      const scope = action === 'flush_all' ? 'ทั้งหมด' : action === 'flush_tag' ? `แท็ก ${tag}` : `แท็ก ${Array.isArray(tags) ? tags.join(', ') : ''}`;
      recordAudit(getAdminActor(request), `cache.${action}`, `ล้าง cache ${scope}`);
    }

    if (action === 'flush_all') {
      cacheManager.clear();
      return NextResponse.json({
        success: true,
        message: '⚡ เคลียร์ L1 Memory Cache ทั้งหมดในระบบเรียบร้อยแล้ว',
        stats: cacheManager.getStats(),
      });
    }

    if (action === 'flush_tag' && tag) {
      const purgedCount = cacheManager.invalidateTag(tag);
      return NextResponse.json({
        success: true,
        message: `⚡ ล้างแคชหมวด "${tag}" สำเร็จ (${purgedCount} รายการ)`,
        purgedCount,
        stats: cacheManager.getStats(),
      });
    }

    if (action === 'flush_tags' && Array.isArray(tags)) {
      const purgedCount = cacheManager.invalidateTags(tags);
      return NextResponse.json({
        success: true,
        message: `⚡ ล้างแคชกลุ่มแท็กสำเร็จ (${purgedCount} รายการ)`,
        purgedCount,
        stats: cacheManager.getStats(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid cache action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in cache POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}
