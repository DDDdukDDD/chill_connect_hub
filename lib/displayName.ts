/**
 * Display-name helpers shared by the server (member accounts) and the client (forms, avatars).
 * No server-only imports here.
 */

// Thai marks that sit above or below a consonant: vowels (U+0E31, U+0E34-0E3A) and tone/other marks (U+0E47-0E4E)
const THAI_MARK = '\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E';
const THAI_CONSONANT = '\\u0E01-\\u0E2E';
/** A Thai mark with no Thai consonant (or another mark) before it, e.g. a tone mark typed before "Duke" */
const STRAY_THAI_MARK = new RegExp('(?<![' + THAI_CONSONANT + THAI_MARK + '])[' + THAI_MARK + ']+', 'g');
/** Control characters, zero-width characters and line/paragraph separators */
const INVISIBLE = new RegExp('[\\u0000-\\u001F\\u007F\\u200B-\\u200F\\u2028-\\u202F\\uFEFF]', 'g');
const THAI_LEADING_VOWEL = new RegExp('[\\u0E40-\\u0E44]');

/**
 * Removes marks that cannot be part of the name (typed by accident with the Thai keyboard on),
 * other stray combining marks at the start, invisible characters, and repeated spaces.
 * Safe to run on every keystroke: it never removes a mark that follows a Thai consonant.
 */
export function tidyDisplayName(input: string): string {
  return input
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(STRAY_THAI_MARK, '')
    .replace(/^\p{M}+/u, '')
    .replace(/\s+/g, ' ');
}

/** The letter for an initials avatar: the first real letter, skipping Thai leading vowels */
export function nameInitial(name: string, fallback = '?'): string {
  const letters = tidyDisplayName(name).match(/[\p{L}\p{N}]/gu) ?? [];
  return (letters.find((ch) => !THAI_LEADING_VOWEL.test(ch)) ?? letters[0] ?? fallback).toUpperCase();
}
