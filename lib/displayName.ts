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

/** Name given to an email sign-up until the member picks one in onboarding (sign-up no longer asks) */
export const NEW_MEMBER_NAME = 'สมาชิกใหม่';

/**
 * Removes marks that cannot be part of the name (typed by accident with the Thai keyboard on),
 * other stray combining marks at the start, invisible characters, and repeated spaces.
 * Safe to run on every keystroke: it never removes a mark that follows a Thai consonant.
 */
export function tidyDisplayName(input: string): string {
  // Stored records can lack a name (e.g. an old ตี้ without hostName); never crash a screen over it
  return (input ?? '')
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

// Names that read as the site or its staff (owner 2026-10-31): nobody may pass as the team. Duplicate names are fine,
// as on IG or LINE (Thai nicknames repeat a lot); a unique @handle would be a separate field if it is ever needed
const RESERVED_NAMES = [
  /chill\W*waa/i,
  /chill\W*(&|and)\W*connect/i,
  /\badmin\b/i,
  /\bofficial\b/i,
  /\bstaff\b/i,
  /แอดมิ[นน้]/,
  /ทีมงาน/,
  /เจ้าหน้าที่/,
  /ชิลล?์?วา/,
];

/** Why a name cannot be used, or '' when it can */
export function reservedNameProblem(name: string): string {
  const value = tidyDisplayName(name);
  return RESERVED_NAMES.some((re) => re.test(value)) ? 'ชื่อนี้อ่านแล้วเหมือนทีมงาน Chillwaa ลองตั้งชื่ออื่นนะ' : '';
}
