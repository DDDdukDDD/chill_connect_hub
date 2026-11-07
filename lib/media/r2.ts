import { AwsClient } from 'aws4fetch';

/**
 * Cloudflare R2 (docs/VIDEO_PLAN.md, stage 2): photos and clips, no charge per GB downloaded. Files are served from
 * our own domain through Cloudflare's cache (R2_PUBLIC_URL: media.chillwaa.com live, media-dev.chillwaa.com for
 * `npm run dev`); uploads and deletes go to the S3 API with a key limited to one bucket.
 */
/** Files are never changed after upload (every name is new), so caches may keep them for a year */
export const R2_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export type R2Config ={ accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; publicUrl: string };

export function r2Config(): R2Config | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null;
  return { accountId: R2_ACCOUNT_ID, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, bucket: R2_BUCKET, publicUrl: R2_PUBLIC_URL.replace(/\/+$/, '') };
}

let client: AwsClient | null = null;
const r2Client = (config: R2Config) => (client ??= new AwsClient({ accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, service: 's3', region: 'auto' }));

/** The S3 API address of one stored file; keys are made by us (folder/name), each part encoded */
export const r2ObjectUrl = (config: R2Config, key: string) =>
  `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

export async function r2Fetch(config: R2Config, url: string, init?: RequestInit): Promise<Response> {
  return r2Client(config).fetch(url, init);
}

/**
 * A link the phone can PUT one file to, for 10 minutes. The size and type are part of the signature, so R2 refuses
 * any other file (tested against the dev bucket: other size or type → 403).
 */
export async function r2PresignedPut(config: R2Config, key: string, contentType: string, size: number): Promise<string> {
  const url = new URL(r2ObjectUrl(config, key));
  url.searchParams.set('X-Amz-Expires', '600');
  const signed = await r2Client(config).sign(url.toString(), {
    method: 'PUT',
    // The phone sends these same three headers (cache-control must also be in the bucket's CORS AllowedHeaders)
    headers: { 'content-type': contentType, 'content-length': String(size), 'cache-control': R2_CACHE_CONTROL },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}
