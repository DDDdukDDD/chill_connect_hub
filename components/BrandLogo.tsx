'use client';

import React from 'react';

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

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'embrace',
  className = '',
  withShadow = true,
}) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${config.box} ${
        withShadow ? 'drop-shadow-xs' : ''
      } ${className}`}
      style={{ width: config.dim, height: config.dim }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          {/* Gradient: Coral Amber (Connect) */}
          <linearGradient id="c_connect_grad" x1="20" y1="15" x2="85" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#F26430" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>

          {/* Gradient: Emerald Mint (Chill) */}
          <linearGradient id="c_chill_grad" x1="20" y1="85" x2="85" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#065F46" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* Continuous Full Gradient (Infinity) */}
          <linearGradient id="c_infinity_grad" x1="75" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F26430" />
            <stop offset="35%" stopColor="#FB923C" />
            <stop offset="65%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Drop Shadow Filter for Overlap Depth */}
          <filter id="c_overlap_shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="-1.5" dy="1.5" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* ── VARIANT 1: THE HARMONIC EMBRACE (RECOMMENDED - AIRBNB / STRIPE LEVEL) ── */}
        {variant === 'embrace' && (
          <g>
            {/* Background Squircle Container for Solid Apple Feel */}
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="26"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />

            {/* Bottom Arc: Chill (Emerald Mint) */}
            <path
              d="M74 71 C64 82 48 85 36 78 C21 69 19 49 26 34"
              stroke="url(#c_chill_grad)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top Arc with Optical Overlap: Connect (Warm Amber Coral) */}
            <path
              d="M74 29 C63 17 46 15 33 23 C19 32 17 52 24 67 C28 75 35 80 43 82"
              stroke="url(#c_connect_grad)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#c_overlap_shadow)"
            />

            {/* Subtle Inner Connection Nucleus */}
            <circle cx="50" cy="50" r="4.5" fill="#F26430" opacity="0.9" />
          </g>
        )}

        {/* ── VARIANT 2: THE CONTINUOUS MÖBIUS (APPLE / TECH FLAGSHIP) ── */}
        {variant === 'infinity' && (
          <g>
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="26"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Bold Continuous C Loop */}
            <path
              d="M72 28 C58 14 36 14 23 27 C9 41 9 63 23 77 C36 90 58 90 72 76"
              stroke="url(#c_infinity_grad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Inner Accented Bevel Line */}
            <path
              d="M66 32 C55 22 38 22 28 32 C18 43 18 61 28 72 C38 82 55 82 66 72"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          </g>
        )}

        {/* ── VARIANT 3: THE GEOMETRIC DUO (FIGMA / SWISS MODERNISM) ── */}
        {variant === 'duo' && (
          <g>
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="26"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Upper Semi-Arc: Connect */}
            <path
              d="M75 30 C62 16 42 16 28 27 C23 31 20 37 19 43"
              stroke="#F26430"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Lower Semi-Arc: Chill */}
            <path
              d="M19 57 C20 63 23 69 28 73 C42 84 62 84 75 70"
              stroke="#4A7C59"
              strokeWidth="16"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ── VARIANT 4: THE PURE MONOGRAM (NIKE / NOTION MINIMAL) ── */}
        {variant === 'minimal' && (
          <g>
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="26"
              fill="#0F172A"
            />
            <path
              d="M72 30 C60 18 40 18 28 30 C16 42 16 62 28 74 C40 86 60 86 72 74"
              stroke="url(#c_connect_grad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
