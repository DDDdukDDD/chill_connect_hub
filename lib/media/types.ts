/**
 * 📷 Chill & Connect Hub - Media Storage Types
 * Interfaces for Pluggable Media Storage Drivers (Local Disk / S3 / Supabase / Cloudinary).
 */

export interface UploadOptions {
  /** Target storage directory/folder prefix (e.g. 'events', 'spots', 'avatars') */
  folder?: string;
  /** Permitted mime types (e.g. ['image/jpeg', 'image/png', 'image/webp', 'image/avif']) */
  allowedMimeTypes?: string[];
  /** Maximum allowed size in bytes (default: 5MB) */
  maxSizeBytes?: number;
  /** Custom base filename (without path) */
  filename?: string;
}

export interface UploadResult {
  /** Accessible public URL (e.g. '/uploads/events/123.webp' or 'https://cdn.example.com/...') */
  url: string;
  /** Storage key / relative file path for retrieval and deletion */
  key: string;
  /** Final file size in bytes */
  size: number;
  /** MIME type of stored file */
  mimeType: string;
  /** Original uploaded file name */
  originalName: string;
  /** Optional image dimensions */
  width?: number;
  height?: number;
}

export interface IMediaStorage {
  /**
   * Upload an image buffer/stream to storage
   */
  upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Delete an image from storage by key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Retrieve the public URL for a given storage key
   */
  getPublicUrl(key: string): string;
}
