// Shrinks clips posted before 2026-11-07 the way the phone now does (docs/VIDEO_PLAN.md, "ยังต้องมีในทุกขั้น" 4):
// only the chosen part, short side at most 720 px, H.264 MP4, plus the 3-second silent preview feeds autoplay.
// Each post moves to the new files first; its old file is deleted only after that.
//
//   node db/shrink-old-clips.mjs                 list what would change, touch nothing
//   node db/shrink-old-clips.mjs --apply --only mom_xxx   one clip, to look at it first
//   node db/shrink-old-clips.mjs --apply         every clip without a preview
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). Blob: BLOB_READ_WRITE_TOKEN in the environment, or
// BLOB_STORE_ID + VERCEL_OIDC_TOKEN from `.env.vercel` (`npx vercel env pull .env.vercel`, valid 12 hours).
// Never in .env.local: there it would switch the local server to the live Blob store.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { adminConnection } from './env.mjs';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const VERCEL_ENV = new URL('../.env.vercel', import.meta.url);
if (existsSync(VERCEL_ENV)) {
  for (const line of readFileSync(VERCEL_ENV, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(BLOB_STORE_ID|VERCEL_OIDC_TOKEN|BLOB_READ_WRITE_TOKEN)=["']?([^"'\r\n]*)/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
// undefined: @vercel/blob then logs in with BLOB_STORE_ID + VERCEL_OIDC_TOKEN
const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;
if (apply && !token && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
  throw new Error('No Blob login: run `npx vercel env pull .env.vercel`, or set BLOB_READ_WRITE_TOKEN');
}

// Same limits as lib/media/clipCompress.ts
const MAX_SECONDS = 15;
const short = (n) => `scale='if(lt(iw,ih),min(${n},iw),-2)':'if(lt(iw,ih),-2,min(${n},ih))'`;
const run = (...a) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: ['ignore', 'ignore', 'inherit'] });
const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

const sql = adminConnection();
const work = mkdtempSync(join(tmpdir(), 'chillwaa-clips-'));
try {
  const rows = await sql`
    select id, slug, video_url, video_duration_s, video_start_s from app.moments
    where video_url is not null and video_preview_url is null ${only ? sql`and slug = ${only}` : sql``}
    order by created_at`;
  console.log(`${rows.length} clip(s) without a preview${apply ? '' : ' (dry run: add --apply to change them)'}`);

  const { put, del } = apply ? await import('@vercel/blob') : {};
  for (const row of rows) {
    const start = Number(row.video_start_s) || 0;
    const seconds = Math.min(MAX_SECONDS, Number(row.video_duration_s));
    const source = join(work, `${row.slug}-in`);
    const clip = join(work, `${row.slug}.mp4`);
    const preview = join(work, `${row.slug}-preview.mp4`);

    // A dry run downloads nothing: every download counts against the Blob transfer quota
    if (!apply) { console.log(`${row.slug}: ${row.video_url.split('/').pop()}, ${start}s–${start + seconds}s`); continue; }
    const res = await fetch(row.video_url);
    if (!res.ok) { console.log(`${row.slug}: download failed (${res.status}), skipped`); continue; }
    writeFileSync(source, Buffer.from(await res.arrayBuffer()));

    // ffmpeg turns phone clips upright by itself (rotation metadata)
    run('-ss', String(start), '-t', String(seconds), '-i', source, '-vf', `${short(720)},fps=30`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', clip);
    run('-t', '3', '-i', clip, '-vf', `${short(360)},fps=24`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '32', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', preview);

    const before = readFileSync(source).length;
    const clipFile = readFileSync(clip);
    const previewFile = readFileSync(preview);
    console.log(`${row.slug}: ${mb(before)} → ${mb(clipFile.length)} + preview ${(previewFile.length / 1e3).toFixed(0)} KB (${start}s–${start + seconds}s)`);
    if (!apply) continue;

    const options = { access: 'public', addRandomSuffix: true, contentType: 'video/mp4', cacheControlMaxAge: 60 * 60 * 24 * 365, token };
    const newClip = await put('moments/clip.mp4', clipFile, options);
    const newPreview = await put('moments/clip-preview.mp4', previewFile, options);
    // Only if nobody changed the post meanwhile
    const moved = await sql`
      update app.moments set video_url = ${newClip.url}, video_preview_url = ${newPreview.url}, video_start_s = 0, video_duration_s = ${seconds}
      where id = ${row.id} and video_url = ${row.video_url} returning id`;
    if (moved.length === 0) {
      await del([newClip.url, newPreview.url], { token });
      console.log(`${row.slug}: post changed meanwhile, new files removed, old kept`);
      continue;
    }
    await del(row.video_url, { token });
    console.log(`${row.slug}: done, old file deleted`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
  await sql.end();
}
