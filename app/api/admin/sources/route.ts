import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import {
  getAllDataSources,
  addCustomDataSource,
  toggleDataSourceStatus,
  deleteCustomDataSource,
} from '@/lib/sourcesStore';

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const sources = await getAllDataSources();
    return NextResponse.json({ success: true, sources });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = requireAdminApiAccess(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, url, category, categoryLabel, icon, description } = body;
    const targetType = body.targetType === 'spots' ? 'spots' : body.targetType === 'events' || !body.targetType ? 'events' : null;

    if (!name || !url || !targetType) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อ URL และประเภทข้อมูลของแหล่งข้อมูล' }, { status: 400 });
    }

    let normalizedUrl: URL;
    try {
      normalizedUrl = new URL(url.trim());
    } catch {
      return NextResponse.json({ success: false, error: 'URL ของแหล่งข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    if (normalizedUrl.protocol !== 'https:' || normalizedUrl.username || normalizedUrl.password) {
      return NextResponse.json({ success: false, error: 'รองรับเฉพาะ URL สาธารณะผ่าน HTTPS' }, { status: 400 });
    }

    const updatedSources = await addCustomDataSource({
      name: name.trim(),
      url: normalizedUrl.toString(),
      targetType,
      category: category || 'lifestyle',
      categoryLabel: categoryLabel || '🌐 เว็บไซต์อีเวนต์ทั่วไป',
      icon: icon || '🌐',
      status: 'active',
      description: description?.trim() || 'แหล่งข้อมูลที่เพิ่มโดยผู้ดูแลระบบ (Admin Custom Source)',
    });

    return NextResponse.json({
      success: true,
      message: `เพิ่มแหล่งข้อมูล "${name}" สำเร็จ`,
      sources: updatedSources,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const denied = requireAdminApiAccess(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const updatedSources = await toggleDataSourceStatus(id, status);
    return NextResponse.json({
      success: true,
      message: `เปลี่ยนสถานะเป็น ${status === 'active' ? 'เปิดใช้งาน (Active)' : 'พักการดึง (Inactive)'} แล้ว`,
      sources: updatedSources,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdminApiAccess(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing source id' }, { status: 400 });
    }

    const updatedSources = await deleteCustomDataSource(id);
    return NextResponse.json({
      success: true,
      message: 'ลบแหล่งข้อมูลสำเร็จ',
      sources: updatedSources,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
