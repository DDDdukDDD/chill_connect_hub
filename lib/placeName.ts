/**
 * The place of a ตี้ without the meeting point the create form appends ("สวนลุมพินี (จุดนัดพบ: ประตู 4)" → "สวนลุมพินี").
 * Headers and cards show the place; the meeting point has its own line on the detail page (owner 2026-10-25).
 */
export function placeName(location: string | undefined): string {
  return (location ?? '').replace(/\s*\(จุดนัดพบ:[^)]*\)\s*$/, '').trim();
}

/**
 * An อีเวนต์'s place with the venue first: imported halls read "Exhibition Hall 8, ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)",
 * and cards cut the end off, so the venue moved to the front: "ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC) · Exhibition Hall 8".
 */
export function fairPlace(location: string | undefined): string {
  const text = placeName(location);
  const parts = text.split(/,\s*/);
  if (parts.length < 2) return text;
  const venue = parts[parts.length - 1];
  if (!/\((QSNCC|BITEC|IMPACT)[^)]*\)|ศูนย์|ไบเทค|อิมแพ็ค/i.test(venue)) return text;
  return `${venue} · ${parts.slice(0, -1).join(', ')}`;
}
