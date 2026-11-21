'use client';

/**
 * Plays a library song for the clip editor through Web Audio (BE-446).
 *
 * The first preview used an <audio> element and moved it whenever it drifted from the clip. Each move made the phone
 * fetch that part of the file again, which members heard as stutter, and iPhone ignored its volume. Here a song is
 * downloaded and decoded once, kept in memory, and started at an exact point: moving it is instant and gapless, and the
 * volume is a gain node, which iPhone honours.
 */

/** A short fade on every start and stop, so a jump in the song never clicks */
const FADE_S = 0.02;

let shared: AudioContext | null = null;
const songs = new Map<string, Promise<AudioBuffer>>();

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!shared) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    shared = new Ctor();
  }
  return shared;
}

/**
 * iPhone mutes Web Audio when the ring switch is on silent, while the clip's own sound still plays, so a member heard
 * the clip but not the song. Safari 17+ lets a page say its sound is media playback, which the switch does not mute
 * (BE-448). Elsewhere this does nothing.
 */
function playEvenWhenSilenced() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session && session.type !== 'playback') {
    try {
      session.type = 'playback';
    } catch {
      // Older Safari: the switch still mutes the preview, the posted clip is unaffected
    }
  }
}

/**
 * Where the song's best part starts for a clip this long: the stretch with the most sound, in half-second steps, so a
 * song chosen with a quiet intro starts at its hook as on Reels and TikTok (BE-448). The last 2 s fade out and are left
 * out; a clip longer than the song starts at 0 and the song loops.
 */
export function songHook(song: AudioBuffer, clipS: number): number {
  const STEP_S = 0.5;
  const usable = song.duration - 2;
  const length = Math.min(clipS, usable);
  if (length <= 0 || usable - length < STEP_S) return 0;
  // Loudness of each half second (root mean square, every 8th sample is enough)
  const data = song.getChannelData(0);
  const per = Math.floor(song.sampleRate * STEP_S);
  const steps = Math.floor(usable / STEP_S);
  const loud: number[] = [];
  for (let s = 0; s < steps; s++) {
    let sum = 0;
    let n = 0;
    for (let i = s * per, end = Math.min(data.length, i + per); i < end; i += 8, n++) sum += data[i] * data[i];
    loud.push(Math.sqrt(sum / Math.max(1, n)));
  }
  const span = Math.max(1, Math.round(length / STEP_S));
  let best = 0;
  let bestSum = -1;
  let sum = 0;
  for (let s = 0; s < loud.length; s++) {
    sum += loud[s];
    if (s >= span) sum -= loud[s - span];
    if (s >= span - 1 && sum > bestSum * 1.02) {
      bestSum = sum;
      best = s - span + 1;
    }
  }
  return best * STEP_S;
}

/** The decoded song, fetched once per page; a failed fetch is tried again next time */
export function loadSong(src: string): Promise<AudioBuffer> {
  const ctx = audioContext();
  if (!ctx) return Promise.reject(new Error('no Web Audio'));
  let song = songs.get(src);
  if (!song) {
    song = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error('song not found');
        return r.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data));
    song.catch(() => songs.delete(src));
    songs.set(src, song);
  }
  return song;
}

/** The loudness of a song in `bars` slices, 0–1, for drawing its waveform */
export function songPeaks(song: AudioBuffer, bars: number): number[] {
  const data = song.getChannelData(0);
  const size = Math.max(1, Math.floor(data.length / bars));
  const peaks: number[] = [];
  for (let i = 0; i < bars; i++) {
    let peak = 0;
    // Every 16th sample is plenty to find a slice's peak
    for (let j = i * size, end = Math.min(data.length, j + size); j < end; j += 16) peak = Math.max(peak, Math.abs(data[j]));
    peaks.push(peak);
  }
  const top = Math.max(...peaks, 0.001);
  return peaks.map((p) => p / top);
}

/** One looping song at a time; a new start replaces the one playing */
export class SongPlayer {
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private song: AudioBuffer | null = null;
  private src = '';
  private startedAt = 0;
  private offset = 0;
  /** Bumped on every start and stop, so a song that finishes loading late does not start after all */
  private turn = 0;
  private volume = 1;

  /** Phones allow sound only from a tap: call this inside the tap, before anything is awaited */
  unlock() {
    playEvenWhenSilenced();
    const ctx = audioContext();
    if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  }

  /** Plays `src` from `atS` seconds, looping; resolves once it sounds, or quietly does nothing if the song cannot load */
  async play(src: string, atS: number, volume: number) {
    const turn = ++this.turn;
    this.volume = volume;
    this.unlock();
    let song: AudioBuffer;
    try {
      song = await loadSong(src);
    } catch {
      return;
    }
    if (turn !== this.turn) return;
    this.start(song, src, atS);
  }

  /** Where the song is now, in seconds; null when nothing plays */
  position(src: string): number | null {
    const ctx = audioContext();
    if (!ctx || !this.source || !this.song || src !== this.src) return null;
    return (this.offset + ctx.currentTime - this.startedAt) % this.song.duration;
  }

  /** Moves the playing song to `atS` at once (it is in memory); false when nothing of `src` is playing */
  jump(src: string, atS: number): boolean {
    if (!this.song || !this.source || src !== this.src) return false;
    this.start(this.song, src, atS);
    return true;
  }

  setVolume(volume: number) {
    this.volume = volume;
    const ctx = audioContext();
    if (ctx && this.gain) this.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
  }

  stop() {
    this.turn++;
    this.release();
  }

  private start(song: AudioBuffer, src: string, atS: number) {
    const ctx = audioContext();
    if (!ctx) return;
    this.release();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume, now + FADE_S);
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = song;
    source.loop = true;
    source.connect(gain);
    const offset = ((atS % song.duration) + song.duration) % song.duration;
    source.start(now, offset);
    Object.assign(this, { source, gain, song, src, startedAt: now, offset });
  }

  /** Fades the playing song out and stops it */
  private release() {
    const ctx = audioContext();
    const { source, gain } = this;
    this.source = null;
    this.gain = null;
    if (!ctx || !source || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_S);
    source.stop(now + FADE_S + 0.01);
    source.onended = () => gain.disconnect();
  }
}
