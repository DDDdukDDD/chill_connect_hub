'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * The reaction row's icons (owner 2026-11-12, from chillwaa-action-bar-icons-24px, adjusted for 24 px): a dark rounded
 * outline, empty while off (a pastel fill read as "already liked", owner 2026-11-12); on, the fill turns bright and a smiling face appears, with a short
 * pop. No face while off on purpose: at 24 px a face on every post reads as clutter. Comment has no "on" state.
 * `onDark` (over a clip): a white outline while off; on keeps the bright fill and face.
 */
const INK = '#1E293B';
const HEART = 'M24 39.5C24 39.5 7.5 29.2 7.5 17.5C7.5 11.8 12 7.5 17.2 7.5C20.4 7.5 22.8 9.2 24 11.5C25.2 9.2 27.6 7.5 30.8 7.5C36 7.5 40.5 11.8 40.5 17.5C40.5 29.2 24 39.5 24 39.5Z';
const BUBBLE = 'M24 8C14.1 8 6.5 14.5 6.5 22.8C6.5 26.8 8.4 30.4 11.5 33L9.2 39.5L16.8 36.5C19 37.2 21.5 37.6 24 37.6C33.9 37.6 41.5 31.1 41.5 22.8C41.5 14.5 33.9 8 24 8Z';
const RIBBON = 'M12 11C12 8.8 13.8 7 16 7H32C34.2 7 36 8.8 36 11V40.5L24 33L12 40.5V11Z';

/** Pops only when the icon turns on after it is shown, not for posts already liked when the page opens */
function usePop(active: boolean) {
  const [pop, setPop] = useState(0);
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current) setPop((n) => n + 1);
    was.current = active;
  }, [active]);
  return pop;
}

function Frame({ className, pop, onDark, children }: { className: string; pop?: number; onDark?: boolean; children: React.ReactNode }) {
  return (
    <svg
      key={pop}
      viewBox="0 0 48 48"
      fill="none"
      stroke={onDark ? '#fff' : INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0 ${pop ? 'motion-safe:animate-icon-pop' : ''}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Face({ eyeY, left, right, smile }: { eyeY: number; left: number; right: number; smile: string }) {
  return (
    <>
      <circle cx={left} cy={eyeY} r="2.3" fill={INK} stroke="none" />
      <circle cx={right} cy={eyeY} r="2.3" fill={INK} stroke="none" />
      <path d={smile} />
    </>
  );
}

export function LikeIcon({ active, className = 'w-6 h-6', onDark }: { active: boolean; className?: string; onDark?: boolean }) {
  const pop = usePop(active);
  return (
    <Frame className={className} pop={pop} onDark={onDark && !active}>
      <path d={HEART} fill={active ? '#FB7185' : 'none'} />
      {active && <Face eyeY={20.5} left={19} right={29} smile="M20.3 25.6c1.9 2.2 5.5 2.2 7.4 0" />}
    </Frame>
  );
}

export function CommentIcon({ className = 'w-6 h-6', onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Frame className={className} onDark={onDark}>
      <path d={BUBBLE} />
    </Frame>
  );
}

export function SaveIcon({ active, className = 'w-6 h-6', onDark }: { active: boolean; className?: string; onDark?: boolean }) {
  const pop = usePop(active);
  return (
    <Frame className={className} pop={pop} onDark={onDark && !active}>
      <path d={RIBBON} fill={active ? '#FBBF24' : 'none'} />
      {active && <Face eyeY={19} left={19.8} right={28.2} smile="M20.6 24.2c1.9 2.2 4.9 2.2 6.8 0" />}
    </Frame>
  );
}

/** แชร์: a paper plane drawn in the same box and line as the heart and bubble, so the row reads as one set (owner 2026-11-13) */
export function SendIcon({ className = 'w-6 h-6', onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Frame className={className} onDark={onDark}>
      <path d="M40.5 7.5L7.5 19.8L20.8 25.6L27 40.5L40.5 7.5Z" />
      <path d="M40.5 7.5L20.8 25.6" />
    </Frame>
  );
}
