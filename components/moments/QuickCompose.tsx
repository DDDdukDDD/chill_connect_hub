'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MomentComposer } from '@/components/moments/MomentComposer';
import { Toast } from '@/components/Toast';
import { HOME_MODE_KEY, announcePosted } from '@/lib/homeAgain';

/**
 * The bottom bar's ＋ on any page but Home (owner 2026-11-26, option C, like IG): the posting form opens over the page
 * the member is on, so closing it leaves them where they were. "โพสต์" takes them to Home, where the progress card
 * runs (it is global) and the post joins the top of the feed when it is up (announcePosted → HomeMomentFeed).
 * The bar keeps this mounted after the first tap and gives each tap a new `key`.
 */
export default function QuickCompose() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      {isOpen && (
        <MomentComposer
          onClose={() => setIsOpen(false)}
          onToast={showToast}
          onSubmitted={() => {
            try {
              localStorage.setItem(HOME_MODE_KEY, 'foryou');
            } catch {
              // storage blocked: Home opens on its default, สำหรับคุณ, anyway
            }
            router.push('/');
          }}
          // Runs when the upload is done, by then on Home: the feed adds the post and shows the challenge notice
          onPosted={(moment, counted) => announcePosted({ moment, counted })}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
