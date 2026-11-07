/**
 * 🏭 Chillwaa - Media Storage Factory
 * Provides unified singleton access to current media storage adapter.
 * - Cloudflare R2 when the R2_* settings exist (lib/media/r2.ts): live bucket on Vercel Production, the dev bucket
 *   in .env.development.local for `npm run dev`
 * - otherwise Vercel Blob (its disk does not keep uploads), authenticated either by BLOB_READ_WRITE_TOKEN, or by
 *   BLOB_STORE_ID + Vercel OIDC (automatic on Vercel; locally VERCEL_OIDC_TOKEN comes from `vercel env pull`)
 * - otherwise the local public/uploads folder (development)
 */

import { IMediaStorage } from './types';
import { LocalStorageAdapter } from './adapters/localStorageAdapter';
import { BlobStorageAdapter } from './adapters/blobStorageAdapter';
import { R2StorageAdapter } from './adapters/r2StorageAdapter';
import { r2Config } from './r2';

export * from './types';
export * from './adapters/localStorageAdapter';
export * from './adapters/blobStorageAdapter';

let storageInstance: IMediaStorage | null = null;

function canUseBlob(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  // OIDC: Vercel provides the token at runtime; locally it must have been pulled into the env
  return Boolean(process.env.BLOB_STORE_ID && (process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN));
}

export type MediaStorageDriver = 'cloudflare-r2' | 'vercel-blob' | 'local';

export function getMediaStorageDriver(): MediaStorageDriver {
  return r2Config() ? 'cloudflare-r2' : canUseBlob() ? 'vercel-blob' : 'local';
}

export function getMediaStorage(): IMediaStorage {
  if (!storageInstance) {
    const r2 = r2Config();
    storageInstance = r2 ? new R2StorageAdapter(r2) : canUseBlob() ? new BlobStorageAdapter() : new LocalStorageAdapter();
  }
  return storageInstance;
}

export const mediaStorage = getMediaStorage();
