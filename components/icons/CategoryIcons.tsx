import React from 'react';

/**
 * Category icons from the owner's Chill & Connect icon pack (2026-10-28, 37 drawings): drawn, each in its own color, on a 48 grid.
 * Generated from the pack's SVG files (one entry per file, named after it); redraw there and regenerate rather than
 * editing the paths here. The maps below tie a category id to a drawing; a category without one keeps its line icon.
 */
const DRAWINGS: Record<string, React.ReactNode> = {
  'all': (
    <>
      <circle cx="24" cy="26" r="17" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="6.5" r="2.5" stroke="#334155" strokeWidth="2.4" />
      <path d="M24 9V11" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17.5" cy="22" r="1.6" fill="#334155" />
      <path d="M28.5 21L31.5 22.5L28.5 24" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 33.5C22.2 35 25.8 35 27 33.5" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="29,18 25.5,27.5 19,31 22.5,21.5" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" fill="#334155" fillOpacity="0.14" />
      <path d="M39 11C41 13 42.5 15.5 43 18" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'cafe-chill': (
    <>
      <path d="M18 13C18 10.5 20.5 9.5 20.5 7" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 12C24 9 27 8 27 5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 13C30 10.5 32.5 9.5 32.5 7" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 18H35V31C35 37.6274 29.6274 42 23 42C16.3726 42 11 37.6274 11 31V18Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.1" />
      <path d="M35 21H38.5C41 21 42.5 23 42.5 26C42.5 29 41 31 38.5 31H35" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 25H34" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="14.5" y="24.5" width="7" height="5" rx="1.5" fill="#EA580C" />
      <rect x="24.5" y="24.5" width="7" height="5" rx="1.5" fill="#EA580C" />
      <path d="M20.5 34C22 35.5 25 35.5 26.5 33.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'movie-music': (
    <>
      <path d="M11 26V21C11 13.8203 16.8203 8 24 8C31.1797 8 37 13.8203 37 21V26" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="7" y="24" width="4.5" height="10" rx="2.2" stroke="#9333EA" strokeWidth="2.4" fill="#9333EA" fillOpacity="0.18" />
      <rect x="36.5" y="24" width="4.5" height="10" rx="2.2" stroke="#9333EA" strokeWidth="2.4" fill="#9333EA" fillOpacity="0.18" />
      <rect x="14" y="23" width="20" height="17" rx="3" stroke="#9333EA" strokeWidth="2.4" fill="#9333EA" fillOpacity="0.08" />
      <path d="M14 20L33 15.5L34 20L14 23V20Z" stroke="#9333EA" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M18.5 30C19.2 28.8 20.8 28.8 21.5 30" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26.5 30C27.2 28.8 28.8 28.8 29.5 30" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 34C23 35.5 25 35.5 26 34" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 11V17M40 11L44 10V16" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'run-fitness': (
    <>
      <path d="M17 19C12 17 9 12 11 8C14 9 17 11 19 14C15 13 13 15 17 19Z" stroke="#F97316" strokeWidth="2.4" strokeLinejoin="round" fill="#F97316" fillOpacity="0.16" />
      <path d="M16 21L24 18L30 26L40 29C42.5 30 43.5 33 42 35.5L40.5 37.5L12 31L16 21Z" stroke="#F97316" strokeWidth="2.4" strokeLinejoin="round" fill="#F97316" fillOpacity="0.08" />
      <path d="M11 34.5L39.5 41" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="26" r="1.4" fill="#F97316" />
      <circle cx="29" cy="27.5" r="1.4" fill="#F97316" />
      <path d="M25 30C26 31.2 27.8 31.2 28.8 30.2" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 16C36 16 39 17.5 38.5 19.5C38 21 36 20.5 36 19C36 17.5 36 16 36 16Z" stroke="#F97316" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M6 36H11M5 40H13" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'board-games': (
    <>
      <rect x="7" y="21" width="17" height="17" rx="3.5" transform="rotate(-12 7 21)" stroke="#0284C7" strokeWidth="2.4" fill="#0284C7" fillOpacity="0.1" />
      <circle cx="14" cy="26.5" r="1.5" fill="#0284C7" />
      <circle cx="20" cy="25" r="1.5" fill="#0284C7" />
      <path d="M15.5 31C17 32.5 19.5 32 20.5 30" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="24" y="10" width="17" height="17" rx="3.5" transform="rotate(14 24 10)" stroke="#0284C7" strokeWidth="2.4" fill="#0284C7" fillOpacity="0.1" />
      <circle cx="29" cy="17.5" r="1.5" fill="#0284C7" />
      <circle cx="35" cy="19" r="1.5" fill="#0284C7" />
      <path d="M29 22.5C30.5 24 33 24.5 34.5 23.5" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 13C14.5 10.5 17 9 20 9" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 33C35 36 32.5 38.5 29.5 39.5" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'travel-outdoor': (
    <>
      <circle cx="16" cy="17" r="6.5" stroke="#0D9488" strokeWidth="2.4" fill="#0D9488" fillOpacity="0.14" />
      <path d="M14 16.5C14.5 15.8 15.3 15.8 15.8 16.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M17.5 16.5C18 15.8 18.8 15.8 19.3 16.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15.2 19C16 20 17.5 20 18.2 19" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 7V8.5M9 10L10.2 11.2M6.5 17H8M22.5 10L21.3 11.2" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 11L41 23H37L42 33H27" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 39L23 19L35 39H11Z" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.1" />
      <path d="M23 19V39" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 39L23 30L28 39" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M7 39H41" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'racket-sports': (
    <>
      <circle cx="31" cy="19" r="10.5" stroke="#D97706" strokeWidth="2.4" fill="#D97706" fillOpacity="0.1" />
      <circle cx="28.5" cy="17.5" r="1.5" fill="#D97706" />
      <circle cx="33.5" cy="17.5" r="1.5" fill="#D97706" />
      <path d="M29 21.5C30 23 32 23 33 21.5" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23.5 26.5L10 40" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.5 38.5L11.5 41.5" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17.5" cy="19.5" r="2.8" stroke="#D97706" strokeWidth="2.4" fill="#D97706" fillOpacity="0.2" />
      <path d="M15.5 17.5L10 12L14 9.5L18.5 16.5" stroke="#D97706" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M16.5 16.5L14 9.5L19 9L19.5 16.8" stroke="#D97706" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M39 27C41 25 42.5 22.5 43 19.5" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'photo-content': (
    <>
      <rect x="7" y="16" width="32" height="23" rx="4.5" stroke="#0284C7" strokeWidth="2.4" fill="#0284C7" fillOpacity="0.09" />
      <path d="M16 16L18.5 11.5H27.5L30 16" stroke="#0284C7" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="23" cy="27.5" r="8" stroke="#0284C7" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="20.2" cy="26.5" r="1.4" fill="#0284C7" />
      <path d="M24.5 25.5L26.8 26.8L24.5 28" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 30C22 31.3 24 31.3 25 30" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38 6L39.5 10.5L44 12L39.5 13.5L38 18L36.5 13.5L32 12L36.5 10.5L38 6Z" stroke="#0284C7" strokeWidth="2.4" strokeLinejoin="round" fill="#0284C7" fillOpacity="0.25" />
    </>
  ),
  'art-craft': (
    <>
      <path d="M22 12C13.2 12 7 18.5 7 26.5C7 34.5 13.5 41 21.5 41C25 41 27.5 39 27.5 36.2C27.5 34.2 26 32.8 26 31C26 29 27.8 27.5 30 27.5H32C35.5 27.5 37.5 24.5 37.5 21C37.5 15.5 30.5 12 22 12Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.1" />
      <path d="M9 17.5C8 13.5 13 9.5 19 9.5C23.5 9.5 26 11.5 25 14.5L9 17.5Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.22" />
      <path d="M16.5 9.5L16 7.5" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="13.5" cy="24" r="2" fill="#7C3AED" />
      <circle cx="15" cy="31.5" r="2" fill="#7C3AED" />
      <circle cx="29" cy="18.5" r="2" fill="#7C3AED" />
      <circle cx="20.5" cy="23" r="1.4" fill="#7C3AED" />
      <circle cx="25.5" cy="23" r="1.4" fill="#7C3AED" />
      <path d="M21.5 26.5C22.5 27.8 24.2 27.8 25 26.5" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 18L37 40" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 18C38 16 38.5 12.5 41.5 10.5C43 13 42.5 16.5 40 18Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.2" />
    </>
  ),
  'heal-meditation': (
    <>
      <path d="M24 6C22.5 8.5 22.5 11 24 12.5C25.5 11 25.5 8.5 24 6Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 12.5C21 12 19.5 10 19.5 8.5C21.5 8.5 23 10 24 12.5Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 12.5C27 12 28.5 10 28.5 8.5C26.5 8.5 25 10 24 12.5Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="24" cy="20" r="5.5" stroke="#059669" strokeWidth="2.4" fill="#059669" fillOpacity="0.1" />
      <path d="M21.2 19.5C21.8 20.2 22.6 20.2 23.2 19.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24.8 19.5C25.4 20.2 26.2 20.2 26.8 19.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22.8 22.2C23.5 22.9 24.5 22.9 25.2 22.2" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 26.5C15 28.5 12 32 10 33.5M30 26.5C33 28.5 36 32 38 33.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 37C14 34.5 18.5 33 24 33C29.5 33 34 34.5 34 37C34 39.2 29.5 40.5 24 40.5C18.5 40.5 14 39.2 14 37Z" stroke="#059669" strokeWidth="2.4" fill="#059669" fillOpacity="0.12" />
      <path d="M36 16.5C35 15 33 15.5 33 17.2C33 19 36 20.8 36 20.8C36 20.8 39 19 39 17.2C39 15.5 37 15 36 16.5Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#059669" fillOpacity="0.2" />
    </>
  ),
  'cook-bakery': (
    <>
      <path d="M19 19V15.5C17 15 16 13 17 11C18 9.2 20.5 9.5 21.5 10.5C22.5 8.5 25.5 8.5 26.5 10.5C27.5 9.5 30 9.2 31 11C32 13 31 15 29 15.5V19H19Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.14" />
      <path d="M14 24C14 20.5 18.5 19 24 19C29.5 19 34 20.5 34 24C38.5 25.5 41 30.5 39.5 35.5C38.5 38.5 35 39 33 36.5C30.5 34.5 27.5 34 24 34C20.5 34 17.5 34.5 15 36.5C13 39 9.5 38.5 8.5 35.5C7 30.5 9.5 25.5 14 24Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.1" />
      <path d="M15 23.5C14 27.5 15 31.5 16.5 34.5M33 23.5C34 27.5 33 31.5 31.5 34.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 25.5C20.6 24.5 21.8 24.5 22.4 25.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M25.6 25.5C26.2 24.5 27.4 24.5 28 25.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22.5 29C23.3 30.2 24.7 30.2 25.5 29" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'pet-lovers': (
    <>
      <path d="M11 23C8 23 6.5 26.5 8 30C9.5 29 11 27 11.5 25M27 23C30 23 31.5 26.5 30 30" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="27" r="8.5" stroke="#E11D48" strokeWidth="2.4" fill="#E11D48" fillOpacity="0.09" />
      <circle cx="16.2" cy="25.5" r="1.3" fill="#E11D48" />
      <circle cx="21.8" cy="25.5" r="1.3" fill="#E11D48" />
      <path d="M17 29C18 30.2 20 30.2 21 29" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18.2 30V32.2C18.2 33 19.8 33 19.8 32.2V30" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27 37V30L29.5 25.5L32.5 28.5H36.5L39.5 25.5L42 30V37" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF" />
      <circle cx="32" cy="32.5" r="1.2" fill="#E11D48" />
      <circle cx="37" cy="32.5" r="1.2" fill="#E11D48" />
      <path d="M33.5 35C34.2 35.8 35 35.8 35.7 35" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M35.5 14.5C34.5 13 32.5 13.5 32.5 15.2C32.5 17 35.5 19 35.5 19C35.5 19 38.5 17 38.5 15.2C38.5 13.5 36.5 13 35.5 14.5Z" fill="#E11D48" />
      <circle cx="31.5" cy="11.5" r="1.3" fill="#E11D48" />
      <circle cx="34.2" cy="10" r="1.3" fill="#E11D48" />
      <circle cx="37.2" cy="10" r="1.3" fill="#E11D48" />
      <circle cx="39.8" cy="11.5" r="1.3" fill="#E11D48" />
    </>
  ),
  'books-language': (
    <>
      <path d="M24 17C20 14.5 14 14 9 15.5V37.5C14 36 20 36.5 24 39C28 36.5 34 36 39 37.5V15.5C34 14 28 14.5 24 17Z" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.1" />
      <path d="M24 17V39" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17.5" cy="25.5" r="4.2" stroke="#0D9488" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="30.5" cy="25.5" r="4.2" stroke="#0D9488" strokeWidth="2.4" fill="#FFFFFF" />
      <path d="M21.7 25.5H26.3" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17.5" cy="25.5" r="1.3" fill="#0D9488" />
      <circle cx="30.5" cy="25.5" r="1.3" fill="#0D9488" />
      <path d="M21.5 32.5C22.8 34 25.2 34 26.5 32.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 7H21C22.7 7 24 8.3 24 10C24 11.7 22.7 13 21 13H16L13 15V13C11.3 13 10 11.7 10 10C10 8.3 11.3 7 13 7Z" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.18" />
    </>
  ),
  'career-tech': (
    <>
      <path d="M21 15C19.5 13.5 19.5 10.5 21.5 9C23 7.8 25 7.8 26.5 9C28.5 10.5 28.5 13.5 27 15L26.2 17.5H21.8L21 15Z" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" fill="#2563EB" fillOpacity="0.22" />
      <path d="M24 4.5V6M17 7.5L18.2 8.7M31 7.5L29.8 8.7" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="12" y="18" width="24" height="16" rx="2.5" stroke="#2563EB" strokeWidth="2.4" fill="#2563EB" fillOpacity="0.08" />
      <path d="M18.5 25C19.2 23.8 20.8 23.8 21.5 25" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26.5 25C27.2 23.8 28.8 23.8 29.5 25" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 29C23 30.5 25 30.5 26 29" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 24L7.5 27.5L9 32L12 31" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M36 24L40.5 27.5L39 32L36 31" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M8 34H40L42 39.5H6L8 34Z" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" fill="#2563EB" fillOpacity="0.14" />
    </>
  ),
  'foodie-eats': (
    <>
      <path d="M15 11L37 7M15 14.5L37 11.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19 13V23M23 12.5V23M27 12V23" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9 23H39C39 32.5 32.5 39 24 39C15.5 39 9 32.5 9 23Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.1" />
      <path d="M17 39H31V42H17V39Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M17.5 28.5C18.2 27.3 19.8 27.3 20.5 28.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27.5 28.5C28.2 27.3 29.8 27.3 30.5 28.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M21 32.5C22.2 34.5 25.8 34.5 27 32.5H21Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" />
    </>
  ),
  'bar-nightlife': (
    <>
      <path d="M8 17L22 20L13.5 29L8 17Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.14" />
      <path d="M13.5 29L11.5 39M8 38.5H15" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 17L26 20L34.5 29L40 17Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.14" />
      <path d="M34.5 29L36.5 39M33 38.5H40" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="10.5" y="16" width="4.5" height="3" rx="1" fill="#7C3AED" />
      <rect x="16" y="17" width="4.5" height="3" rx="1" fill="#7C3AED" />
      <rect x="27.5" y="17" width="4.5" height="3" rx="1" fill="#7C3AED" />
      <rect x="33" y="16" width="4.5" height="3" rx="1" fill="#7C3AED" />
      <circle cx="24" cy="11" r="1.5" fill="#7C3AED" />
      <circle cx="21" cy="7.5" r="1.2" fill="#7C3AED" />
      <path d="M27 7L28 9.5L30.5 10.5L28 11.5L27 14L26 11.5L23.5 10.5L26 9.5L27 7Z" fill="#7C3AED" />
    </>
  ),
  'game-anime': (
    <>
      <path d="M14 16H34C38.5 16 42 20 41 26L39.5 34.5C38.8 38 35 39.5 32.5 37L28.5 33H19.5L15.5 37C13 39.5 9.2 38 8.5 34.5L7 26C6 20 9.5 16 14 16Z" stroke="#0284C7" strokeWidth="2.4" strokeLinejoin="round" fill="#0284C7" fillOpacity="0.1" />
      <path d="M14 23V27M12 25H16" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="34.5" cy="23.5" r="1.4" fill="#0284C7" />
      <circle cx="32" cy="26.5" r="1.4" fill="#0284C7" />
      <path d="M21 15L22 17.5L24.5 18.5L22 19.5L21 22L20 19.5L17.5 18.5L20 17.5L21 15Z" fill="#0284C7" />
      <path d="M27 15L28 17.5L30.5 18.5L28 19.5L27 22L26 19.5L23.5 18.5L26 17.5L27 15Z" fill="#0284C7" />
      <path d="M22 24.5H26C26 26.8 25 28 24 28C23 28 22 26.8 22 24.5Z" stroke="#0284C7" strokeWidth="2.4" fill="#0284C7" fillOpacity="0.25" />
    </>
  ),
  'dance-move': (
    <>
      <path d="M24 5V9" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="20" r="11" stroke="#DB2777" strokeWidth="2.4" fill="#DB2777" fillOpacity="0.1" />
      <ellipse cx="24" cy="20" rx="5.5" ry="11" stroke="#DB2777" strokeWidth="2.4" />
      <path d="M13.5 16.5H34.5M13.5 23.5H34.5" stroke="#DB2777" strokeWidth="2.4" />
      <path d="M17 34L11 36.5C9.5 37.2 9 39 10 40.5L18.5 38L17 34Z" stroke="#DB2777" strokeWidth="2.4" strokeLinejoin="round" fill="#DB2777" fillOpacity="0.2" />
      <path d="M31 34L37 36.5C38.5 37.2 39 39 38 40.5L29.5 38L31 34Z" stroke="#DB2777" strokeWidth="2.4" strokeLinejoin="round" fill="#DB2777" fillOpacity="0.2" />
      <path d="M8 14V19M8 14L11 13V18" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M39 13V18M39 13L42 12V17" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'beauty-fashion': (
    <>
      <polygon points="15,12 17.2,16.5 22,17.2 18.5,20.6 19.3,25.4 15,23.1 10.7,25.4 11.5,20.6 8,17.2 12.8,16.5" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#E11D48" fillOpacity="0.14" />
      <polygon points="33,12 35.2,16.5 40,17.2 36.5,20.6 37.3,25.4 33,23.1 28.7,25.4 29.5,20.6 26,17.2 30.8,16.5" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#E11D48" fillOpacity="0.14" />
      <path d="M21.5 18H26.5" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="15" y="33" width="11" height="6" rx="1.5" transform="rotate(-12 15 33)" stroke="#E11D48" strokeWidth="2.4" fill="#E11D48" fillOpacity="0.18" />
      <path d="M25.5 31.5L32.5 30C33.5 31.5 33 34 31.5 35L26.5 36" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 7V11M22 9H26" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'volunteer-good': (
    <>
      <path d="M24 19V11" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 14C20 14 17.5 11.5 17.5 8.5C21 8.5 24 10.5 24 14Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#059669" fillOpacity="0.2" />
      <path d="M24 12.5C28 12.5 30.5 10 30.5 7C27 7 24 9 24 12.5Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#059669" fillOpacity="0.2" />
      <path d="M9 40L11 28C11.5 25.5 14 24 16.5 24.5L21 26L22 34L17 40" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#059669" fillOpacity="0.1" />
      <path d="M14.5 32.5C15.5 33.8 17.2 33.8 18 32.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M39 40L37 28C36.5 25.5 34 24 31.5 24.5L27 26L26 34L31 40" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#059669" fillOpacity="0.1" />
      <path d="M30 32.5C30.8 33.8 32.5 33.8 33.5 32.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38 16.5C37 15 35 15.5 35 17.2C35 19 38 20.8 38 20.8C38 20.8 41 19 41 17.2C41 15.5 39 15 38 16.5Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#059669" fillOpacity="0.2" />
    </>
  ),
  'mountain-fog': (
    <>
      <circle cx="24" cy="11" r="4.5" stroke="#0D9488" strokeWidth="2.4" fill="#0D9488" fillOpacity="0.16" />
      <path d="M24 4V5.2M18.5 6.5L19.5 7.5M29.5 6.5L28.5 7.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 32L18 14L27 30" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.1" />
      <path d="M22 30L30 16L40 32" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.1" />
      <circle cx="16" cy="24" r="1.2" fill="#0D9488" />
      <circle cx="20" cy="24" r="1.2" fill="#0D9488" />
      <path d="M16.8 26.8C17.5 27.6 18.5 27.6 19.2 26.8" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="29" cy="25" r="1.2" fill="#0D9488" />
      <circle cx="33" cy="25" r="1.2" fill="#0D9488" />
      <path d="M29.8 27.5C30.5 28.3 31.5 28.3 32.2 27.5" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 34C6 31.5 8.5 30 11 31C12.5 29 16 29 17.5 31C19.5 29.5 23 29.5 24.5 31.5C26.5 29.5 30 29.5 31.5 31.5C33.5 30 36.5 30 38 31.5C40 30.5 42 32 42 34.5C42 37.5 39 39 36 39H12C9 39 6 37 6 34Z" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
    </>
  ),
  'sea-island': (
    <>
      <path d="M24 27C23.5 21 24.5 15 26.5 11" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26.5 11C21 9 16 11 14 15C18 14 22 14 26.5 11Z" stroke="#0284C7" strokeWidth="2.4" strokeLinejoin="round" fill="#0284C7" fillOpacity="0.15" />
      <path d="M26.5 11C31 8.5 36.5 10.5 38 14.5C34 13.5 30 13.5 26.5 11Z" stroke="#0284C7" strokeWidth="2.4" strokeLinejoin="round" fill="#0284C7" fillOpacity="0.15" />
      <path d="M26.5 11C24 6.5 28 4.5 32 6.5" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="20.5" y="16" width="4.5" height="3.2" rx="1" fill="#0284C7" />
      <rect x="26" y="16" width="4.5" height="3.2" rx="1" fill="#0284C7" />
      <path d="M20 17.2H31" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 35C13.5 29.5 18 27 24 27C30 27 34.5 29.5 36 35" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" fill="#0284C7" fillOpacity="0.1" />
      <circle cx="21.5" cy="31.5" r="1.2" fill="#0284C7" />
      <circle cx="26.5" cy="31.5" r="1.2" fill="#0284C7" />
      <path d="M22.8 33.2C23.5 34 24.5 34 25.2 33.2" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 36C9 34 12 34 15 36C18 38 21 38 24 36C27 34 30 34 33 36C36 38 39 38 42 36" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9 40.5C12 39 15 39 18 40.5C21 42 24 42 27 40.5C30 39 33 39 36 40.5" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'forest-waterfall': (
    <>
      <path d="M9 10H22C20 15 20 24 20 32" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10C12.5 16 12.5 24 12.5 32" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16.5 14V20M16.5 24V29" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M35 9L41 19H37.5L42 28H29L33.5 19H30L35 9Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#059669" fillOpacity="0.14" />
      <path d="M21 38L29.5 23L38 38H21Z" stroke="#059669" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
      <circle cx="27.5" cy="32" r="1.2" fill="#059669" />
      <circle cx="31.5" cy="32" r="1.2" fill="#059669" />
      <path d="M28.3 34.5C29 35.3 30 35.3 30.7 34.5" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 35C8 33 10.5 32 12.5 33.5C14 32 17 32 18.5 34C20 35.5 19 38 16.5 38H10.5C8.5 38 8 36.5 8 35Z" stroke="#059669" strokeWidth="2.4" fill="#059669" fillOpacity="0.12" />
    </>
  ),
  'viewpoint-rooftop': (
    <>
      <path d="M14 7C11 8.5 10 12.5 12 15.5C14 18.5 18 19 20.5 17C17 17 14.5 14.5 14.5 11C14.5 9.5 15 8 14 7Z" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" fill="#7C3AED" fillOpacity="0.18" />
      <circle cx="35" cy="10" r="1.4" fill="#7C3AED" />
      <circle cx="28" cy="8" r="1.2" fill="#7C3AED" />
      <circle cx="19" cy="26" r="5.5" stroke="#7C3AED" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="29" cy="26" r="5.5" stroke="#7C3AED" strokeWidth="2.4" fill="#FFFFFF" />
      <path d="M16.5 21L19 16H22L23 21M31.5 21L29 16H26L25 21" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="19" cy="26" r="1.6" fill="#7C3AED" />
      <circle cx="29" cy="26" r="1.6" fill="#7C3AED" />
      <path d="M22.5 29.5C23.3 30.5 24.7 30.5 25.5 29.5" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 34H41M7 38H41M10 34V41M17 34V38M31 34V38M38 34V41" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'city-park': (
    <>
      <path d="M17 10C13.5 10 11 12.5 11 15.5C9 16.5 8 19 8.5 21.5C8 24.5 10.5 27 13.5 27H20.5C23.5 27 26 24.5 25.5 21.5C26 19 25 16.5 23 15.5C23 12.5 20.5 10 17 10Z" stroke="#16A34A" strokeWidth="2.4" strokeLinejoin="round" fill="#16A34A" fillOpacity="0.12" />
      <circle cx="14.8" cy="19" r="1.3" fill="#16A34A" />
      <circle cx="19.2" cy="19" r="1.3" fill="#16A34A" />
      <path d="M15.6 22C16.4 23 17.6 23 18.4 22" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M17 27V39M17 32L14 29.5" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="24" y="29" width="16" height="4.5" rx="1.2" stroke="#16A34A" strokeWidth="2.4" fill="#16A34A" fillOpacity="0.16" />
      <path d="M22.5 35.5H41.5M26 33.5V39M38 33.5V39" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 39H42" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'temple-mu': (
    <>
      <path d="M17 8L19 18H15L17 8Z" stroke="#D97706" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 28C12 22 14 18 17 18C20 18 22 22 22 28H12Z" stroke="#D97706" strokeWidth="2.4" strokeLinejoin="round" fill="#D97706" fillOpacity="0.12" />
      <rect x="9.5" y="28" width="15" height="4" rx="1" stroke="#D97706" strokeWidth="2.4" />
      <rect x="7.5" y="32" width="19" height="4.5" rx="1" stroke="#D97706" strokeWidth="2.4" fill="#D97706" fillOpacity="0.1" />
      <circle cx="15.2" cy="24" r="1.1" fill="#D97706" />
      <circle cx="18.8" cy="24" r="1.1" fill="#D97706" />
      <path d="M16 26C16.6 26.6 17.4 26.6 18 26" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="29" y="23" width="10" height="15" rx="2" transform="rotate(10 29 23)" stroke="#D97706" strokeWidth="2.4" fill="#D97706" fillOpacity="0.16" />
      <path d="M31 23L30 16M34.5 23.5L35 15.5M37.5 24L39.5 17.5" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="31.5" cy="30" r="1.1" fill="#D97706" />
      <circle cx="35" cy="30.6" r="1.1" fill="#D97706" />
      <path d="M32 32.8C32.7 33.5 33.7 33.6 34.4 33" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26 11V15M24 13H28" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'old-town': (
    <>
      <path d="M13 15L16 9H36L39 15H13Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.14" />
      <rect x="14" y="15" width="24" height="24" stroke="#EA580C" strokeWidth="2.4" fill="#EA580C" fillOpacity="0.06" />
      <rect x="17.5" y="18.5" width="4.5" height="6.5" rx="2.2" stroke="#EA580C" strokeWidth="2.4" fill="#FFFFFF" />
      <rect x="24" y="18.5" width="4.5" height="6.5" rx="2.2" stroke="#EA580C" strokeWidth="2.4" fill="#FFFFFF" />
      <rect x="30.5" y="18.5" width="4.5" height="6.5" rx="2.2" stroke="#EA580C" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="23.5" cy="28.5" r="1.2" fill="#EA580C" />
      <circle cx="28.5" cy="28.5" r="1.2" fill="#EA580C" />
      <path d="M24.5 30.8C25.3 31.6 26.7 31.6 27.5 30.8" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 39V34C23 32.8 24.2 32 26 32C27.8 32 29 32.8 29 34V39" stroke="#EA580C" strokeWidth="2.4" />
      <path d="M14 20H9V23" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="9" cy="26" r="3" stroke="#EA580C" strokeWidth="2.4" fill="#EA580C" fillOpacity="0.22" />
      <path d="M9 29V31.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'museum': (
    <>
      <polygon points="8,19 24,10 40,19" stroke="#475569" strokeWidth="2.4" strokeLinejoin="round" fill="#475569" fillOpacity="0.12" />
      <rect x="9" y="19" width="30" height="3.5" stroke="#475569" strokeWidth="2.4" />
      <path d="M13 22.5V35M19 22.5V35M29 22.5V35M35 22.5V35" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="8" y="35" width="32" height="4" rx="1" stroke="#475569" strokeWidth="2.4" fill="#475569" fillOpacity="0.1" />
      <circle cx="21.5" cy="15.5" r="1.2" fill="#475569" />
      <circle cx="26.5" cy="15.5" r="1.2" fill="#475569" />
      <path d="M22.5 17.3C23.3 18 24.7 18 25.5 17.3" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="14.5" cy="28" r="3.2" stroke="#475569" strokeWidth="2.4" fill="#FFFFFF" />
      <path d="M11.5 29.5C10.5 31 10.5 33 11.5 34.5" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="33,8 35,11 38,9 37,13 31,13" stroke="#475569" strokeWidth="2.4" strokeLinejoin="round" fill="#475569" fillOpacity="0.2" />
    </>
  ),
  'walking-street': (
    <>
      <path d="M9 17L24 9L39 17H9Z" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#E11D48" fillOpacity="0.14" />
      <path d="M9 17C9 19.5 11.5 21 14 21C16.5 21 19 19.5 19 17C19 19.5 21.5 21 24 21C26.5 21 29 19.5 29 17C29 19.5 31.5 21 34 21C36.5 21 39 19.5 39 17" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M11 20V39M37 20V39M9 39H39" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16.5" cy="31" r="3.8" stroke="#E11D48" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="24" cy="31" r="3.8" stroke="#E11D48" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="31.5" cy="31" r="3.8" stroke="#E11D48" strokeWidth="2.4" fill="#FFFFFF" />
      <path d="M8 31H12.7M35.3 31H40" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.8" cy="30.3" r="1" fill="#E11D48" />
      <circle cx="25.2" cy="30.3" r="1" fill="#E11D48" />
      <path d="M23 32.2C23.5 32.8 24.5 32.8 25 32.2" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 24V25.5M26 24V25.5" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'theme-park': (
    <>
      <circle cx="23" cy="22" r="11.5" stroke="#DB2777" strokeWidth="2.4" />
      <circle cx="23" cy="22" r="4.5" stroke="#DB2777" strokeWidth="2.4" fill="#DB2777" fillOpacity="0.12" />
      <circle cx="21.5" cy="21.2" r="1.1" fill="#DB2777" />
      <circle cx="24.5" cy="21.2" r="1.1" fill="#DB2777" />
      <path d="M21.8 23.2C22.4 24 23.6 24 24.2 23.2" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18.5 25.5L13 39M27.5 25.5L33 39M10 39H36" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="23" cy="10.5" r="2.2" stroke="#DB2777" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="34.5" cy="22" r="2.2" stroke="#DB2777" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="11.5" cy="22" r="2.2" stroke="#DB2777" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="39" cy="12" r="3" stroke="#DB2777" strokeWidth="2.4" fill="#DB2777" fillOpacity="0.2" />
      <path d="M39 15C39 17.5 37.5 19 37.5 20.5" stroke="#DB2777" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'shopping-mall': (
    <>
      <path d="M8 18H26L27.5 39H6.5L8 18Z" stroke="#9333EA" strokeWidth="2.4" strokeLinejoin="round" fill="#9333EA" fillOpacity="0.08" />
      <path d="M13 18V14C13 11.5 14.8 10 17 10C19.2 10 21 11.5 21 14V18" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="14" cy="26" r="1.4" fill="#9333EA" />
      <circle cx="20" cy="26" r="1.4" fill="#9333EA" />
      <path d="M15 30C16 31.3 18 31.3 19 30" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 23H39L40.5 39H22.5L24 23Z" stroke="#9333EA" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
      <path d="M28 23V20C28 18 29.5 16.5 31.5 16.5C33.5 16.5 35 18 35 20V23" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="29" cy="30" r="1.3" fill="#9333EA" />
      <circle cx="34" cy="30" r="1.3" fill="#9333EA" />
      <path d="M30 33.2C30.8 34.2 32.2 34.2 33 33.2" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 9V13M34 11H38" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'music-festival': (
    <>
      <rect x="11" y="12" width="22" height="28" rx="4" stroke="#9333EA" strokeWidth="2.4" fill="#9333EA" fillOpacity="0.1" />
      <circle cx="22" cy="19" r="3.2" stroke="#9333EA" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="22" cy="31" r="6" stroke="#9333EA" strokeWidth="2.4" fill="#FFFFFF" />
      <rect x="16.5" y="28.5" width="4.5" height="3.2" rx="1" fill="#9333EA" />
      <rect x="23" y="28.5" width="4.5" height="3.2" rx="1" fill="#9333EA" />
      <path d="M16 29.8H28" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20.5 34C21.3 34.8 22.7 34.8 23.5 34" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 14V21M37 14L42 12.5V19.5" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35.5" cy="21" r="1.6" fill="#9333EA" />
      <circle cx="40.5" cy="19.5" r="1.6" fill="#9333EA" />
      <path d="M7 18L9 20M6 26H9" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'craft-market': (
    <>
      <path d="M10 19H38L35.5 39H12.5L10 19Z" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#EA580C" fillOpacity="0.1" />
      <path d="M17 19V14C17 11 19.5 9 24 9C28.5 9 31 11 31 14V19" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="27" r="1.4" fill="#EA580C" />
      <circle cx="28" cy="27" r="1.4" fill="#EA580C" />
      <path d="M22 30.5C23 31.8 25 31.8 26 30.5" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 35H35" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M34 19L39 24L35 28L30 23" stroke="#EA580C" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
      <circle cx="35" cy="24" r="1.2" fill="#EA580C" />
    </>
  ),
  'stage-theater': (
    <>
      <path d="M8 13C8 10.5 13 9 18 9C23 9 28 10.5 28 13V23C28 29 23 33 18 33C13 33 8 29 8 23V13Z" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#E11D48" fillOpacity="0.1" />
      <path d="M13 18C13.8 17 15.2 17 16 18M20 18C20.8 17 22.2 17 23 18" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14.5 24C16 26.5 20 26.5 21.5 24H14.5Z" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#E11D48" />
      <path d="M22 19C22 16.5 26.5 15 31 15C35.5 15 40 16.5 40 19V28C40 33.5 35.5 37 31 37C26.5 37 22 33.5 22 28V19Z" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
      <circle cx="27.5" cy="24" r="1.3" fill="#E11D48" />
      <path d="M32.5 23L35 24.2L32.5 25.5" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28.5 30C29.8 31.2 32.2 31.2 33.5 30" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 8V12M35 10H39" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'tradition-fest': (
    <>
      <path d="M14 14C14 10 18.5 8 24 8C29.5 8 34 10 34 14L31 32H17L14 14Z" stroke="#D97706" strokeWidth="2.4" strokeLinejoin="round" fill="#D97706" fillOpacity="0.12" />
      <ellipse cx="24" cy="32" rx="7" ry="2.2" stroke="#D97706" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="21" cy="19.5" r="1.3" fill="#D97706" />
      <circle cx="27" cy="19.5" r="1.3" fill="#D97706" />
      <path d="M22 23C23 24.2 25 24.2 26 23" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 34.5C24 34.5 26 36.5 25 38.5C24 40 22.5 39 23 37.5" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 10L11 12M40 10L37 12M9 24L11.5 24M39 24L36.5 24" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'home-lifestyle': (
    <>
      <path d="M12 24V19C12 16.2 14.2 14 17 14H27C29.8 14 32 16.2 32 19V24" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.1" />
      <path d="M8 25C8 23.3 9.3 22 11 22C12.7 22 14 23.3 14 25V29H30V25C30 23.3 31.3 22 33 22C34.7 22 36 23.3 36 25V33C36 34.7 34.7 36 33 36H11C9.3 36 8 34.7 8 33V25Z" stroke="#0D9488" strokeWidth="2.4" strokeLinejoin="round" fill="#FFFFFF" />
      <path d="M12 36V39M32 36V39" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="19.5" cy="20" r="1.3" fill="#0D9488" />
      <circle cx="24.5" cy="20" r="1.3" fill="#0D9488" />
      <path d="M20.5 23C21.3 24 22.7 24 23.5 23" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M39 39V15M35 15H43L41.5 10H36.5L35 15Z" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#0D9488" fillOpacity="0.18" />
    </>
  ),
  'fair-expo': (
    <>
      <path d="M8 26C8 17.2 14.5 11 22 11C29.5 11 36 17.2 36 26H8Z" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" fill="#2563EB" fillOpacity="0.12" />
      <path d="M22 11V6M22 6L27 8L22 10" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="26" width="28" height="13" rx="1.5" stroke="#2563EB" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="18" cy="20" r="1.3" fill="#2563EB" />
      <circle cx="26" cy="20" r="1.3" fill="#2563EB" />
      <path d="M20 22.8C21 23.8 23 23.8 24 22.8" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 39V32C18 30.3 19.8 29 22 29C24.2 29 26 30.3 26 32V39" stroke="#2563EB" strokeWidth="2.4" fill="#2563EB" fillOpacity="0.15" />
      <rect x="33" y="25" width="9" height="12" rx="1.5" stroke="#2563EB" strokeWidth="2.4" fill="#FFFFFF" />
      <circle cx="37.5" cy="29.5" r="1.5" fill="#2563EB" />
      <path d="M35.5 34H39.5" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
};

/** ตี้ categories (data/masterHub.ts MASTER_COMMUNITY_LIFESTYLE_CATEGORIES), "all" for ทั้งหมด */
const MEETUP: Record<string, string> = {
  all: 'all', cafe_social: 'cafe-chill', movies_music: 'movie-music', running_fitness: 'run-fitness', boardgames_party: 'board-games',
  travel_outdoor: 'travel-outdoor', sports_club: 'racket-sports', photo_content: 'photo-content', arts_crafts: 'art-craft',
  wellness_mind: 'heal-meditation', cooking_baking: 'cook-bakery', pets_family: 'pet-lovers', books_language: 'books-language',
  tech_skills: 'career-tech', food_hunt: 'foodie-eats', bars_nightlife: 'bar-nightlife', gaming_anime: 'game-anime',
  dance_move: 'dance-move', beauty_selfcare: 'beauty-fashion', volunteer: 'volunteer-good',
};

/** Place categories (MASTER_SPOT_CATEGORIES); five share a ตี้ drawing */
const SPOT: Record<string, string> = {
  all: 'all', mountain_mist: 'mountain-fog', sea_island: 'sea-island', nature_camping: 'forest-waterfall', views_rooftop: 'viewpoint-rooftop',
  city_parks: 'city-park', temple_mu: 'temple-mu', oldtown_culture: 'old-town', museum_learning: 'museum', art_creative: 'art-craft',
  cafe_slowbar: 'cafe-chill', food_street: 'foodie-eats', market_walking: 'walking-street', nightlife_bars: 'bar-nightlife',
  fun_activities: 'theme-park', shopping_mall: 'shopping-mall', wellness_retreat: 'heal-meditation',
};

/** อีเวนต์ categories (MASTER_FAIR_CATEGORIES); eleven share a ตี้ drawing */
const FAIR: Record<string, string> = {
  all: 'all', parks_openair: 'movie-music', music_festivals: 'music-festival', marathon_sports: 'run-fitness', sports_esports: 'racket-sports',
  food_drinks: 'foodie-eats', craft_market: 'craft-market', pop_culture: 'game-anime', art_festivals: 'art-craft', wellness: 'heal-meditation',
  performing_arts: 'stage-theater', books_learning: 'books-language', heritage_local: 'tradition-fest', travel_outdoor: 'travel-outdoor',
  home_lifestyle: 'home-lifestyle', pets: 'pet-lovers', tech_motor: 'career-tech', convention_centers: 'fair-expo',
};

// The compass fills its whole square, the others leave a margin: drawn a little smaller so a row looks even (owner 2026-10-28)
const VIEW_BOX: Record<string, string> = { all: '-4 -4 56 56' };

export type CategoryIconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

const cache = new Map<string, CategoryIconComponent>();

function iconFor(slug: string | undefined): CategoryIconComponent | undefined {
  if (!slug || !DRAWINGS[slug]) return undefined;
  let Icon = cache.get(slug);
  if (!Icon) {
    // A caller's strokeWidth is ignored: every drawing keeps the pack's weight
    Icon = function CategoryIcon({ className, ...rest }) {
      return (
        <svg viewBox={VIEW_BOX[slug] ?? '0 0 48 48'} fill="none" className={className} aria-hidden={rest['aria-hidden'] ?? true} focusable="false">
          {DRAWINGS[slug]}
        </svg>
      );
    };
    cache.set(slug, Icon);
  }
  return Icon;
}

/** The drawn icon for a ตี้ category id ("all" for ทั้งหมด), or undefined when the pack has none */
export const meetupCategoryIcon = (id: string) => iconFor(MEETUP[id]);

/** The drawn icon for a place category id ("all" for ทั้งหมด), or undefined when the pack has none */
export const spotCategoryIcon = (id: string) => iconFor(SPOT[id]);

/** The drawn icon for an อีเวนต์ category id ("all" for ทั้งหมด), or undefined when the pack has none */
export const fairCategoryIcon = (id: string) => iconFor(FAIR[id]);
