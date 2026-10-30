/**
 * The colours a story's text can take (owner 2026-10-30): the story composer offers them, the server keeps only these ids.
 * `shadow` keeps each readable on a photo: a dark edge under light colours, a light one under black.
 */
export const STORY_TEXT_COLORS = [
  { id: 'white', hex: '#FFFFFF', label: 'ขาว', shadow: 'rgba(0,0,0,0.45)' },
  { id: 'black', hex: '#0F172A', label: 'ดำ', shadow: 'rgba(255,255,255,0.6)' },
  { id: 'yellow', hex: '#FFD84D', label: 'เหลือง', shadow: 'rgba(0,0,0,0.45)' },
  { id: 'orange', hex: '#F26430', label: 'ส้ม', shadow: 'rgba(0,0,0,0.35)' },
  { id: 'pink', hex: '#F43F5E', label: 'ชมพู', shadow: 'rgba(0,0,0,0.35)' },
  { id: 'blue', hex: '#3B82F6', label: 'ฟ้า', shadow: 'rgba(0,0,0,0.35)' },
  { id: 'green', hex: '#22C55E', label: 'เขียว', shadow: 'rgba(0,0,0,0.4)' },
] as const;

export type StoryTextColor = (typeof STORY_TEXT_COLORS)[number]['id'];

export const isStoryTextColor = (value: unknown): value is StoryTextColor => STORY_TEXT_COLORS.some((c) => c.id === value);

/** The colour's look, white when unknown or unset */
export const storyTextColor = (id?: string) => STORY_TEXT_COLORS.find((c) => c.id === id) ?? STORY_TEXT_COLORS[0];
