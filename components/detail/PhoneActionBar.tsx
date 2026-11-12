'use client';

import React from 'react';
import { InvitePill } from '@/components/invites/InvitePill';
import type { InviteTarget } from '@/components/invites/InviteSheet';

/**
 * "ชวนไป" in a phone bar (places, อีเวนต์, ตี้): a pill, not a circle, since the paper-plane icon is wide and a 40 px
 * circle crowds it (placement pass 2026-11-12). Same border as the bar's round buttons beside it.
 */
export const PHONE_BAR_INVITE =
  'h-10 px-3 rounded-full border border-slate-200 bg-white inline-flex items-center justify-center shrink-0 cursor-pointer active:scale-95 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]';

/**
 * The bar that rises above the phone menu once the header's buttons scroll away (MobileNav `actionBar`), for places
 * and อีเวนต์ (owner 2026-11-12, like ตี้ and ชาเลนจ์): what and when on the left, then "ชวนไป" and the page's one
 * main button, so neither is ever more than a thumb away.
 */
export function PhoneActionBar({ title, status, invite, primary }: {
  title: string;
  status?: { text: string; tone: 'open' | 'closed' | 'plain' };
  invite?: { target: InviteTarget; place: string; isLoggedIn: boolean; onRequireLogin: () => void; onMessage: (message: string) => void };
  primary: { label: string; onClick: () => void; done?: boolean };
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{title}</p>
        {status && (
          <p className={`text-[11px] sm:text-xs font-semibold truncate ${status.tone === 'open' ? 'text-emerald-700' : 'text-slate-500'}`}>{status.text}</p>
        )}
      </div>
      {invite && (
        <InvitePill
          {...invite}
          iconOnly
          className={PHONE_BAR_INVITE}
        />
      )}
      <button
        type="button"
        onClick={primary.onClick}
        aria-pressed={primary.done}
        className={
          primary.done
            ? 'px-4 py-2.5 rounded-full border-[1.5px] border-[#2563EB] bg-white text-[#1D4ED8] text-sm font-semibold shrink-0 cursor-pointer active:scale-95 whitespace-nowrap'
            : 'px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shrink-0 cursor-pointer active:scale-95 whitespace-nowrap'
        }
      >
        {primary.label}
      </button>
    </div>
  );
}
