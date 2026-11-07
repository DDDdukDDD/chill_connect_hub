import { randomBytes } from 'node:crypto';
import { IMediaStorage, MediaStorageStats, StoredMediaFile, UploadOptions, UploadResult } from '../types';
import { R2_CACHE_CONTROL, r2Fetch, r2ObjectUrl, type R2Config } from '../r2';
import { BlobStorageAdapter } from './blobStorageAdapter';

/**
 * Cloudflare R2 storage (lib/media/r2.ts). Like the Blob adapter, the storage key is the public URL.
 * Until every old file has moved (db/move-media-to-r2.mjs), links on Vercel Blob still appear: deleting one of those
 * goes to Blob, which works where the Blob login exists (on Vercel).
 */
export const MEDIA_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

const safeFolder = (folder: string | undefined) => (folder || 'uploads').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'uploads';
const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/** A new name nobody can guess: folder/<name>-<time><random>.<ext> */
export function newMediaKey(folder: string | undefined, name: string, mimeType: string): string {
  const base = name.replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'file';
  return `${safeFolder(folder)}/${base}-${Date.now().toString(36)}${randomBytes(9).toString('base64url')}.${MEDIA_EXTENSIONS[mimeType] ?? 'bin'}`;
}

export class R2StorageAdapter implements IMediaStorage {
  constructor(private readonly config: R2Config) {}

  public async upload(fileBuffer: Buffer, originalName: string, mimeType: string, options: UploadOptions = {}): Promise<UploadResult> {
    const key = newMediaKey(options.folder, options.folder === 'moments' && mimeType.startsWith('video/') ? 'clip' : 'photo', mimeType);
    const res = await r2Fetch(this.config, r2ObjectUrl(this.config, key), {
      method: 'PUT',
      body: new Uint8Array(fileBuffer),
      headers: { 'content-type': mimeType, 'cache-control': R2_CACHE_CONTROL },
    });
    if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
    const url = `${this.config.publicUrl}/${key}`;
    return { url, key: url, size: fileBuffer.length, mimeType, originalName };
  }

  public async delete(key: string): Promise<boolean> {
    if (BLOB_URL.test(key)) return new BlobStorageAdapter().delete(key);
    const prefix = `${this.config.publicUrl}/`;
    if (!key.startsWith(prefix)) return false;
    try {
      const res = await r2Fetch(this.config, r2ObjectUrl(this.config, decodeURIComponent(key.slice(prefix.length))), { method: 'DELETE' });
      return res.ok;
    } catch (error) {
      console.error('[R2StorageAdapter] delete failed:', error);
      return false;
    }
  }

  public getPublicUrl(key: string): string {
    return key;
  }

  public async listFiles(): Promise<StoredMediaFile[]> {
    const files: StoredMediaFile[] = [];
    const unescape = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    let token: string | undefined;
    do {
      const url = new URL(`https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucket}`);
      url.searchParams.set('list-type', '2');
      if (token) url.searchParams.set('continuation-token', token);
      const res = await r2Fetch(this.config, url.toString());
      if (!res.ok) throw new Error(`R2 list failed: ${res.status}`);
      const xml = await res.text();
      for (const [, item] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
        const key = unescape(/<Key>([\s\S]*?)<\/Key>/.exec(item)?.[1] ?? '');
        const [folder, ...rest] = key.split('/');
        const filename = rest.join('/') || folder;
        const extension = filename.split('.').pop()?.toLowerCase() ?? '';
        const publicUrl = `${this.config.publicUrl}/${key}`;
        files.push({
          key: publicUrl,
          url: publicUrl,
          size: Number(/<Size>(\d+)<\/Size>/.exec(item)?.[1] ?? 0),
          mimeType: Object.entries(MEDIA_EXTENSIONS).find(([, ext]) => ext === extension)?.[0] ?? 'application/octet-stream',
          filename,
          folder: rest.length ? folder : '',
          createdAt: new Date(/<LastModified>([\s\S]*?)<\/LastModified>/.exec(item)?.[1] ?? Date.now()).toISOString(),
        });
      }
      token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? unescape(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? '') || undefined : undefined;
    } while (token);
    return files;
  }

  public async getStats(): Promise<MediaStorageStats> {
    const files = await this.listFiles();
    return {
      totalFiles: files.length,
      totalSizeBytes: files.reduce((sum, file) => sum + file.size, 0),
      webpFilesCount: files.filter((file) => file.mimeType === 'image/webp').length,
      storageDriver: 'cloudflare-r2',
    };
  }
}
