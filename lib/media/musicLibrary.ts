/**
 * Songs a member can lay under a clip (owner 2026-11-21: many members asked for music on clips).
 *
 * Only songs we may hand to every member to post: never popular songs, which TikTok and Instagram can offer only
 * through paid label deals. Each entry says where it came from and under what terms, so a song can be pulled if a
 * question comes up. Three are samples made by scripts/make-sample-music.mjs; the rest are CC0 songs (public domain,
 * no credit needed). More come from the owner (docs/LAUNCH_CHECKLIST.md). The files live in public/music/.
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  /** Short Thai word for the feel, shown under the title */
  mood: string;
  src: string;
  durationS: number;
  /** Where the song came from and its terms, for staff; not shown to members */
  license: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'chill-evening', title: 'ชิลยามเย็น', artist: 'Chillwaa', mood: 'ชิล', src: '/music/chill-evening.wav', durationS: 24, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
  { id: 'on-the-road', title: 'ออกเดินทาง', artist: 'Chillwaa', mood: 'สนุก', src: '/music/on-the-road.wav', durationS: 25.7, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
  { id: 'cafe-morning', title: 'คาเฟ่ยามเช้า', artist: 'Chillwaa', mood: 'อบอุ่น', src: '/music/cafe-morning.wav', durationS: 20.9, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
  // HoliznaCC0, album "Spring at last (LOFI TAPE)" and "Winter Lofi" on Free Music Archive, both marked CC0 1.0 (public
  // domain, no credit needed; the artist dedicates the whole catalogue to CC0). The first 60 s of each, as AAC (BE-444)
  ...(
    [
      ['kids', 'Kids', 'spring-at-last-lofi-tape'],
      ['spring-at-last', 'Spring At Last', 'spring-at-last-lofi-tape'],
      ['sense-of-purpose', 'Sense Of Purpose', 'spring-at-last-lofi-tape'],
      ['april-showers', 'April Showers', 'spring-at-last-lofi-tape'],
      ['fire-place', 'Fire Place', 'winter-lofi'],
    ] as const
  ).map(([slug, title, album]) => ({
    id: `holizna-${slug}`,
    title,
    artist: 'HoliznaCC0',
    mood: 'โลไฟ',
    src: `/music/holizna-${slug}.m4a`,
    durationS: 60,
    license: `CC0 1.0, https://freemusicarchive.org/music/holiznacc0/${album}/${slug}/ (downloaded 2026-11-21)`,
  })),
];

export const findTrack = (id: string | null | undefined) => MUSIC_TRACKS.find((t) => t.id === id) ?? null;

/** The song chosen in the clip editor: which one, where in it the clip starts, and how loud it is */
export interface ClipMusic {
  trackId: string;
  startS: number;
  /** 0–1 */
  volume: number;
}

export const DEFAULT_MUSIC_VOLUME = 0.8;
