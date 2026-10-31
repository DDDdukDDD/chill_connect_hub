'use client';

import React from 'react';

/** Kept so older callers (e.g. /preview-logo) still type-check; every variant now shows the one brand logo */
export type BrandLogoVariant = 'embrace' | 'infinity' | 'duo' | 'minimal';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: BrandLogoVariant;
  className?: string;
  /** The rounded white app-icon frame, for places where the mark stands alone as an icon */
  framed?: boolean;
  /** Only with `framed` */
  withShadow?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', dim: 24 },
  sm: { box: 'w-8 h-8', dim: 32 },
  md: { box: 'w-10 h-10', dim: 40 },
  lg: { box: 'w-12 h-12', dim: 48 },
  xl: { box: 'w-16 h-16', dim: 64 },
};

/**
 * The brand mark (`public/brand-logo.svg`, owner 2026-10-31): the orange and green arcs with the dot, on a clear background.
 * Next to the wordmark it stands bare (no frame, owner 2026-10-31); `framed` puts it in the old app-icon frame.
 * The site name always sits beside it, so the image itself is decorative.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '', framed = false, withShadow = true }) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;
  // A small vector file: a plain <img> keeps it sharp at every size without the image optimizer
  // eslint-disable-next-line @next/next/no-img-element
  const mark = <img src="/brand-logo.svg" alt="" width={config.dim} height={config.dim} className="w-full h-full select-none" draggable={false} />;

  if (!framed) {
    return (
      <span className={`inline-flex shrink-0 ${config.box} ${className}`} style={{ width: config.dim, height: config.dim }}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[26%] bg-white border border-slate-200 p-[12%] ${config.box} ${
        withShadow ? 'shadow-xs' : ''
      } ${className}`}
      style={{ width: config.dim, height: config.dim }}
    >
      {mark}
    </span>
  );
};
