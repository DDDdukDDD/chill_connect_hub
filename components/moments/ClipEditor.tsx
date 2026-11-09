'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Blend, RefreshCw, Scissors, Sticker, Type, Volume2, VolumeX } from 'lucide-react';
import { clipClock, clipStrip } from '@/lib/media/clip';
import { CLIP_FILTERS, clipFilterCss } from '@/lib/media/clipFilter';
import { MAX_FUN_STICKERS, drawOverlays, hitOverlay, loadEditorFont, type FunSticker, type PhotoText } from '@/lib/media/photoEdit';
import { MAX_VIDEO_SECONDS, MIN_CLIP_SECONDS } from '@/lib/moments/types';
import { Segmented, TextTools, newText } from './EditorControls';
import { StickerTools, newFunSticker } from './StickerTools';

/**
 * Second step of posting a clip, the way TikTok and Reels do it (owner 2026-11-07, round 2 on 2026-11-09): choose the
 * part that plays on a filmstrip, a filter, text and stickers on the clip, and whether it keeps its sound. The cover is
 * taken from the start of the chosen part, with the edits on it, so there is no cover step. Edits are made while this
 * phone shrinks the clip (lib/media/clipCompress.ts), so they show only where the device can do that. The preview
 * loops the chosen part.
 */

type Tool = 'trim' | 'filter' | 'text' | 'sticker' | 'sound';
const OVERLAY_WIDTH = 720;
const STRIP_FRAMES = 10;
/** Half the width of a trim handle: the range inputs reach this far past the strip, so a handle's middle sits on its time */
const HANDLE_HALF = 10;

interface ClipEditorProps {
  file: File;
  fullSeconds: number;
  /** The chosen part: at most MAX_VIDEO_SECONDS, at least MIN_CLIP_SECONDS */
  startS: number;
  endS: number;
  onRangeChange: (startS: number, endS: number) => void;
  /** A CLIP_FILTERS id */
  filter: string;
  onFilterChange: (filter: string) => void;
  texts: PhotoText[];
  onTextsChange: (texts: PhotoText[]) => void;
  stickers: FunSticker[];
  onStickersChange: (stickers: FunSticker[]) => void;
  /** Post the clip without its sound */
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  /** This device can shrink clips, which every edit but the part needs */
  canEdit: boolean;
  /** The cover is being drawn; it can take a moment on a large file */
  isBusy: boolean;
  onBack: () => void;
  /** Another clip, picked straight from the button over the preview */
  onReplace: (file: File) => void;
  onNext: () => void;
}

export function ClipEditor({ file, fullSeconds, startS, endS, onRangeChange, filter, onFilterChange, texts, onTextsChange, stickers, onStickersChange, muted, onMutedChange, canEdit, isBusy, onBack, onReplace, onNext }: ClipEditorProps) {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ kind: 'text' | 'fun'; id: string; lastX: number; lastY: number } | null>(null);
  const [src, setSrc] = useState('');
  // Some clips cannot be shown on this device (HEVC on a computer); they still post, and play where they can
  const [canPreview, setCanPreview] = useState(true);
  const [ratio, setRatio] = useState(9 / 16);
  const [tool, setTool] = useState<Tool>('trim');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedFun, setSelectedFun] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [fontReady, setFontReady] = useState(0);
  const [strip, setStrip] = useState<string[]>([]);
  const [now, setNow] = useState(startS);
  // Any clip a little longer than the shortest part can be trimmed, not only one over the limit
  const canTrim = fullSeconds > MIN_CLIP_SECONDS + 0.5;
  const canDraw = canEdit && canPreview;
  // Moving one end pushes the other when the part would pass the limit or get too short, so the part also slides
  const moveStart = (value: number) => {
    const start = Math.max(0, Math.min(value, fullSeconds - MIN_CLIP_SECONDS));
    onRangeChange(start, Math.min(fullSeconds, Math.max(start + MIN_CLIP_SECONDS, Math.min(endS, start + MAX_VIDEO_SECONDS))));
  };
  const moveEnd = (value: number) => {
    const end = Math.min(fullSeconds, Math.max(value, MIN_CLIP_SECONDS));
    onRangeChange(Math.max(0, Math.min(end - MIN_CLIP_SECONDS, Math.max(startS, end - MAX_VIDEO_SECONDS))), end);
  };
  const pct = (s: number) => `${(Math.max(0, Math.min(s, fullSeconds)) / Math.max(fullSeconds, 0.001)) * 100}%`;
  // Two range inputs on one strip: only their handles take the pointer, so either end can be grabbed
  const handle =
    'pointer-events-none absolute inset-y-0 h-full appearance-none bg-transparent cursor-pointer ' +
    '[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:cursor-ew-resize ' +
    '[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0';
  const textOn = texts.find((t) => t.id === selectedText) ?? null;
  const funOn = stickers.find((s) => s.id === selectedFun) ?? null;
  const overlayHeight = Math.round(OVERLAY_WIDTH / ratio);
  const tools: { id: Tool; label: string; Icon: typeof Scissors }[] = [
    { id: 'trim', label: 'ช่วงคลิป', Icon: Scissors },
    ...(canDraw
      ? [
          { id: 'filter' as const, label: 'ฟิลเตอร์', Icon: Blend },
          { id: 'text' as const, label: 'ข้อความ', Icon: Type },
          { id: 'sticker' as const, label: 'สติกเกอร์', Icon: Sticker },
        ]
      : []),
    ...(canEdit ? [{ id: 'sound' as const, label: 'เสียง', Icon: muted ? VolumeX : Volume2 }] : []),
  ];
  // The frame nearest the start of the part, for the filter previews
  const sampleFrame = strip[Math.min(STRIP_FRAMES - 1, Math.floor((startS / Math.max(fullSeconds, 0.001)) * STRIP_FRAMES))] ?? strip.find(Boolean);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The editor is keyed by the clip, so a new clip starts with an empty strip
  useEffect(
    () =>
      clipStrip(file, fullSeconds, STRIP_FRAMES, (index, frame) =>
      setStrip((prev) => {
        const next = [...prev];
        next[index] = frame;
        return next;
      }),
    ),
    [file, fullSeconds],
  );

  useEffect(() => {
    loadEditorFont()?.then(() => setFontReady((n) => n + 1));
  }, []);

  // A changed part starts playing from its start, so the member sees what they chose
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (el.currentTime < startS - 0.3 || el.currentTime > endS) el.currentTime = startS;
    void el.play().catch(() => undefined);
  }, [startS, endS]);

  // Text and stickers on the clip, drawn over the picture exactly where they will be baked in
  useEffect(() => {
    const ctx = overlay.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, OVERLAY_WIDTH, overlayHeight);
    drawOverlays(ctx, { texts, stickers }, OVERLAY_WIDTH, overlayHeight);
  }, [texts, stickers, overlayHeight, fontReady]);

  /* ---------- text and stickers ---------- */

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
  const addFun = (kind: FunSticker['kind'], value: string) => {
    if (stickers.length >= MAX_FUN_STICKERS) return;
    const sticker = newFunSticker(stickers, kind, value);
    onStickersChange([...stickers, sticker]);
    setSelectedFun(sticker.id);
  };
  const editFun = (change: Partial<FunSticker>) => onStickersChange(stickers.map((s) => (s.id === selectedFun ? { ...s, ...change } : s)));
  const removeFun = () => {
    onStickersChange(stickers.filter((s) => s.id !== selectedFun));
    setSelectedFun(null);
  };

  const positionOf = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = overlay.current?.getContext('2d');
    if (!ctx) return;
    const at = positionOf(e);
    const hit = hitOverlay(ctx, { texts, stickers }, OVERLAY_WIDTH, overlayHeight, at.x, at.y);
    if (!hit || hit.type === 'sticker') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (hit.type === 'text') {
      setSelectedText(hit.id);
      setTool('text');
    } else {
      setSelectedFun(hit.id);
      setTool('sticker');
    }
    drag.current = { kind: hit.type, id: hit.id, lastX: at.x, lastY: at.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const move = drag.current;
    if (!move) return;
    const at = positionOf(e);
    const keep = (v: number) => Math.max(0.03, Math.min(0.97, v));
    const [dx, dy] = [at.x - move.lastX, at.y - move.lastY];
    if (move.kind === 'text') onTextsChange(texts.map((t) => (t.id === move.id ? { ...t, x: keep(t.x + dx), y: keep(t.y + dy) } : t)));
    else onStickersChange(stickers.map((s) => (s.id === move.id ? { ...s, x: keep(s.x + dx), y: keep(s.y + dy) } : s)));
    move.lastX = at.x;
    move.lastY = at.y;
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  /* ---------- panels ---------- */

  const filmstrip = (
    <div className="relative h-14 rounded-xl bg-slate-800">
      <div className="absolute inset-0 flex overflow-hidden rounded-xl" aria-hidden="true">
        {Array.from({ length: STRIP_FRAMES }, (_, i) =>
          strip[i] ? (
            // eslint-disable-next-line @next/next/no-img-element -- a frame drawn on this device, a data: URL
            <img key={i} src={strip[i]} alt="" className="h-full min-w-0 flex-1 object-cover" />
          ) : (
            <span key={i} className="h-full flex-1 border-r border-slate-700/60 last:border-r-0" />
          ),
        )}
      </div>
      {canTrim && (
        <>
          <div className="absolute inset-y-0 left-0 rounded-l-xl bg-white/70" style={{ width: pct(startS) }} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 rounded-r-xl bg-white/70" style={{ left: pct(endS) }} aria-hidden="true" />
          <div className="absolute inset-y-0 border-y-[3px] border-[#2563EB]" style={{ left: pct(startS), width: `calc(${pct(endS)} - ${pct(startS)})` }} aria-hidden="true" />
          {[startS, endS].map((at, i) => (
            <span key={i} className="absolute inset-y-0 w-5 -translate-x-1/2 rounded-md bg-[#2563EB] shadow-md flex items-center justify-center" style={{ left: pct(at) }} aria-hidden="true">
              <span className="w-0.5 h-5 rounded-full bg-white" />
            </span>
          ))}
        </>
      )}
      {canPreview && now >= startS && now <= endS && <div className="absolute inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: pct(now) }} aria-hidden="true" />}
      {canTrim && (
        <>
          <input type="range" aria-label="จุดเริ่มคลิป" min={0} max={fullSeconds} step={0.1} value={startS} onChange={(e) => moveStart(Number(e.target.value))} className={handle} style={{ left: -HANDLE_HALF, width: `calc(100% + ${HANDLE_HALF * 2}px)` }} />
          <input type="range" aria-label="จุดจบคลิป" min={0} max={fullSeconds} step={0.1} value={endS} onChange={(e) => moveEnd(Number(e.target.value))} className={handle} style={{ left: -HANDLE_HALF, width: `calc(100% + ${HANDLE_HALF * 2}px)` }} />
        </>
      )}
    </div>
  );

  const panel = (
    <>
      {tool === 'trim' && (
        <div className="space-y-2">
          <p className="flex items-center justify-between text-sm font-bold text-slate-900">
            {canTrim ? 'ช่วงที่จะโพสต์' : 'โพสต์ได้ทั้งคลิป'}
            <span className="text-xs font-semibold text-slate-600 tabular-nums">
              {clipClock(startS)} – {clipClock(endS)} · {Math.round((endS - startS) * 10) / 10} วิ
            </span>
          </p>
          {filmstrip}
          <p className="text-xs text-slate-500">{canTrim ? `ลากขอบสองข้างเพื่อเลือกช่วง ยาวได้ถึง ${MAX_VIDEO_SECONDS} วินาที ภาพต้นช่วงจะเป็นปกให้เอง` : 'ภาพต้นคลิปจะเป็นปกให้เอง'}</p>
        </div>
      )}
      {tool === 'filter' && (
        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 landscape:grid landscape:grid-cols-4 landscape:overflow-visible" role="group" aria-label="ฟิลเตอร์">
          {CLIP_FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => onFilterChange(f.id)} aria-pressed={filter === f.id} className="group shrink-0 flex flex-col items-center gap-1 cursor-pointer">
              <span className={`rounded-full p-0.5 ring-2 transition-transform group-active:scale-95 ${filter === f.id ? 'ring-[#2563EB]' : 'ring-transparent'}`}>
                {sampleFrame ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a frame drawn on this device, a data: URL
                  <img src={sampleFrame} alt="" className="w-14 h-14 rounded-full object-cover" style={{ filter: clipFilterCss(f.id) || undefined }} />
                ) : (
                  <span className="block w-14 h-14 rounded-full bg-slate-200" />
                )}
              </span>
              <span className={`text-xs ${filter === f.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{f.label}</span>
            </button>
          ))}
        </div>
      )}
      {tool === 'text' && (
        <TextTools text={textOn} hasTexts={texts.length > 0} on="คลิป" onType={typeText} onEdit={editText} onRemove={removeText} onNew={() => setSelectedText(null)} />
      )}
      {tool === 'sticker' && <StickerTools sticker={funOn} count={stickers.length} on="คลิป" onAdd={addFun} onEdit={editFun} onRemove={removeFun} onNew={() => setSelectedFun(null)} />}
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
          <label className="absolute top-3 left-3 z-10 h-9 px-3.5 rounded-full bg-black/60 hover:bg-black/75 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer focus-within:ring-2 focus-within:ring-white">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            เลือกคลิปใหม่
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                e.target.value = '';
                if (picked) onReplace(picked);
              }}
            />
          </label>
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
                  if (el.currentTime >= endS || el.currentTime < startS - 0.3) el.currentTime = startS;
                  setNow(el.currentTime);
                }}
                onEnded={(e) => {
                  e.currentTarget.currentTime = startS;
                  void e.currentTarget.play().catch(() => undefined);
                }}
                onError={() => setCanPreview(false)}
                aria-label="ตัวอย่างคลิป"
                style={{ filter: clipFilterCss(filter) || undefined }}
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
                style={{ touchAction: texts.length || stickers.length ? 'none' : 'auto' }}
                className="absolute inset-0 w-full h-full"
              />
              {canEdit && !muted && (
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
          <div className="landscape:flex-1 min-h-0 max-h-[40vh] landscape:max-h-none overflow-y-auto px-4 py-3">{panel}</div>
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
