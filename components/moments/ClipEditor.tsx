'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, RefreshCw, Scissors, Type, Volume2, VolumeX } from 'lucide-react';
import { clipClock } from '@/lib/media/clip';
import { drawText, loadEditorFont, textBox, type PhotoText } from '@/lib/media/photoEdit';
import { MAX_VIDEO_SECONDS, MIN_CLIP_SECONDS } from '@/lib/moments/types';
import { Segmented, TextTools, newText } from './EditorControls';

/**
 * Second step of posting a clip, the way TikTok and Reels do it (owner 2026-11-07): choose the part that plays, the
 * frame every grid shows as the cover, text on the clip, and whether the clip keeps its sound. Text and "no sound"
 * are made while this phone shrinks the clip (lib/media/clipCompress.ts), so those two show only where the device can
 * do that. The preview loops the chosen part.
 */

type Tool = 'trim' | 'cover' | 'text' | 'sound';
const OVERLAY_WIDTH = 720;

interface ClipEditorProps {
  file: File;
  fullSeconds: number;
  /** The chosen part: at most MAX_VIDEO_SECONDS, at least MIN_CLIP_SECONDS */
  startS: number;
  endS: number;
  onRangeChange: (startS: number, endS: number) => void;
  /** The cover's moment, inside the chosen part */
  coverAtS: number;
  onCoverChange: (seconds: number) => void;
  texts: PhotoText[];
  onTextsChange: (texts: PhotoText[]) => void;
  /** Post the clip without its sound */
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  /** This device can shrink clips, which text and "no sound" need */
  canEdit: boolean;
  /** The cover is being drawn; it can take a moment on a large file */
  isBusy: boolean;
  onBack: () => void;
  /** Drops this clip and goes back to choosing a photo or clip */
  onReplace: () => void;
  onNext: () => void;
}

export function ClipEditor({ file, fullSeconds, startS, endS, onRangeChange, coverAtS, onCoverChange, texts, onTextsChange, muted, onMutedChange, canEdit, isBusy, onBack, onReplace, onNext }: ClipEditorProps) {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: string; lastX: number; lastY: number } | null>(null);
  const [src, setSrc] = useState('');
  // Some clips cannot be shown on this device (HEVC on a computer); they still post, and play where they can
  const [canPreview, setCanPreview] = useState(true);
  const [ratio, setRatio] = useState(9 / 16);
  const [tool, setTool] = useState<Tool>('trim');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [fontReady, setFontReady] = useState(0);
  // Any clip a little longer than the shortest part can be trimmed, not only one over the limit
  const canTrim = fullSeconds > MIN_CLIP_SECONDS + 0.5;
  // Moving one end pushes the other when the part would pass the limit or get too short, so the part also slides
  const moveStart = (value: number) => {
    const start = Math.max(0, Math.min(value, fullSeconds - MIN_CLIP_SECONDS));
    onRangeChange(start, Math.min(fullSeconds, Math.max(start + MIN_CLIP_SECONDS, Math.min(endS, start + MAX_VIDEO_SECONDS))));
  };
  const moveEnd = (value: number) => {
    const end = Math.min(fullSeconds, Math.max(value, MIN_CLIP_SECONDS));
    onRangeChange(Math.max(0, Math.min(end - MIN_CLIP_SECONDS, Math.max(startS, end - MAX_VIDEO_SECONDS))), end);
  };
  const pct = (s: number) => `${(s / Math.max(fullSeconds, 0.001)) * 100}%`;
  // Two range inputs on one track: only their thumbs take the pointer, so either end can be grabbed
  const thumb =
    'pointer-events-none absolute inset-0 w-full h-8 appearance-none bg-transparent cursor-pointer ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-md [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white';
  const textOn = texts.find((t) => t.id === selectedText) ?? null;
  const overlayHeight = Math.round(OVERLAY_WIDTH / ratio);
  const tools: { id: Tool; label: string; Icon: typeof Scissors }[] = [
    { id: 'trim', label: 'ช่วงคลิป', Icon: Scissors },
    { id: 'cover', label: 'ปก', Icon: ImageIcon },
    ...(canEdit && canPreview ? [{ id: 'text' as const, label: 'ข้อความ', Icon: Type }] : []),
    ...(canEdit ? [{ id: 'sound' as const, label: 'เสียง', Icon: muted ? VolumeX : Volume2 }] : []),
  ];

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    loadEditorFont()?.then(() => setFontReady((n) => n + 1));
  }, []);

  // The cover stays inside the part that plays
  useEffect(() => {
    if (coverAtS < startS || coverAtS > endS) onCoverChange(startS);
  }, [startS, endS, coverAtS, onCoverChange]);

  // Choosing the cover holds the picture still on that frame; every other tool loops the chosen part
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (tool === 'cover') {
      el.pause();
      el.currentTime = coverAtS;
    } else {
      if (el.currentTime < startS - 0.3 || el.currentTime > endS) el.currentTime = startS;
      void el.play().catch(() => undefined);
    }
  }, [tool, coverAtS, startS, endS]);

  // Text on the clip, drawn over the picture exactly where it will be baked in
  useEffect(() => {
    const ctx = overlay.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, OVERLAY_WIDTH, overlayHeight);
    texts.forEach((t) => drawText(ctx, t, OVERLAY_WIDTH, overlayHeight));
  }, [texts, overlayHeight, fontReady]);

  /* ---------- text ---------- */

  const editText = (change: Partial<PhotoText>) => onTextsChange(texts.map((t) => (t.id === selectedText ? { ...t, ...change } : t)));
  const removeText = () => {
    onTextsChange(texts.filter((t) => t.id !== selectedText));
    setSelectedText(null);
  };
  const typeText = (value: string) => {
    if (textOn) return value ? editText({ text: value }) : removeText();
    if (!value) return;
    const text = newText(texts, value);
    setSelectedText(text.id);
    onTextsChange([...texts, text]);
  };

  const positionOf = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = overlay.current?.getContext('2d');
    if (!ctx) return;
    const at = positionOf(e);
    const hit = [...texts].reverse().find((t) => {
      const { boxW, boxH } = textBox(ctx, t, OVERLAY_WIDTH);
      return Math.abs((at.x - t.x) * OVERLAY_WIDTH) <= boxW / 2 && Math.abs((at.y - t.y) * overlayHeight) <= boxH / 2;
    });
    if (!hit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedText(hit.id);
    setTool('text');
    drag.current = { id: hit.id, lastX: at.x, lastY: at.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const move = drag.current;
    if (!move) return;
    const at = positionOf(e);
    const keep = (v: number) => Math.max(0.03, Math.min(0.97, v));
    onTextsChange(texts.map((t) => (t.id === move.id ? { ...t, x: keep(t.x + at.x - move.lastX), y: keep(t.y + at.y - move.lastY) } : t)));
    move.lastX = at.x;
    move.lastY = at.y;
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  /* ---------- panels ---------- */

  const panel = (
    <>
      {tool === 'trim' &&
        (canTrim ? (
          <div className="space-y-1">
            <p className="flex items-center justify-between text-sm font-bold text-slate-900">
              ช่วงที่จะโพสต์
              <span className="text-xs font-semibold text-slate-600 tabular-nums">
                {clipClock(startS)} – {clipClock(endS)} · {Math.round((endS - startS) * 10) / 10} วิ
              </span>
            </p>
            <div className="relative h-8">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-200" aria-hidden="true" />
              <div className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-[#93C5FD]" style={{ left: pct(startS), width: `calc(${pct(endS)} - ${pct(startS)})` }} aria-hidden="true" />
              <input type="range" aria-label="จุดเริ่มคลิป" min={0} max={fullSeconds} step={0.1} value={startS} onChange={(e) => moveStart(Number(e.target.value))} className={thumb} />
              <input type="range" aria-label="จุดจบคลิป" min={0} max={fullSeconds} step={0.1} value={endS} onChange={(e) => moveEnd(Number(e.target.value))} className={thumb} />
            </div>
            <p className="text-xs text-slate-500">ลากปุ่มสองข้างเพื่อเลือกช่วงที่อยากให้เพื่อนๆ ดู ยาวได้ถึง {MAX_VIDEO_SECONDS} วินาที</p>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-600">คลิปยาว {Math.round(fullSeconds)} วินาที โพสต์ได้ทั้งคลิป</p>
        ))}
      {tool === 'cover' && (
        <div className="space-y-1">
          <label htmlFor="clip-cover" className="flex items-center justify-between text-sm font-bold text-slate-900">
            ภาพปก
            <span className="text-xs font-semibold text-slate-600 tabular-nums">{clipClock(coverAtS)}</span>
          </label>
          <input
            id="clip-cover"
            type="range"
            min={startS}
            max={endS}
            step={0.1}
            value={Math.min(endS, Math.max(startS, coverAtS))}
            onChange={(e) => onCoverChange(Number(e.target.value))}
            className="w-full h-8 accent-[#2563EB] cursor-pointer"
          />
          <p className="text-xs text-slate-500">{canPreview ? 'เลื่อนหาเฟรมที่สวยที่สุด ภาพนี้จะโชว์ในหน้ารวมโมเมนต์' : 'เครื่องนี้แสดงภาพตัวอย่างไม่ได้ ปกจะใช้เฟรมตามเวลาที่เลือก'}</p>
        </div>
      )}
      {tool === 'text' && (
        <TextTools text={textOn} hasTexts={texts.length > 0} on="คลิป" onType={typeText} onEdit={editText} onRemove={removeText} onNew={() => setSelectedText(null)} />
      )}
      {tool === 'sound' && (
        <div className="space-y-2">
          <Segmented
            label="เสียงของคลิป"
            options={[['ใช้เสียงเดิม', false], ['ปิดเสียง', true]]}
            value={muted}
            onChange={(next) => {
              onMutedChange(next);
              if (next) setListening(false);
            }}
          />
          <p className="text-xs text-slate-500">{muted ? 'คลิปจะโพสต์แบบไม่มีเสียง เหมาะกับที่เสียงดังหรือมีเสียงคนอื่นติดมา' : 'แตะรูปลำโพงบนคลิปเพื่อลองฟังเสียง'}</p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100 shrink-0">
        <button type="button" onClick={onBack} aria-label="ย้อนกลับ" className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 id="create-moment-title" className="font-bold text-base text-slate-900">แต่งคลิป</h3>
        <button type="button" onClick={onNext} disabled={isBusy} className="h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap">
          {isBusy ? 'กำลังเตรียม…' : 'ถัดไป'}
        </button>
      </div>

      {/* The clip comes first: tools under it on an upright screen, beside it on a wide one */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden">
        <div className="relative [container-type:size] flex-1 min-h-[40vh] landscape:min-h-0 min-w-0 bg-black flex items-center justify-center sm:p-4">
          <button
            type="button"
            onClick={onReplace}
            className="absolute top-3 left-3 z-10 h-9 px-3.5 rounded-full bg-black/60 hover:bg-black/75 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            เลือกคลิปใหม่
          </button>
          {!canPreview && (
            <p className="px-6 text-center text-sm font-medium leading-relaxed text-white/85">เครื่องนี้แสดงตัวอย่างคลิปนี้ไม่ได้ แต่โพสต์ได้ตามปกติ<br />ถ้าคลิปไม่เล่นบนบางเครื่อง ลองตั้งกล้องเป็น H.264 (Most Compatible) นะ</p>
          )}
          {src && canPreview && (
            <div className="relative" style={{ aspectRatio: `${ratio}`, width: `min(100cqw, ${100 * ratio}cqh)` }}>
              <video
                ref={video}
                // A blob: link from the browser, which encodeURI leaves as it is; CodeQL needs it for text that started in a file input
                src={encodeURI(src)}
                muted={!listening || muted}
                autoPlay
                playsInline
                onLoadedMetadata={(e) => {
                  const el = e.currentTarget;
                  if (el.videoWidth && el.videoHeight) setRatio(el.videoWidth / el.videoHeight);
                  if (startS > 0) el.currentTime = startS;
                }}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget;
                  if (tool !== 'cover' && (el.currentTime >= endS || el.currentTime < startS - 0.3)) el.currentTime = startS;
                }}
                onEnded={(e) => {
                  if (tool !== 'cover') {
                    e.currentTarget.currentTime = startS;
                    void e.currentTarget.play().catch(() => undefined);
                  }
                }}
                onError={() => setCanPreview(false)}
                aria-label="ตัวอย่างคลิป"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <canvas
                ref={overlay}
                width={OVERLAY_WIDTH}
                height={overlayHeight}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-hidden="true"
                style={{ touchAction: texts.length ? 'none' : 'auto' }}
                className="absolute inset-0 w-full h-full"
              />
              {canEdit && !muted && tool !== 'cover' && (
                <button
                  type="button"
                  onClick={() => setListening((on) => !on)}
                  aria-label={listening ? 'ปิดเสียงตัวอย่าง' : 'ฟังเสียงตัวอย่าง'}
                  aria-pressed={listening}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
                >
                  {listening ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 landscape:w-[320px] flex flex-col border-t landscape:border-t-0 landscape:border-l border-slate-100 min-h-0">
          <div className="landscape:flex-1 min-h-0 overflow-y-auto px-4 py-3">{panel}</div>
          <div className="shrink-0 grid border-t border-slate-100 pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${tools.length}, minmax(0, 1fr))` }} role="group" aria-label="เครื่องมือแต่งคลิป">
            {tools.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTool(id)} aria-pressed={tool === id} className={`flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] cursor-pointer ${tool === id ? 'font-bold text-[#2563EB]' : 'font-medium text-slate-600 hover:text-slate-900'}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
