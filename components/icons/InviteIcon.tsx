import React from 'react';

/**
 * The "ชวนไป" icon (owner 2026-11-12): two buddies, one winking, with a go arrow, in the reaction row's style
 * (components/icons/ActionIcons.tsx): dark rounded outline, pastel orange and green. Drawn wide (about 2.3:1) so the
 * faces stay readable beside text: give it a width as well (`h-[17px] w-[39px]`). `mono` draws it all in
 * `currentColor` for places where colors would not show, such as white over a clip.
 */
export function InviteIcon({ className = 'h-[17px] w-[39px]', mono = false }: { className?: string; mono?: boolean }) {
  const ink = mono ? 'currentColor' : '#1E293B';
  return (
    <svg viewBox="0.6 3.6 47.6 20.8" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="14" r="9" fill={mono ? 'currentColor' : '#FFEDD5'} fillOpacity={mono ? 0.14 : 1} />
      <circle cx="26" cy="14" r="9" fill={mono ? 'currentColor' : '#D1FAE5'} fillOpacity={mono ? 0.14 : 1} />
      <circle cx="8.4" cy="12.8" r="1.5" fill={ink} stroke="none" />
      <circle cx="13.6" cy="12.8" r="1.5" fill={ink} stroke="none" />
      <path d="M8.7 16.6c1.2 1.3 3.4 1.3 4.6 0" strokeWidth="1.8" />
      <circle cx="23.4" cy="12.8" r="1.5" fill={ink} stroke="none" />
      <path d="M27.4 11.4l1.8 1.4-1.8 1.4" strokeWidth="1.7" />
      <path d="M23.7 16.6c1.2 1.3 3.4 1.3 4.6 0" strokeWidth="1.8" />
      <path d="M38.5 14h8M46.5 14l-3.2-3.4M46.5 14l-3.2 3.4" />
    </svg>
  );
}
