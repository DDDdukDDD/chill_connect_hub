'use client';

/**
 * Songs a member saved, from a clip's song sheet or the clip editor's picker (BE-446). Kept on this device only: a
 * convenience for the next clip, not something another device or staff need to see.
 */

const SAVED_KEY = 'chillwaa:saved-songs';

export function readSavedSongs(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Saves or unsaves one song and returns the new list, newest first */
export function toggleSavedSong(id: string): string[] {
  const saved = readSavedSongs();
  const next = saved.includes(id) ? saved.filter((s) => s !== id) : [id, ...saved];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    // A private window may refuse; the list then lasts only while the page is open
  }
  return next;
}
