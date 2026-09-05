/**
 * 🏭 Chill & Connect Hub - Media Storage Factory
 * Provides unified singleton access to current media storage adapter.
 */

import { IMediaStorage } from './types';
import { LocalStorageAdapter } from './adapters/localStorageAdapter';
import { CloudStorageAdapter } from './adapters/cloudStorageAdapter';

export * from './types';
export * from './adapters/localStorageAdapter';
export * from './adapters/cloudStorageAdapter';

let storageInstance: IMediaStorage | null = null;

export function getMediaStorage(): IMediaStorage {
  if (!storageInstance) {
    const driver = process.env.STORAGE_DRIVER || 'local';
    if (driver === 'cloud') {
      storageInstance = new CloudStorageAdapter();
    } else {
      storageInstance = new LocalStorageAdapter();
    }
  }
  return storageInstance;
}

export const mediaStorage = getMediaStorage();
