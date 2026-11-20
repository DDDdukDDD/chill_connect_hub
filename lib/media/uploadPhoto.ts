'use client';

/**
 * Every photo upload (moments, profile pictures, ตี้, Spot Buddy, admin) builds its form here, so each photo goes with a
 * small copy made on the phone (owner 2026-11-20). Screens that need 640 px or less then load that copy instead of
 * asking Vercel to resize the original: the month's 5,000 resizes ran out on 2026-11-20 (BE-438). R2 keeps both files
 * (lib/media/ownMedia.ts); when the copy cannot be made here, the photo goes alone and screens show the original.
 */

/** Longest side of the copy: a card or tile at 2x. Profile pictures (640–800 px squares) show at 40–96 px nearly everywhere */
const SMALL_SIDE = 800;
const SMALL_SIDE_AVATAR = 384;
const SMALL_QUALITY = 0.8;

/** The copy in the original's own type (the server keeps it only then), or null when the original is already small */
export async function makeSmallCopy(photo: Blob, side: number): Promise<Blob | null> {
  if (typeof createImageBitmap === 'undefined' || !/^image\/(webp|jpeg|png)$/.test(photo.type)) return null;
  try {
    const bitmap = await createImageBitmap(photo);
    const longest = Math.max(bitmap.width, bitmap.height);
    // Not worth a second file when the original is barely larger than the copy would be
    if (longest <= side * 1.25) {
      bitmap.close();
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((bitmap.width * side) / longest);
    canvas.height = Math.round((bitmap.height * side) / longest);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const small = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, photo.type, SMALL_QUALITY));
    // Safari answers a PNG for a type it cannot write: then no copy
    return small && small.type === photo.type && small.size < photo.size ? small : null;
  } catch {
    return null;
  }
}

/** The form /api/upload takes: the photo, its folder and, when it could be made, its small copy */
export async function photoUploadForm(photo: Blob, folder: string, name?: string): Promise<FormData> {
  const form = new FormData();
  const fileName = name ?? (photo instanceof File ? photo.name : `photo.${photo.type === 'image/webp' ? 'webp' : photo.type === 'image/png' ? 'png' : 'jpg'}`);
  form.append('file', photo, fileName);
  form.append('folder', folder);
  const small = await makeSmallCopy(photo, folder === 'avatars' ? SMALL_SIDE_AVATAR : SMALL_SIDE);
  if (small) form.append('small', small, `small-${fileName}`);
  return form;
}
