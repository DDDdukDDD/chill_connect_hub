'use client';

import React from 'react';
import { X } from 'lucide-react';
import { InviteIcon } from '@/components/icons/InviteIcon';
import { InvitePill } from './InvitePill';
import type { InviteTarget } from './InviteSheet';

/**
 * "ชวนเพื่อนไปด้วยไหม" right after someone commits (owner 2026-11-11): joined a ตี้, saved an อีเวนต์. The moment they
 * most want to go is the moment to ask a friend; one line under the header with the same "ชวนไป" sheet, closable,
 * shown once per action (not stored).
 */
export function InviteNudge({ target, place, text, onMessage, onClose, className = '' }: {
  target: InviteTarget;
  place: string;
  text: string;
  onMessage: (message: string) => void;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div role="status" className={`flex items-center gap-3 rounded-2xl bg-blue-50 pl-4 pr-2 py-2.5 ${className}`}>
      <InviteIcon className="h-5 w-[46px] shrink-0" />
      <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900">{text}</p>
      <InvitePill
        target={target}
        place={place}
        isLoggedIn
        onRequireLogin={() => undefined}
        onMessage={(message) => {
          onMessage(message);
          onClose();
        }}
        className="shrink-0 h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold text-white cursor-pointer"
      />
      <button type="button" onClick={onClose} aria-label="ปิด" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white cursor-pointer">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
