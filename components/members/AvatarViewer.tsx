'use client';

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/components/auth/DialogShell';
import { optimizedImage, safeImageSrc } from '@/lib/optimizedImage';

/**
 * A profile picture large (owner 2026-11-20: people tapped the small circle to see the face, as on IG and Facebook).
 * The stored file itself (a 640 px square, or the provider's picture), on a dark screen; a tap outside, the X or
 * Escape closes it.
 */
/** Unsplash pictures (sample accounts) are linked at 150 px: ask for 640. Uploads are shown as stored, never resized */
const largeSrc = (src: string) => (src.startsWith('https://images.unsplash.com/') ? optimizedImage(src, 640) : safeImageSrc(src));

export function AvatarViewer({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose, { focusField: false });
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={panelRef}
      data-dialog-shell
      role="dialog"
      aria-modal="true"
      aria-label={`รูปโปรไฟล์ของ ${name}`}
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // The dark backdrop as a style: the dev server did not build `bg-black/90` for this new file (2026-11-20)
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.92)' }}
      className="fixed inset-0 z-[100003] flex flex-col items-center justify-center gap-4 p-4 pt-[max(1rem,env(safe-area-inset-top))] focus:outline-hidden"
    >
      <button type="button" onClick={onClose} aria-label="ปิด" style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)' }} className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] w-11 h-11 rounded-full hover:brightness-125 text-white flex items-center justify-center cursor-pointer">
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- a member's picture from uploads or a provider, shown whole */}
      <img src={largeSrc(src)} alt={`รูปโปรไฟล์ของ ${name}`} className="w-[min(88vw,72vh,560px)] aspect-square rounded-full object-cover bg-slate-800 shadow-2xl" />
      <p className="text-base font-bold text-white text-center break-words max-w-[88vw]">{name}</p>
    </div>,
    document.body
  );
}
