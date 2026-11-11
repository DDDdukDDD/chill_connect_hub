'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { InviteSheet, type InviteTarget } from '@/components/invites/InviteSheet';

/**
 * The "ชวนไป" button on every detail page (owner 2026-11-11): the same paper plane as the feed's pill, opening the
 * same sheet. Guests are asked to sign in first. The page passes its own button class so it sits in its row.
 */
export function InvitePill({
  target,
  place,
  isLoggedIn,
  onRequireLogin,
  onMessage,
  className,
  iconOnlyOnPhone = false,
  iconOnly = false,
}: {
  target: InviteTarget;
  place: string;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onMessage: (message: string) => void;
  className: string;
  /** Rows that keep one main button on a phone show only the icon there */
  iconOnlyOnPhone?: boolean;
  /** Only the paper plane at every width (the phone action bar) */
  iconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => (isLoggedIn ? setIsOpen(true) : onRequireLogin())} aria-label="ชวนเพื่อนไป" className={className}>
        <Send className="w-4 h-4 -rotate-12" aria-hidden="true" />
        <span className={iconOnly ? 'sr-only' : iconOnlyOnPhone ? 'max-sm:sr-only' : undefined}>ชวนไป</span>
      </button>
      {isOpen && (
        <InviteSheet
          target={target}
          place={place}
          onClose={() => setIsOpen(false)}
          onDone={(message) => {
            setIsOpen(false);
            onMessage(message);
          }}
        />
      )}
    </>
  );
}
