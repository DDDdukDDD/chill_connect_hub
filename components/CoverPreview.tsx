'use client';

import { useEffect, useState } from 'react';
import { PosterPhoto } from './PosterPhoto';

/* The cover picture shown as the real card it becomes, before anything is posted, with the best size beside it.
   Any shape works: a tall poster shows whole over a blurred copy of itself and a photo fills the square, the same
   rules as the live tiles (PosterPhoto). */

type CoverType = 'community' | 'fair' | 'spot' | 'challenge';

const TYPE_NAME: Record<CoverType, string> = { community: 'ตี้', fair: 'อีเวนต์', spot: 'สถานที่', challenge: 'ชาเลนจ์' };
// Place tiles always fill the square; the others show a tall poster whole
const POSTER_FROM: Record<CoverType, number> = { community: 1.1, fair: 1.1, spot: Infinity, challenge: 1.1 };

export function CoverPreview({ type, image, title, busy }: { type: CoverType; image: string; title: string; busy?: boolean }) {
  const [shape, setShape] = useState<{ src: string; ratio: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => img.naturalWidth > 0 && setShape({ src: image, ratio: img.naturalHeight / img.naturalWidth });
    img.src = image;
  }, [image]);
  const ratio = shape?.src === image ? shape.ratio : null;
  const whole = ratio !== null && ratio >= POSTER_FROM[type];

  return (
    <div className="flex gap-4 items-start">
      <div className="w-32 sm:w-36 shrink-0" aria-label="ตัวอย่างการ์ดเมื่อเผยแพร่แล้ว">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-md">
          <PosterPhoto src={image} posterFrom={POSTER_FROM[type]} alt="" />
          {busy && <span className="absolute inset-0 bg-white/70" />}
        </div>
        <p className="mt-2 text-sm font-bold text-slate-900 leading-snug line-clamp-2 break-words">{title.trim() || 'ชื่อที่คุณตั้ง'}</p>
        <p className="text-xs font-medium text-slate-500">{TYPE_NAME[type]}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <p className="text-xs font-bold text-slate-500">หน้าตาการ์ดเมื่อเผยแพร่</p>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          {type === 'spot'
            ? 'รูปถ่ายแนวนอนหรือสี่เหลี่ยมเหมาะที่สุด'
            : 'รูปถ่ายหรือโปสเตอร์ ถ้าทำโปสเตอร์แนะนำขนาด 1080 × 1350'}
        </p>
        {ratio !== null && !busy && (
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            {whole ? 'รูปนี้จะแสดงเต็มใบ ไม่โดนตัด' : 'รูปจะเต็มกรอบ ขอบอาจโดนตัดนิดหน่อย มีตัวหนังสือให้วางไว้กลางรูป'}
          </p>
        )}
      </div>
    </div>
  );
}
