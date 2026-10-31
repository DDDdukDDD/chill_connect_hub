import React from 'react';

interface BrandWordmarkProps {
  /** Text size classes for the name, e.g. 'text-lg sm:text-[19px]' */
  sizeClass?: string;
  /** Show the tagline under the name; extra classes (e.g. 'hidden sm:block') go in taglineClass */
  tagline?: boolean;
  taglineClass?: string;
  /** On a dark photo: white name, light tagline */
  onDark?: boolean;
  className?: string;
}

/** Small to large, calm to wow: the dots carry the logo's green ("Chill") over to its orange ("Waa") */
const DOTS = [
  { size: '0.18em', light: '#1DB584', dark: '#4ADE9F', delay: '0ms' },
  { size: '0.22em', light: '#F59A6B', dark: '#FFC2A6', delay: '110ms' },
  { size: '0.27em', light: '#EA5A1A', dark: '#FF8A5B', delay: '220ms' },
];

/**
 * The written brand (owner 2026-10-31, BE-191): "Chill···Waa". "Chill" green (calm), "Waa" orange (the wow): the two arcs of the logo, and three dots between
 * that grow and warm from one to the other: friends meeting halfway. Inside a `group` link the dots hop in turn on hover, like someone
 * typing in a chat; still for people who turn motion off. Screen readers get "Chillwaa" once.
 */
export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ sizeClass = 'text-base', tagline = false, taglineClass = '', onDark = false, className = '' }) => (
  <span className={`flex flex-col justify-center min-w-0 ${className}`}>
    <span className="sr-only">Chillwaa</span>
    <span
      aria-hidden="true"
      className={`inline-flex items-baseline font-[family-name:var(--font-plus-jakarta)] font-extrabold tracking-[-0.03em] leading-none whitespace-nowrap ${sizeClass} ${onDark ? 'text-[#4ADE9F]' : 'text-[#128A64]'}`}
    >
      Chill
      <span className="inline-flex items-baseline gap-[0.13em] mx-[0.15em]">
        {DOTS.map((dot) => (
          <span
            key={dot.delay}
            className="inline-block rounded-full motion-safe:group-hover:animate-dot-hop"
            style={{ width: dot.size, height: dot.size, backgroundColor: onDark ? dot.dark : dot.light, animationDelay: dot.delay }}
          />
        ))}
      </span>
      <span className={onDark ? 'text-[#FF8A5B]' : 'text-[#EA5A1A]'}>Waa</span>
    </span>
    {tagline && (
      <span
        aria-hidden="true"
        className={`text-[11px] font-medium tracking-normal leading-snug mt-1 ${onDark ? 'text-white/80' : 'text-slate-500'} ${taglineClass}`}
      >
        ชวนเพื่อน ออกไปใช้ชีวิต
      </span>
    )}
  </span>
);
