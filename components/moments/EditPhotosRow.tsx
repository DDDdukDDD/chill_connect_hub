'use client';

import React, { useRef } from 'react';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { exportPhoto, newPhoto } from '@/lib/media/photoEdit';
import { optimizedImage } from '@/lib/optimizedImage';
import { MAX_MOMENT_IMAGES } from '@/lib/moments/types';

/**
 * The photos of a posted moment in "แก้ไขโพสต์" (owner 2026-11-08): take one out, move one earlier, or add more.
 * New photos stay on the phone until บันทึก, cut to the post's shape, so a cancelled edit leaves nothing in storage.
 */
export interface EditablePhoto {
  /** Stored URL, or a local preview for a photo added in this edit */
  url: string;
  added?: Blob;
}

/** A 4:5 post stays 4:5; anything else is square, as MomentPhotos shows it */
export const postRatio = (ratio?: number) => (typeof ratio === 'number' && ratio > 0.78 && ratio < 0.82 ? 0.8 : 1);

async function cutToPost(file: File, ratio: number): Promise<EditablePhoto | null> {
  const local = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const probe = new window.Image();
      probe.onload = () => resolve(probe);
      probe.onerror = reject;
      probe.src = local;
    });
    const added = await exportPhoto(newPhoto('edit', local, image), ratio);
    return { url: URL.createObjectURL(added), added };
  } catch {
    return null; // a format this browser cannot open, such as HEIC on a computer
  } finally {
    URL.revokeObjectURL(local);
  }
}

export function EditPhotosRow({ photos, ratio, onChange, onError }: {
  photos: EditablePhoto[];
  ratio: number;
  onChange: (photos: EditablePhoto[]) => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const room = MAX_MOMENT_IMAGES - photos.length;

  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, room);
    e.target.value = '';
    const cut = (await Promise.all(files.map((file) => cutToPost(file, ratio)))).filter((p): p is EditablePhoto => p !== null);
    if (cut.length < files.length) onError('บางรูปเปิดบนเครื่องนี้ไม่ได้ ลองเลือกรูปอื่นนะ');
    if (cut.length) onChange([...photos, ...cut]);
  };
  const remove = (index: number) => {
    const photo = photos[index];
    if (photo.added) URL.revokeObjectURL(photo.url);
    onChange(photos.filter((_, i) => i !== index));
  };
  const moveEarlier = (index: number) => {
    const next = [...photos];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  return (
    <div className="mb-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {photos.map((photo, index) => (
          <div key={photo.url} className={`relative shrink-0 w-20 ${ratio === 0.8 ? 'aspect-[4/5]' : 'aspect-square'} rounded-xl overflow-hidden bg-slate-100`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.added ? photo.url : optimizedImage(photo.url, 256)} alt={`รูปที่ ${index + 1}`} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <button type="button" onClick={() => remove(index)} aria-label={`เอารูปที่ ${index + 1} ออก`} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {index > 0 && (
              <button type="button" onClick={() => moveEarlier(index)} aria-label={`เลื่อนรูปที่ ${index + 1} ไปก่อน`} className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`shrink-0 w-20 ${ratio === 0.8 ? 'aspect-[4/5]' : 'aspect-square'} rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 flex flex-col items-center justify-center gap-1 text-xs`}
          >
            <Plus className="w-5 h-5" />
            เพิ่มรูป
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple aria-label="เลือกรูปที่จะเพิ่ม" className="hidden" onChange={add} />
    </div>
  );
}
