'use client';

import React, { useState } from 'react';

/**
 * Every post shows its photos in the same square frame, whatever the photos' own shape or number,
 * so the feed keeps one rhythm. Photos fill the frame; the viewer shows them whole.
 */
export const PHOTO_FRAME_RATIO = 1;
/** How many photos the feed shows before "+N" */
export const MAX_TILES = 5;

interface MomentPhotosProps {
  images: string[];
  /** Width / height of the first photo, saved when the moment was posted. Measured in the browser when missing. */
  ratio?: number;
  alt: string;
  /** Opens the photo viewer at this photo */
  onOpen: (index: number) => void;
}

/** Uploads are served through the image optimizer in three widths; other sources are used as they are */
const FRAME_WIDTHS = [640, 828, 1200];
const COLUMN_WIDTH = 680;
const sized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
const responsive = (src: string, share: number) =>
  src.startsWith('/uploads/')
    ? { src: sized(src, 828), srcSet: FRAME_WIDTHS.map((w) => `${sized(src, w)} ${w}w`).join(', '), sizes: `(min-width: 680px) ${Math.round(COLUMN_WIDTH * share)}px, ${Math.round(100 * share)}vw` }
    : { src };

interface Layout {
  /** Width / height of the whole block */
  frame: number;
  /** CSS grid of the block */
  columns: string;
  rows: string;
  /** Grid area of each tile (row / column / row-end / column-end) and the share of the width it takes */
  tiles: { area: string; share: number }[];
}

/**
 * The photo grid the large social feeds use: the number of photos and the shape of the first one decide the layout.
 *  1          the photo, filling the frame
 *  2          side by side; stacked when the first photo is landscape
 *  3          one large photo and two small ones (large on top for landscape, on the left for portrait)
 *  4          one large photo and three small ones; 2 x 2 when the first photo is square
 *  5 or more  two photos above three, with "+N" on the last tile
 */
function layoutFor(count: number, first: number): Layout {
  const shape = first > 1.15 ? 'landscape' : first < 0.87 ? 'portrait' : 'square';
  if (count === 1) return { frame: PHOTO_FRAME_RATIO, columns: '1fr', rows: '1fr', tiles: [{ area: '1 / 1', share: 1 }] };
  if (count === 2) {
    return shape === 'landscape'
      ? { frame: PHOTO_FRAME_RATIO, columns: '1fr', rows: '1fr 1fr', tiles: [{ area: '1 / 1', share: 1 }, { area: '2 / 1', share: 1 }] }
      : { frame: PHOTO_FRAME_RATIO, columns: '1fr 1fr', rows: '1fr', tiles: [{ area: '1 / 1', share: 0.5 }, { area: '1 / 2', share: 0.5 }] };
  }
  if (count === 3) {
    return shape === 'portrait'
      ? { frame: PHOTO_FRAME_RATIO, columns: '2fr 1fr', rows: '1fr 1fr', tiles: [{ area: '1 / 1 / 3 / 2', share: 0.67 }, { area: '1 / 2', share: 0.33 }, { area: '2 / 2', share: 0.33 }] }
      : { frame: PHOTO_FRAME_RATIO, columns: '1fr 1fr', rows: '2fr 1fr', tiles: [{ area: '1 / 1 / 2 / 3', share: 1 }, { area: '2 / 1', share: 0.5 }, { area: '2 / 2', share: 0.5 }] };
  }
  if (count === 4) {
    if (shape === 'portrait') {
      return { frame: PHOTO_FRAME_RATIO, columns: '2fr 1fr', rows: '1fr 1fr 1fr', tiles: [{ area: '1 / 1 / 4 / 2', share: 0.67 }, { area: '1 / 2', share: 0.33 }, { area: '2 / 2', share: 0.33 }, { area: '3 / 2', share: 0.33 }] };
    }
    if (shape === 'landscape') {
      return { frame: PHOTO_FRAME_RATIO, columns: '1fr 1fr 1fr', rows: '2fr 1fr', tiles: [{ area: '1 / 1 / 2 / 4', share: 1 }, { area: '2 / 1', share: 0.33 }, { area: '2 / 2', share: 0.33 }, { area: '2 / 3', share: 0.33 }] };
    }
    return { frame: PHOTO_FRAME_RATIO, columns: '1fr 1fr', rows: '1fr 1fr', tiles: [{ area: '1 / 1', share: 0.5 }, { area: '1 / 2', share: 0.5 }, { area: '2 / 1', share: 0.5 }, { area: '2 / 2', share: 0.5 }] };
  }
  // Two of half the width above three of a third of the width
  return {
    frame: PHOTO_FRAME_RATIO,
    columns: 'repeat(6, 1fr)',
    rows: '3fr 2fr',
    tiles: [
      { area: '1 / 1 / 2 / 4', share: 0.5 },
      { area: '1 / 4 / 2 / 7', share: 0.5 },
      { area: '2 / 1 / 3 / 3', share: 0.33 },
      { area: '2 / 3 / 3 / 5', share: 0.33 },
      { area: '2 / 5 / 3 / 7', share: 0.33 },
    ],
  };
}

/** Photos of one moment in the feed. Every photo fills its tile; a tap opens the viewer at that photo. */
export function MomentPhotos({ images, ratio, alt, onOpen }: MomentPhotosProps) {
  const [measured, setMeasured] = useState<number | null>(null);
  const count = images.length;
  const layout = layoutFor(count, ratio || measured || 1);
  const hidden = count - MAX_TILES;

  return (
    <div
      className="grid w-full gap-0.5 bg-white select-none"
      style={{ aspectRatio: String(layout.frame), gridTemplateColumns: layout.columns, gridTemplateRows: layout.rows }}
    >
      {layout.tiles.map((tile, i) => (
        <button
          key={`${images[i]}-${i}`}
          type="button"
          onClick={() => onOpen(i)}
          style={{ gridArea: tile.area }}
          className="relative min-h-0 min-w-0 overflow-hidden bg-slate-200 cursor-pointer group/tile focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
          aria-label={count > 1 ? (i === MAX_TILES - 1 && hidden > 0 ? `ดูรูปทั้งหมด ${count} รูป` : `ดูรูปที่ ${i + 1} จาก ${count}`) : 'ดูรูปเต็ม'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- member uploads and remote sample images */}
          <img
            {...responsive(images[i], tile.share)}
            alt={i === 0 ? alt : ''}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={i === 0 && !ratio ? (e) => e.currentTarget.naturalHeight > 0 && setMeasured(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) : undefined}
            className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover/tile:opacity-95"
          />
          {i === MAX_TILES - 1 && hidden > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-2xl sm:text-3xl font-bold" aria-hidden="true">
              +{hidden}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
