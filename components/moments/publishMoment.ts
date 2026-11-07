'use client';

import { uploadPresigned } from '@vercel/blob/client';
import { compressClip } from '@/lib/media/clipCompress';
import { exportPhoto, type EditedPhoto, type PhotoText, type PostShape } from '@/lib/media/photoEdit';
import { PostingError, type ReportProgress } from '@/lib/moments/postingJobs';
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '@/lib/moments/types';
import type { CountedQuest, MomentLinkTarget, PostOptions } from './MomentComposer';

/**
 * Shrinks, uploads and posts a moment the composer handed over (lib/moments/postingJobs.ts runs it in the background
 * after the form closes). Progress is one share of the whole job: photos upload in turn; a clip's cover goes first,
 * then the clip is shrunk on this phone (about half the time) and uploaded.
 */

export interface MomentDraft {
  photos: EditedPhoto[];
  shape: PostShape;
  clip: { file: File; fullSeconds: number; startS: number; texts: PhotoText[]; muted: boolean; cover: string } | null;
  caption: string;
  location: string;
  target: MomentLinkTarget | null;
  taggedIds: string[];
  options: PostOptions;
}

export type PostedMoment = { id: string } & Record<string, unknown>;

const isVisitTarget = (type?: string): type is 'spot' | 'community' | 'fair' => type === 'spot' || type === 'community' || type === 'fair';

/** Sends the clip straight to storage when the site can sign that; a local server keeps it itself */
async function uploadClip(file: File, onShare?: (share: number) => void): Promise<string | null> {
  const { mode } = await fetch('/api/upload/video', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ mode: 'off' }));
  if (mode === 'r2') {
    // A signed link for exactly this file (its size and type), then the file goes straight to Cloudflare R2
    const ticket: { success?: boolean; uploadUrl?: string; url?: string; cacheControl?: string } | null = await fetch('/api/upload/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type, size: file.size, preview: file.name === 'clip-preview.mp4' }),
    }).then((r) => r.json()).catch(() => null);
    if (!ticket?.success || !ticket.uploadUrl || !ticket.url) return null;
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', ticket.uploadUrl as string);
      xhr.setRequestHeader('Content-Type', file.type);
      if (ticket.cacheControl) xhr.setRequestHeader('Cache-Control', ticket.cacheControl);
      if (onShare) xhr.upload.onprogress = (e) => e.lengthComputable && onShare(e.loaded / e.total);
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 upload ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('R2 upload failed'));
      xhr.send(file);
    });
    return ticket.url;
  }
  if (mode === 'direct') {
    const name = `moments/${file.name === 'clip-preview.mp4' ? 'clip-preview' : 'clip'}.${file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4'}`;
    const blob = await uploadPresigned(name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/video',
      contentType: file.type,
      onUploadProgress: ({ percentage }) => onShare?.(percentage / 100),
    });
    return blob.url;
  }
  if (mode !== 'server') return null;
  const form = new FormData();
  form.append('file', file);
  const stored = await fetch('/api/upload/video', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
  return stored?.success ? stored.url : null;
}

async function uploadPicture(picture: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', picture, picture.type === 'image/webp' ? 'moment.webp' : 'moment.jpg');
  form.append('folder', 'moments');
  const upload = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
  if (!upload?.success || !upload.url) throw new PostingError(upload?.error || upload?.message || 'อัปโหลดรูปไม่สำเร็จ ลองอีกครั้งนะ');
  return upload.url;
}

/**
 * Where the phone is right now, for a post at a place or fair: when it is at the place, the photo counts toward
 * challenges at once; without it (declined, no GPS) the photo waits for staff (lib/moments/evidence.ts)
 */
const currentPosition = () =>
  new Promise<{ lat: number; lng: number; accuracy: number; at: number } | undefined>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, at: pos.timestamp }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  });

const ratioOf = (src: string) =>
  new Promise<number | undefined>((resolve) => {
    const probe = new window.Image();
    probe.onload = () => resolve(probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : undefined);
    probe.onerror = () => resolve(undefined);
    probe.src = src;
  });

/**
 * What one post has uploaded so far. The composer keeps one per post, so "ลองใหม่" after a failure carries on from here
 * instead of uploading the same files again and leaving the first copies unused in storage.
 */
export interface UploadsSoFar {
  images: string[];
  video?: Record<string, unknown>;
}

export async function publishMoment(draft: MomentDraft, report: ReportProgress, done: UploadsSoFar = { images: [] }): Promise<{ moment: PostedMoment; counted: CountedQuest | null }> {
  const { clip } = draft;

  if (clip) {
    report(0.02, 'กำลังอัปโหลดปก…');
    done.images[0] ??= await uploadPicture(await (await fetch(clip.cover)).blob());
  }
  if (clip && !done.video) {
    // Only the chosen part, made small on this phone; the original goes when this device cannot do that
    report(0.05, 'กำลังเตรียมคลิป…');
    const small = await compressClip(clip.file, clip.startS, clip.fullSeconds, (share) => report(0.05 + share * 0.45, 'กำลังเตรียมคลิป…'), { texts: clip.texts, muted: clip.muted });
    if (!small) {
      // Text and "no sound" exist only in the shrunk clip, and the whole file must fit the upload limit
      if (clip.muted || clip.texts.some((t) => t.text.trim())) throw new PostingError('เครื่องนี้ใส่ข้อความหรือปิดเสียงคลิปไม่สำเร็จ ลองเอาออกแล้วโพสต์อีกครั้งนะ');
      if (clip.file.size > MAX_VIDEO_BYTES) throw new PostingError(`ย่อคลิปบนเครื่องนี้ไม่สำเร็จ และไฟล์ใหญ่เกิน ${MAX_VIDEO_BYTES / 1024 / 1024}MB ลองเลือกคลิปที่สั้นลงนะ`);
    }
    report(0.5, 'กำลังอัปโหลดคลิป…');
    const clipUrl = await uploadClip(small?.file ?? clip.file, (share) => report(0.5 + share * 0.42, 'กำลังอัปโหลดคลิป…')).catch(() => null);
    if (!clipUrl) throw new PostingError('อัปโหลดคลิปไม่สำเร็จ ลองอีกครั้งนะ');
    // The silent loop feeds autoplay; without it the post still goes, its clip then waits for a tap
    const previewUrl = small?.preview ? await uploadClip(small.preview).catch(() => null) : null;
    done.video = small
      ? { url: clipUrl, durationS: small.durationS, startS: 0, ...(previewUrl ? { previewUrl } : {}) }
      : { url: clipUrl, durationS: Math.min(MAX_VIDEO_SECONDS, clip.fullSeconds - clip.startS), startS: clip.startS };
  }
  if (!clip) {
    report(0.03, 'กำลังเตรียมรูป…');
    const count = draft.photos.length;
    for (const [index, photo] of draft.photos.entries()) {
      if (done.images[index]) continue;
      report(0.08 + (index / count) * 0.84, count > 1 ? `กำลังอัปโหลดรูป ${index + 1}/${count}` : 'กำลังอัปโหลดรูป…');
      done.images[index] = await uploadPicture(await exportPhoto(photo, draft.shape));
    }
  }
  const imageUrls = done.images;
  const video = done.video;

  report(0.95, 'กำลังโพสต์…');
  const { target } = draft;
  const capture = target && (target.type === 'spot' || target.type === 'fair') ? await currentPosition() : undefined;
  const res = await fetch('/api/moments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caption: draft.caption,
      images: imageUrls,
      video,
      ...draft.options,
      imageRatio: clip ? await ratioOf(clip.cover) : draft.shape,
      location: draft.location,
      category: 'chill',
      targetType: target ? target.type : 'general',
      targetId: target?.id,
      targetTitle: target ? target.title : draft.location || undefined,
      taggedIds: draft.taggedIds,
      capture,
    }),
  }).catch(() => null);
  if (!res) throw new PostingError('เชื่อมต่อไม่ได้ ลองอีกครั้งนะ');
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false || !json?.moment) throw new PostingError(json?.message || 'โพสต์ไม่สำเร็จ ลองอีกครั้งนะ');

  // A moment at a place or event is a visit: say so when it counted toward a challenge the member is doing
  let counted: CountedQuest | null = null;
  if (target && isVisitTarget(target.type)) {
    const key = `${target.type}:${target.id}`;
    const get = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
    const [here, mine] = await Promise.all([get(`/api/visits?targets=${encodeURIComponent(key)}`), get('/api/visits?mine=1')]);
    const hereIds = new Set(((here.targets?.[key]?.quests ?? []) as { questId: string }[]).map((q) => q.questId));
    counted = ((mine.quests ?? []) as CountedQuest[]).find((q) => q.joined && q.current > 0 && hereIds.has(q.questId)) ?? null;
  }
  return { moment: json.moment as PostedMoment, counted };
}
