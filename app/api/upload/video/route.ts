import { NextResponse } from 'next/server';
import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { getMediaStorageDriver, mediaStorage } from '@/lib/media';
import { newMediaKey } from '@/lib/media/adapters/r2StorageAdapter';
import { R2_CACHE_CONTROL, r2Config, r2PresignedPut } from '@/lib/media/r2';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { MAX_VIDEO_BYTES, VIDEO_TYPES } from '@/lib/moments/types';
import { isRateLimited } from '@/lib/rateLimit';

/**
 * A moment's short clip (trial, owner 2026-11-02). A clip is too large for a server function on Vercel, so the phone
 * sends it straight to storage with a short-lived signed link from here, which also holds the type and size limits:
 * Cloudflare R2 since 2026-11-07 (size and type are signed into the link, so R2 refuses any other file), Vercel Blob
 * where R2 is not set up (signing works with the store's OIDC login). A local server without either keeps the file.
 */
// Each clip sends two files since 2026-11-07: the clip and its small preview
const VIDEOS_AN_HOUR = 20;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

const uploadMode = () => {
  const driver = getMediaStorageDriver();
  return driver === 'cloudflare-r2' ? 'r2' : driver === 'vercel-blob' ? 'direct' : process.env.VERCEL ? 'off' : 'server';
};

// Which way the composer should send the clip
export async function GET() {
  return NextResponse.json({ success: true, mode: uploadMode() }, { headers: { 'Cache-Control': 'no-store' } });
}

// The file's first bytes, so a renamed file is not stored as a video: ISO media (mp4, mov) or Matroska (webm)
function looksLikeVideo(buffer: Buffer): boolean {
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return true;
  return buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดคลิป' }, { status: 401 });
  try {
    await guardPosting(member, 'moment', '');
    if (await isRateLimited(`moment-video:${member.id}`, VIDEOS_AN_HOUR, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, message: 'อัปโหลดคลิปบ่อยเกินไป ลองใหม่อีกสักครู่นะ' }, { status: 429 });
    }
    const mode = uploadMode();
    if (mode === 'off') return NextResponse.json({ success: false, message: 'ตอนนี้ยังอัปโหลดคลิปไม่ได้ ลองใช้รูปก่อนนะ' }, { status: 503 });
    const r2 = mode === 'r2' ? r2Config() : null;
    if (r2) {
      const { contentType, size, preview } = (await request.json().catch(() => ({}))) as { contentType?: unknown; size?: unknown; preview?: unknown };
      if (typeof contentType !== 'string' || !VIDEO_TYPES.includes(contentType as (typeof VIDEO_TYPES)[number])) {
        return NextResponse.json({ success: false, message: 'รองรับคลิป MP4, MOV และ WEBM' }, { status: 400 });
      }
      if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ success: false, message: 'คลิปใหญ่เกิน 50MB' }, { status: 400 });
      }
      const key = newMediaKey('moments', preview === true ? 'clip-preview' : 'clip', contentType);
      const uploadUrl = await r2PresignedPut(r2, key, contentType, size);
      return NextResponse.json({ success: true, uploadUrl, url: `${r2.publicUrl}/${key}`, cacheControl: R2_CACHE_CONTROL });
    }
    if (mode === 'direct') {
      const body = (await request.json()) as HandleUploadPresignedBody;
      // The post is saved by POST /api/moments, so no upload-finished callback is asked for or accepted
      if (body.type !== 'blob.generate-presigned-url') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 400 });
      const limits = { allowedContentTypes: [...VIDEO_TYPES], maximumSizeInBytes: MAX_VIDEO_BYTES, validUntil: Date.now() + UPLOAD_WINDOW_MS };
      const result = await handleUploadPresigned({
        body,
        request,
        // The library wants a key even though only that callback, refused above, would use it
        webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY ?? 'no-callback',
        getSignedToken: async (pathname) => {
          if (!/^moments\/[\w.-]+$/.test(pathname)) throw new Error('Invalid upload path');
          return {
            token: await issueSignedToken({ pathname, operations: ['put'], ...limits }),
            urlOptions: { ...limits, access: 'public', addRandomSuffix: true, allowOverwrite: false, cacheControlMaxAge: 60 * 60 * 24 * 365 },
          };
        },
      });
      return NextResponse.json(result);
    }

    const file = (await request.formData()).get('file');
    if (!(file instanceof File) || !VIDEO_TYPES.includes(file.type as (typeof VIDEO_TYPES)[number])) {
      return NextResponse.json({ success: false, message: 'รองรับคลิป MP4, MOV และ WEBM' }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ success: false, message: 'คลิปใหญ่เกิน 50MB' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikeVideo(buffer)) return NextResponse.json({ success: false, message: 'ไฟล์นี้ไม่ใช่คลิปวิดีโอ' }, { status: 400 });
    const stored = await mediaStorage.upload(buffer, file.name, file.type, { folder: 'moments', allowedMimeTypes: [...VIDEO_TYPES], maxSizeBytes: MAX_VIDEO_BYTES });
    return NextResponse.json({ success: true, url: stored.url });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('MOMENT VIDEO UPLOAD FAILED:', error);
    return NextResponse.json({ success: false, message: 'อัปโหลดคลิปไม่สำเร็จ ลองอีกครั้งนะ' }, { status: 400 });
  }
}
