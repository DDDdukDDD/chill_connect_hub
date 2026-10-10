/**
 * 🏭 Chill & Connect Hub - Media Storage Factory
 * Provides unified singleton access to current media storage adapter.
 * - Vercel Blob (required on Vercel: its disk does not keep uploads), authenticated either by
 *   BLOB_READ_WRITE_TOKEN, or by BLOB_STORE_ID + Vercel OIDC (automatic on Vercel; locally VERCEL_OIDC_TOKEN
 *   comes from `vercel env pull`)
 * - otherwise the local public/uploads folder (development)
 */

import { IMediaStorage } from './types';
import { LocalStorageAdapter } from './adapters/localStorageAdapter';
import { BlobStorageAdapter } from './adapters/blobStorageAdapter';

export * from './types';
export * from './adapters/localStorageAdapter';
export * from './adapters/blobStorageAdapter';

let storageInstance: IMediaStorage | null = null;

function canUseBlob(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  // OIDC: Vercel provides the token at runtime; locally it must have been pulled into the env
  return Boolean(process.env.BLOB_STORE_ID && (process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN));
}

export function getMediaStorage(): IMediaStorage {
  if (!storageInstance) {
    storageInstance = canUseBlob() ? new BlobStorageAdapter() : new LocalStorageAdapter();
  }
  return storageInstance;
}

export function getMediaStorageDriver(): 'vercel-blob' | 'local' {
  return canUseBlob() ? 'vercel-blob' : 'local';
}

export const mediaStorage = getMediaStorage();
