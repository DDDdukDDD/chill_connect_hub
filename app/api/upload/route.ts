import { NextResponse } from 'next/server';
import { mediaStorage } from '@/lib/media';
import { hasAdminCredentials } from '@/lib/adminApiAuth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// Members have no server identity yet, so uploads are limited per IP (per server instance) to curb abuse
// of paid storage. Admin sessions are not limited.
const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const globalForUploads = globalThis as unknown as { _cchUploadHits?: Map<string, number[]> };
const uploadHits = (globalForUploads._cchUploadHits ??= new Map());

function isRateLimited(request: Request): boolean {
  if (hasAdminCredentials(request)) return false;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const recent = (uploadHits.get(ip) ?? []).filter((time: number) => now - time < UPLOAD_WINDOW_MS);
  if (recent.length >= UPLOAD_LIMIT) {
    uploadHits.set(ip, recent);
    return true;
  }
  uploadHits.set(ip, [...recent, now]);
  return false;
}

// Identify raster image formats from their magic bytes
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(buffer.toString('ascii', 8, 12))) return 'image/avif';
  return null;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { success: false, message: 'อัปโหลดบ่อยเกินไป กรุณาลองใหม่ในอีกสักครู่' },
      { status: 429 }
    );
  }
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

    // Safety checks (SVG is not accepted: it can carry scripts and is served from our origin)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `ประเภทไฟล์ไม่รองรับ (${file.type}) รองรับเฉพาะ JPG, PNG, WEBP, AVIF`,
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

    // The declared MIME type comes from the client; verify the file signature matches it
    if (detectImageType(buffer) !== file.type) {
      return NextResponse.json(
        { success: false, message: 'เนื้อหาไฟล์ไม่ตรงกับประเภทรูปภาพที่ระบุ' },
        { status: 400 }
      );
    }

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
