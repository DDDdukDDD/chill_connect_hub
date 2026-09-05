/**
 * ⚡ Chill & Connect Hub - Client-Side Image Pre-Compressor
 * Scales down large camera photos and converts to WebP before upload.
 * Reduces 5-12MB camera captures down to 100-250KB, saving 80-95% bandwidth & storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMimeType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  targetMimeType: 'image/webp',
};

/**
 * Compresses an image file in-browser using HTML5 Canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // If file is SVG or already very small (< 100KB), return as-is
  if (file.type === 'image/svg+xml' || file.size < 100 * 1024) {
    return file;
  }

  // Safety check for browser environment
  if (typeof window === 'undefined') {
    return file;
  }

  const { maxWidth, maxHeight, quality, targetMimeType } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute aspect ratio scaling
          const maxW = maxWidth || 1600;
          const maxH = maxHeight || 1600;

          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file); // Fallback if 2d context unavailable
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mime = targetMimeType || 'image/webp';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // Determine output filename
              const originalBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const outputExt = mime === 'image/webp' ? 'webp' : 'jpg';
              const compressedFile = new File([blob], `${originalBase}.${outputExt}`, {
                type: mime,
                lastModified: Date.now(),
              });

              // If for any reason compressed version is larger (rare), keep original
              if (compressedFile.size > file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            },
            mime,
            quality
          );
        } catch {
          // Fallback to original file on any canvas error
          resolve(file);
        }
      };

      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        resolve(file);
      }
    };

    reader.readAsDataURL(file);
  });
}
