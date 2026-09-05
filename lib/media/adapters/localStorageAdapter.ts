/**
 * 💾 Chill & Connect Hub - Local File System Media Storage Driver
 * Stores media assets locally in the public/uploads directory during local dev & self-hosted setups.
 */

import fs from 'fs/promises';
import path from 'path';
import { IMediaStorage, UploadOptions, UploadResult } from '../types';

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export class LocalStorageAdapter implements IMediaStorage {
  private baseUploadDir: string;
  private publicPrefix: string;

  constructor(
    baseUploadDir = path.join(process.cwd(), 'public', 'uploads'),
    publicPrefix = '/uploads'
  ) {
    this.baseUploadDir = baseUploadDir;
    this.publicPrefix = publicPrefix;
  }

  public async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const allowedTypes = options.allowedMimeTypes || DEFAULT_ALLOWED_TYPES;
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(
        `รูปแบบไฟล์ไม่ถูกต้อง: ${mimeType} (อนุญาตเฉพาะ ${allowedTypes.join(', ')})`
      );
    }

    const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;
    if (fileBuffer.length > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      throw new Error(`ขนาดไฟล์เกินกำหนดสูงสุด (${maxMb}MB)`);
    }

    const folder = (options.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(this.baseUploadDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    // Determine safe extension
    const ext = this.getExtensionFromMime(mimeType, originalName);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const safeFilename = options.filename
      ? `${options.filename.replace(/[^a-zA-Z0-9_-]/g, '')}-${uniqueSuffix}.${ext}`
      : `${uniqueSuffix}.${ext}`;

    const filePath = path.join(targetDir, safeFilename);
    await fs.writeFile(filePath, fileBuffer);

    const relativeKey = `${folder}/${safeFilename}`;
    const publicUrl = `${this.publicPrefix}/${relativeKey}`;

    return {
      url: publicUrl,
      key: relativeKey,
      size: fileBuffer.length,
      mimeType,
      originalName,
    };
  }

  public async delete(key: string): Promise<boolean> {
    try {
      // Path traversal protection
      const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(this.baseUploadDir, safeKey);

      // Verify the file is actually inside baseUploadDir
      if (!fullPath.startsWith(this.baseUploadDir)) {
        throw new Error('Invalid path traversal attempt');
      }

      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  public getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.publicPrefix}/${cleanKey}`;
  }

  private getExtensionFromMime(mimeType: string, originalName: string): string {
    const extFromOriginal = path.extname(originalName).replace('.', '').toLowerCase();
    if (extFromOriginal && ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'].includes(extFromOriginal)) {
      return extFromOriginal === 'jpeg' ? 'jpg' : extFromOriginal;
    }

    switch (mimeType) {
      case 'image/webp':
        return 'webp';
      case 'image/avif':
        return 'avif';
      case 'image/png':
        return 'png';
      case 'image/svg+xml':
        return 'svg';
      case 'image/jpeg':
      default:
        return 'jpg';
    }
  }
}
