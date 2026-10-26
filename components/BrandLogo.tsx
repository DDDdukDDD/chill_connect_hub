'use client';

import React from 'react';
import Image from 'next/image';

/** Kept so older callers (e.g. /preview-logo) still type-check; every variant now shows the one brand logo */
export type BrandLogoVariant = 'embrace' | 'infinity' | 'duo' | 'minimal';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: BrandLogoVariant;
  className?: string;
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
 * The brand logo (`public/brand-logo.jpg`, owner 2026-10-26) in a rounded app-icon frame; the site name always sits beside it, so the image itself is decorative.
 * The source photo is large, so it goes through the Next.js image optimizer at the size shown.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '', withShadow = true }) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[26%] bg-white border border-slate-200 ${config.box} ${
        withShadow ? 'shadow-xs' : ''
      } ${className}`}
      style={{ width: config.dim, height: config.dim }}
    >
      <Image src="/brand-logo.jpg" alt="" width={config.dim} height={config.dim} className="w-full h-full object-cover select-none" priority={size === 'md'} />
    </div>
  );
};
