import { Flag, MapPin, Tent, Users } from 'lucide-react';

/** Where a moment came from, in its pillar's colors, and what the reader can do there (Home feed, /moments, /moments/[id]) */
export const MOMENT_TARGETS = {
  spot: { label: 'สถานที่', go: 'ไปที่นี่บ้าง', Icon: MapPin, box: 'bg-[#EBF3ED] text-[#2D5A3C]', icon: 'text-[#4A7C59]', base: '/spots' },
  fair: { label: 'อีเวนต์', go: 'ดูงานนี้', Icon: Tent, box: 'bg-[#EEF4FA] text-[#1F3D5C]', icon: 'text-[#2B527A]', base: '/events' },
  community: { label: 'ตี้', go: 'ดูตี้นี้', Icon: Users, box: 'bg-[#FFF4EE] text-[#D04A1B]', icon: 'text-[#F26430]', base: '/community' },
  challenge: { label: 'ชาเลนจ์', go: 'ทำชาเลนจ์นี้', Icon: Flag, box: 'bg-[#F5F3FF] text-[#6D28D9]', icon: 'text-[#7C3AED]', base: '/challenges' },
} as const;

export type MomentTargetKey = keyof typeof MOMENT_TARGETS;

export const isMomentTarget = (type?: string | null): type is MomentTargetKey => Boolean(type && type in MOMENT_TARGETS);

/** The page of the place, event or challenge a moment is tied to */
export function momentTargetHref(type?: string | null, id?: string | null): string | null {
  return isMomentTarget(type) && id ? `${MOMENT_TARGETS[type].base}/${encodeURIComponent(id)}` : null;
}

/** Uploads go through the image optimizer at a width that fits a grid card; other sources are used as they are */
export function momentImageSrc(src: string, width = 640): string {
  return src.startsWith('/uploads/') ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75` : src;
}

/** The card title: the caption's first line (the rest is on the moment's own page) */
export function momentTitle(caption: string): string {
  return (caption.split('\n').find((line) => line.trim()) ?? '').trim();
}
