'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { clipClock } from '@/lib/media/clip';
import { MAX_VIDEO_SECONDS } from '@/lib/moments/types';

/**
 * Second step of posting a clip: watch it and, when it runs longer than the limit, choose which part plays.
 * The whole file still uploads; the post plays only this part (the file cannot be cut on a phone without a heavy tool).
 */

interface ClipTrimmerProps {
  file: File;
  fullSeconds: number;
  startS: number;
  onStartChange: (startS: number) => void;
  /** The cover is being drawn; it can take a moment on a large file */
  isBusy: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function ClipTrimmer({ file, fullSeconds, startS, onStartChange, isBusy, onBack, onNext }: ClipTrimmerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState('');
  // Some clips cannot be shown on this device (HEVC on a computer); they still post, and play where they can
  const [canPreview, setCanPreview] = useState(true);
  const isLong = fullSeconds > MAX_VIDEO_SECONDS;
  const endS = Math.min(fullSeconds, startS + MAX_VIDEO_SECONDS);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Moving the slider shows that moment straight away, and the preview then loops the chosen part
  useEffect(() => {
    const el = video.current;
    if (el && Math.abs(el.currentTime - startS) > 0.3) el.currentTime = startS;
  }, [startS]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100 shrink-0">
        <button type="button" onClick={onBack} aria-label="ย้อนกลับ" className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 id="create-moment-title" className="font-bold text-base text-slate-900">{isLong ? `เลือกช่วง ${MAX_VIDEO_SECONDS} วินาที` : 'ดูคลิป'}</h3>
        <button type="button" onClick={onNext} disabled={isBusy} className="h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap">
          {isBusy ? 'กำลังเตรียม…' : 'ถัดไป'}
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-black flex items-center justify-center">
        {!canPreview && (
          <p className="px-6 text-center text-sm font-medium leading-relaxed text-white/85">เครื่องนี้แสดงตัวอย่างคลิปนี้ไม่ได้ แต่โพสต์ได้ตามปกติ<br />ถ้าคลิปไม่เล่นบนบางเครื่อง ลองตั้งกล้องเป็น H.264 (Most Compatible) นะ</p>
        )}
        {src && canPreview && (
          <video
            ref={video}
            // A blob: link from the browser, which encodeURI leaves as it is; CodeQL needs it for text that started in a file input
            src={encodeURI(src)}
            muted
            autoPlay
            loop
            playsInline
            controls={!isLong}
            onLoadedMetadata={(e) => {
              if (startS > 0) e.currentTarget.currentTime = startS;
            }}
            onTimeUpdate={(e) => {
              if (isLong && (e.currentTarget.currentTime >= endS || e.currentTarget.currentTime < startS - 0.3)) e.currentTarget.currentTime = startS;
            }}
            onError={() => setCanPreview(false)}
            aria-label="ตัวอย่างคลิป"
            className="max-w-full max-h-full"
          />
        )}
      </div>

      <div className="shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1">
        {isLong ? (
          <>
            <label htmlFor="clip-start" className="flex items-center justify-between text-sm font-bold text-slate-900">
              ช่วงที่จะโพสต์
              <span className="text-xs font-semibold text-slate-600 tabular-nums">
                {clipClock(startS)} – {clipClock(endS)} จาก {clipClock(fullSeconds)}
              </span>
            </label>
            <input
              id="clip-start"
              type="range"
              min={0}
              max={Math.max(0, fullSeconds - MAX_VIDEO_SECONDS)}
              step={0.5}
              value={startS}
              onChange={(e) => onStartChange(Number(e.target.value))}
              className="w-full h-8 accent-[#2563EB] cursor-pointer"
            />
            <p className="text-xs text-slate-500">เลื่อนเพื่อเลือกช่วงที่อยากให้เพื่อนๆ ดู</p>
          </>
        ) : (
          <p className="text-sm font-medium text-slate-600">คลิปยาว {Math.round(fullSeconds)} วินาที พร้อมโพสต์แล้ว</p>
        )}
      </div>
    </div>
  );
}
