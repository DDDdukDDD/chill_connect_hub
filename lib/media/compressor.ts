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

export interface CompressedResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // e.g. 85 for 85% reduction
}

/**
 * Compresses an image file in-browser using HTML5 Canvas and returns both File and DataURL
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedResult> {
  // SVG bypass
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          file,
          dataUrl: reader.result as string,
          width: 0,
          height: 0,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
        });
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ SVG ได้'));
      reader.readAsDataURL(file);
    });
  }

  // Safety check for browser environment
  if (typeof window === 'undefined') {
    return {
      file,
      dataUrl: '',
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
    };
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
            const fallbackUrl = typeof event.target?.result === 'string' ? event.target.result : '';
            return resolve({
              file,
              dataUrl: fallbackUrl,
              width: img.width,
              height: img.height,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0,
            });
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mime = targetMimeType || 'image/webp';
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL(mime, quality);
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve({
                  file,
                  dataUrl,
                  width,
                  height,
                  originalSize: file.size,
                  compressedSize: file.size,
                  compressionRatio: 0,
                });
              }

              // Determine output filename
              const originalBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const outputExt = mime === 'image/webp' ? 'webp' : 'jpg';
              const compressedFile = new File([blob], `${originalBase}.${outputExt}`, {
                type: blob.type || mime,
                lastModified: Date.now(),
              });

              const originalSize = file.size;
              const compressedSize = compressedFile.size;
              const compressionRatio = Math.max(
                0,
                Math.round(((originalSize - compressedSize) / originalSize) * 100)
              );

              resolve({
                file: compressedSize < originalSize ? compressedFile : file,
                dataUrl,
                width,
                height,
                originalSize,
                compressedSize,
                compressionRatio,
              });
            },
            mime,
            quality
          );
        } catch {
          // Fallback to original file on any canvas error
          const fallbackUrl = typeof event.target?.result === 'string' ? event.target.result : '';
          resolve({
            file,
            dataUrl: fallbackUrl,
            width: img.width,
            height: img.height,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
          });
        }
      };

      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        resolve({
          file,
          dataUrl: '',
          width: 0,
          height: 0,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
        });
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file in-browser using HTML5 Canvas (Returns File only)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const result = await compressImageToDataUrl(file, options);
  return result.file;
}

