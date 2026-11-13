'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DialogShell } from './auth/DialogShell';
import { QuickSignup } from './auth/QuickSignup';
import { optimizedImage } from '@/lib/optimizedImage';

interface RequireMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  /** Opens the sign-up form in place; without it email sign-up goes to /login?mode=signup */
  onOpenSignup?: () => void;
  /**
   * What the visitor tried, e.g. "เพื่อเข้าร่วมกิจกรรม". Kept for the callers, not shown: the popup says one thing
   * everywhere (owner 2026-11-12: one plain message, the same each time)
   */
  actionTitle?: string;
  /** Where sign-up comes back to (default: this page), e.g. "/community/<id>?join=1" to finish the join */
  returnTo?: string;
  /** The picture of what the visitor is looking at (a place, ตี้, อีเวนต์, challenge): it leads the three photos */
  photo?: string;
}

/** Fun moments of people out together, our own files (the /moments collage's): shown when there is no photo of their own */
const FUN_PHOTOS = ['/images/onboarding/friends-start.jpg', '/images/onboarding/challenge-cheer.jpg', '/images/onboarding/fair-festival.jpg'];

/** Three photos as tilted prints over the button (owner 2026-11-12): what the visitor is into, and people out having fun */
function Prints({ photo }: { photo?: string }) {
  const photos = photo ? [photo, FUN_PHOTOS[1], FUN_PHOTOS[2]] : FUN_PHOTOS;
  const tilt = ['-rotate-6 translate-y-1', 'z-10 -translate-y-1', 'rotate-6 translate-y-1'];
  return (
    <div className="flex justify-center pb-6" aria-hidden="true">
      {photos.map((src, i) => (
        <span key={src} className={`relative ${i ? '-ml-3' : ''} w-[84px] h-[104px] rounded-2xl overflow-hidden border-4 border-white bg-slate-100 shadow-md ${tilt[i]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local and remote photos */}
          <img src={optimizedImage(src, 256)} alt="" className="w-full h-full object-cover" />
        </span>
      ))}
    </div>
  );
}

/**
 * Shown when a visitor tries something that needs an account. One plain promise that speaks to why people come
 * (wanting to go out, nobody to go with), then sign-up right here in one tap, LINE first (owner 2026-11-12).
 */
export const RequireMembershipModal: React.FC<RequireMembershipModalProps> = ({ isOpen, onClose, onOpenLogin, onOpenSignup, returnTo, photo }) => {
  const pathname = usePathname();
  if (!isOpen) return null;

  return (
    <DialogShell onClose={onClose} size="sm" focusField={false} labelledBy="join-us-title">
      {/* Two lines of its own: as one line the close button covered its end on a 360 px phone */}
      <div className="text-center pb-6">
        <h2 id="join-us-title" className="px-8 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          Chillwaa
          <br />
          {/* The second half kept whole: on a phone the line broke as "…ใช้ชีวิตมี / ความหมาย" */}
          โซเชียลที่ทำให้<span className="inline-block">ทุกการใช้ชีวิตมีความหมาย</span>
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">มาร่วมสนุก ออกไปใช้ชีวิตไปกับเรา</p>
      </div>
      <Prints photo={photo} />
      <div>
        <QuickSignup
          returnTo={returnTo || pathname || '/'}
          onEmail={onOpenSignup ? () => { onClose(); onOpenSignup(); } : undefined}
          onLogin={() => { onClose(); onOpenLogin(); }}
        />
      </div>
    </DialogShell>
  );
};
