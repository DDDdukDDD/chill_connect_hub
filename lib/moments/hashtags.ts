/** Hashtags in a caption. \p{M} keeps Thai vowels and tone marks inside the tag. */
export const HASHTAG = /#[\p{L}\p{M}\p{N}_]+/gu;

const normal = (tag: string) => tag.replace(/^#/, '').toLowerCase();

export const hashtagsOf = (caption: string): string[] => (caption.match(HASHTAG) ?? []).map(normal);

export const hasHashtag = (caption: string, tag: string): boolean => hashtagsOf(caption).includes(normal(tag));

export const hashtagHref = (tag: string): string => `/moments?tag=${encodeURIComponent(normal(tag))}`;
