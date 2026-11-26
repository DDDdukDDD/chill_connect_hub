/**
 * Songs a member can lay under a clip (owner 2026-11-21: many members asked for music on clips).
 *
 * Only songs we may hand to every member to post: never popular songs, which TikTok and Instagram can offer only
 * through paid label deals. Each entry says where it came from and under what terms, so a song can be pulled if a
 * question comes up. 45 are CC0 songs (11 travel songs since 2026-11-27, listed first) (public domain, no credit needed, though the artist is shown on every clip); three
 * are samples made by scripts/make-sample-music.mjs. More come from the owner (docs/LAUNCH_CHECKLIST.md). The files live
 * in public/music/.
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

/**
 * 29 CC0 songs added 2026-11-21 (BE-447): Loyalty Freak Music, Komiku and HoliznaCC0 on Free Music Archive. Each track
 * page's own licence link (rel="license") was checked to be CC0 1.0 on that day. The first 60 s (Skate is 48 s), made
 * equally loud (EBU R128 -16 LUFS) with a 2 s fade at the end so a loop under a long clip has no click, 128 kbps AAC.
 * [id, title, artist, mood, seconds, track page]; the file is /music/<id>.m4a. Listed in the order แนะนำ shows them.
 */
const CC0_SONGS: [string, string, string, string, number, string][] = [
  ['lfm-go-to-the-picnic', 'Go to the Picnic', 'Loyalty Freak Music', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_01_Go_to_the_Picnic/'],
  ['lfm-sweet-sun', 'Sweet Sun', 'Loyalty Freak Music', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_04_Sweet_Sun/'],
  ['lfm-ice-cream-with-you', 'Ice Cream with you', 'Loyalty Freak Music', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_05_Ice_Cream_with_you/'],
  ['lfm-yippee', 'Yippee!', 'Loyalty Freak Music', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_08_Yippee_/'],
  ['lfm-roller-fever', 'Roller Fever', 'Loyalty Freak Music', 'แดนซ์', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/ROLLER_DISCO_DANCE_DANCE/Loyalty_Freak_Music_-_ROLLER_DISCO_DANCE_DANCE_-_01_Roller_Fever/'],
  ['lfm-cant-stop-my-feet', "Can't Stop My Feet!", 'Loyalty Freak Music', 'แดนซ์', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/ROLLER_DISCO_DANCE_DANCE/Loyalty_Freak_Music_-_ROLLER_DISCO_DANCE_DANCE_-_04_Cant_Stop_My_Feet_/'],
  ['lfm-grab-a-partner', 'Grab A Partner', 'Loyalty Freak Music', 'แดนซ์', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/ROLLER_DISCO_DANCE_DANCE/Loyalty_Freak_Music_-_ROLLER_DISCO_DANCE_DANCE_-_05_Grab_A_Partner/'],
  ['lfm-everyone-is-so-alive', 'Everyone is so alive', 'Loyalty Freak Music', 'แดนซ์', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/ROBOT_DANCE_/Loyalty_Freak_Music_-_ROBOT_DANCE__-_01_Everyone_is_so_alive/'],
  ['lfm-after-party', 'After Party', 'Loyalty Freak Music', 'แดนซ์', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/ROBOT_DANCE_/Loyalty_Freak_Music_-_ROBOT_DANCE__-_03_After_Party/'],
  ['lfm-traveling-in-your-mind', 'Traveling in your mind', 'Loyalty Freak Music', 'ชิล', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/TO_CHILL_AND_STAY_AWAKE/Loyalty_Freak_Music_-_TO_CHILL_AND_STAY_AWAKE_-_05_Traveling_in_your_mind/'],
  ['lfm-everyone', 'Everyone', 'Loyalty Freak Music', 'ชิล', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/TO_CHILL_AND_STAY_AWAKE/Loyalty_Freak_Music_-_TO_CHILL_AND_STAY_AWAKE_-_02_Everyone/'],
  ['lfm-beach', 'Beach', 'Loyalty Freak Music', 'ชิล', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/MELODIES_WITH_A_BEAT/Loyalty_Freak_Music_-_MELODIES_WITH_A_BEAT_-_08_Beach/'],
  ['lfm-softly', 'Softly', 'Loyalty Freak Music', 'ชิล', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/MELODIES_WITH_A_BEAT/Loyalty_Freak_Music_-_MELODIES_WITH_A_BEAT_-_06_Softly/'],
  ['lfm-one-cool-minute', 'One Cool Minute', 'Loyalty Freak Music', 'ชิล', 60, 'https://freemusicarchive.org/music/Loyalty_Freak_Music/MINIMAL_AMBIENT_BOUNCE/Loyalty_Freak_Music_-_MINIMAL_AMBIENT_BOUNCE_-_02_One_Cool_Minute/'],
  ['holizna-feeling-human-again', 'Feeling Human Again', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/spring-woke-me-up/feeling-human-again/'],
  ['holizna-hope-on-repeat', 'Hope On Repeat', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/spring-woke-me-up/hope-on-repeat/'],
  ['holizna-kodama', 'Kodama', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/nature-spirit/kodama/'],
  ['holizna-roof-tops', 'Roof Tops', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/roof-tops/'],
  ['holizna-faded-in-the-sunlight', 'Faded in the Sunlight', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/faded-in-the-sunlight/'],
  ['holizna-ocean-memory', 'Ocean Memory', 'HoliznaCC0', 'โลไฟ', 60, 'https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/ocean-memory/'],
  ['komiku-skate', 'Skate', 'Komiku', 'ผจญภัย', 48, 'https://freemusicarchive.org/music/Komiku/Captain_Glouglous_Incredible_Week_Soundtrack/Skate/'],
  ['komiku-surfing', 'Surfing', 'Komiku', 'ผจญภัย', 60, 'https://freemusicarchive.org/music/Komiku/Poupis_incredible_adventures_/Komiku_-_Poupis_incredible_adventures__-_05_Surfing/'],
  ['komiku-walk-of-the-day', 'Time for the walk of the day', 'Komiku', 'ผจญภัย', 60, 'https://freemusicarchive.org/music/Komiku/Poupis_incredible_adventures_/Komiku_-_Poupis_incredible_adventures__-_03_Time_for_the_walk_of_the_day/'],
  ['komiku-champ-de-tournesol', 'Champ de tournesol', 'Komiku', 'ผจญภัย', 60, 'https://freemusicarchive.org/music/Komiku/Its_time_for_adventure_/Komiku_-_Its_time_for_adventure_-_03_Champ_de_tournesol/'],
  ['komiku-remember-the-time', 'Remember the time we use to play', 'Komiku', 'อบอุ่น', 60, 'https://freemusicarchive.org/music/Komiku/Tale_on_the_Late/Komiku_-_Tale_on_the_Late_-_02_Remember_the_time_we_use_to_play/'],
  ['holizna-we-drove-all-night', 'We Drove All Night', 'HoliznaCC0', 'อบอุ่น', 60, 'https://freemusicarchive.org/music/holiznacc0/we-drove-all-night-game-soundtrack/we-drove-all-night/'],
  ['holizna-toy-box', 'Toy Box', 'HoliznaCC0', 'อบอุ่น', 60, 'https://freemusicarchive.org/music/holiznacc0/spring-woke-me-up/toy-box/'],
  ['holizna-side-quest', 'Side Quest to Nowhere', 'HoliznaCC0', 'สนุก', 60, 'https://freemusicarchive.org/music/holiznacc0/we-drove-all-night-game-soundtrack/side-quest-to-nowhere/'],
  ['holizna-extra-life', 'Extra Life I Never Used', 'HoliznaCC0', 'สนุก', 60, 'https://freemusicarchive.org/music/holiznacc0/we-drove-all-night-game-soundtrack/extra-life-i-never-used/'],
];

/**
 * 11 CC0 travel & storytelling tracks added 2026-11-27 (Monplaisir, HoliznaCC0, Komiku on Free Music Archive).
 * Each track page's rel="license" was checked to be CC0 1.0 on 2026-11-27. First 60 s, -16 LUFS, 2 s fade, 128 kbps AAC.
 */
const CC0_TRAVEL_SONGS: [string, string, string, string, number, string][] = [
  ['monplaisir-sur-tout-le-trajet', 'Sur Tout Le Trajet', 'Monplaisir', 'ผจญภัย', 60, 'https://freemusicarchive.org/music/Monplaisir/Sur_Tout_Le_Trajet/Monplaisir_-_Sur_Tout_Le_Trajet_-_01_Sur_Tout_Le_Trajet/'],
  ['monplaisir-fermons-une-plage', 'Fermons une plage', 'Monplaisir', 'ชิล', 60, 'https://freemusicarchive.org/music/Monplaisir/Sur_Tout_Le_Trajet/Monplaisir_-_Sur_Tout_Le_Trajet_-_02_Fermons_une_plage/'],
  ['monplaisir-no-place-like-home', 'There is no place like Home', 'Monplaisir', 'อบอุ่น', 60, 'https://freemusicarchive.org/music/Monplaisir/American_Dreams_Soundtrack/Monplaisir_-_American_Dreams_Original_Soundtrack_-_02_There_is_no_place_like_Home/'],
  ['monplaisir-on-est-bien-la', 'On est bien, là', 'Monplaisir', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Monplaisir/GOOD/Monplaisir_-_GOOD_-_08_On_est_bien_l/'],
  ['holizna-summer-felt-longer', 'Summer Felt Longer Then', 'HoliznaCC0', 'ชิล', 60, 'https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/summer-felt-longer-then/'],
  ['holizna-last-long-day', 'The Last Long Day', 'HoliznaCC0', 'อบอุ่น', 60, 'https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/the-last-long-day/'],
  ['holizna-currents-we-used-to-know', 'Currents We Used to Know', 'HoliznaCC0', 'ชิล', 60, 'https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/currents-we-used-to-know/'],
  ['komiku-down-the-river', 'Down the river', 'Komiku', 'ผจญภัย', 60, 'https://freemusicarchive.org/music/Komiku/Its_time_for_adventure__vol_2/Komiku_-_Its_time_for_adventure_vol_2_-_05_Down_the_river/'],
  ['komiku-big-person-tiny-cities', 'Big person, tiny cities', 'Komiku', 'สนุก', 60, 'https://freemusicarchive.org/music/Komiku/Its_time_for_adventure__vol_3/Komiku_-_Its_time_for_adventure_vol_3_-_03_Big_person_tiny_cities_world_maps_theme/'],
  ['komiku-place-never-get-old', 'The place that never get old', 'Komiku', 'ฟีลกู๊ด', 60, 'https://freemusicarchive.org/music/Komiku/Its_time_for_adventure__vol_3/Komiku_-_Its_time_for_adventure_vol_3_-_07_The_place_that_never_get_old/'],
  ['komiku-chill-out-theme', 'Chill Out Theme', 'Komiku', 'ชิล', 60, 'https://freemusicarchive.org/music/Komiku/Its_time_for_adventure__vol_2/Komiku_-_Its_time_for_adventure_vol_2_-_02_Chill_Out_Theme/'],
];

export const MUSIC_TRACKS: MusicTrack[] = [
  ...CC0_TRAVEL_SONGS.map(([id, title, artist, mood, durationS, page]) => ({
    id,
    title,
    artist,
    mood,
    src: `/music/${id}.m4a`,
    durationS,
    license: `CC0 1.0, ${page} (downloaded 2026-11-27)`,
  })),
  ...CC0_SONGS.map(([id, title, artist, mood, durationS, page]) => ({
    id,
    title,
    artist,
    mood,
    src: `/music/${id}.m4a`,
    durationS,
    license: `CC0 1.0, ${page} (downloaded 2026-11-21)`,
  })),
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
  // The first three samples, drawn from code; last, since the real songs sound better
  { id: 'chill-evening', title: 'ชิลยามเย็น', artist: 'Chillwaa', mood: 'ชิล', src: '/music/chill-evening.wav', durationS: 24, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
  { id: 'on-the-road', title: 'ออกเดินทาง', artist: 'Chillwaa', mood: 'สนุก', src: '/music/on-the-road.wav', durationS: 25.7, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
  { id: 'cafe-morning', title: 'คาเฟ่ยามเช้า', artist: 'Chillwaa', mood: 'อบอุ่น', src: '/music/cafe-morning.wav', durationS: 20.9, license: 'Sample made by scripts/make-sample-music.mjs; ours' },
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
