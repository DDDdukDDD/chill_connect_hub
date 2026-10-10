import { del, list, put } from '@vercel/blob';
import { IMediaStorage, MediaStorageStats, StoredMediaFile, UploadOptions, UploadResult } from '../types';

/**
 * Vercel Blob storage (persists across deploys, served from Vercel's CDN).
 * Used when BLOB_READ_WRITE_TOKEN is set, or BLOB_STORE_ID with Vercel OIDC (see lib/media/index.ts).
 * The storage key is the blob URL, which is what Vercel Blob uses to delete a file.
 */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const safeFolder = (folder: string | undefined) => (folder || 'uploads').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'uploads';

export class BlobStorageAdapter implements IMediaStorage {
  public async upload(fileBuffer: Buffer, originalName: string, mimeType: string, options: UploadOptions = {}): Promise<UploadResult> {
    const extension = EXTENSIONS[mimeType] ?? 'bin';
    const pathname = `${safeFolder(options.folder)}/${Date.now()}.${extension}`;
    const blob = await put(pathname, fileBuffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: true, // unguessable names, no overwrites
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return { url: blob.url, key: blob.url, size: fileBuffer.length, mimeType, originalName };
  }

  public async delete(key: string): Promise<boolean> {
    try {
      await del(key);
      return true;
    } catch (error) {
      console.error('[BlobStorageAdapter] delete failed:', error);
      return false;
    }
  }

  public getPublicUrl(key: string): string {
    return key;
  }

  public async listFiles(): Promise<StoredMediaFile[]> {
    const files: StoredMediaFile[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const [folder, ...rest] = blob.pathname.split('/');
        const filename = rest.join('/') || folder;
        const extension = filename.split('.').pop()?.toLowerCase() ?? '';
        files.push({
          key: blob.url,
          url: blob.url,
          size: blob.size,
          mimeType: Object.entries(EXTENSIONS).find(([, ext]) => ext === extension)?.[0] ?? 'application/octet-stream',
          filename,
          folder: rest.length ? folder : '',
          createdAt: new Date(blob.uploadedAt).toISOString(),
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return files;
  }

  public async getStats(): Promise<MediaStorageStats> {
    const files = await this.listFiles();
    return {
      totalFiles: files.length,
      totalSizeBytes: files.reduce((sum, file) => sum + file.size, 0),
      webpFilesCount: files.filter((file) => file.mimeType === 'image/webp').length,
      storageDriver: 'vercel-blob',
    };
  }
}
