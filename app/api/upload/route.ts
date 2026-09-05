import { NextResponse } from 'next/server';
import { mediaStorage } from '@/lib/media';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'events';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์รูปภาพที่ต้องการอัปโหลด' },
        { status: 400 }
      );
    }

    // Safety checks
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `ประเภทไฟล์ไม่รองรับ (${file.type}) รองรับเฉพาะ JPG, PNG, WEBP, AVIF, SVG`,
        },
        { status: 400 }
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          message: 'ขนาดไฟล์เกิน 5MB กรุณาใช้รูปภาพขนาดเล็กลงหรือผ่านการบีบอัด',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mediaStorage.upload(buffer, file.name, file.type, {
      folder,
      maxSizeBytes,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
      mimeType: result.mimeType,
      originalName: result.originalName,
    });
  } catch (error) {
    console.error('Error in /api/upload POST:', error);
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
