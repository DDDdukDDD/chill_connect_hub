'use client';

import { useEffect, useRef } from 'react';
import { watchSponsored } from '@/lib/social/trackClient';

/**
 * The chip on a sponsored card's photo (lib/sponsored): says plainly that a venue or organiser paid for its place,
 * on the photo so the tile keeps its height (owner 2026-10-31). Top left; ChallengeTile puts it top right, past its XP sticker.
 * It also counts the card being seen and tapped for the sponsor (docs/TRACEABILITY.md), so the tiles need no changes.
 */
export function SponsoredBadge({ className = 'left-2.5 top-2.5' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => (ref.current ? watchSponsored(ref.current) : undefined), []);
  return (
    <span ref={ref} className={`absolute ${className} rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 whitespace-nowrap shadow-sm`}>
      สนับสนุน
    </span>
  );
}
