// Makes the sample songs in public/music/ (owner 2026-11-21: start the clip music library with free samples).
// They are drawn here from sine waves and noise, so nobody else holds rights to them. Real free songs replace them
// later (lib/media/musicLibrary.ts). Mono 16-bit WAV at 22.05 kHz: every browser decodes it, about 1 MB each.
//
//   node scripts/make-sample-music.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const OUT = 'public/music';

const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// A tiny seeded random, so the hats sound the same on every run
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function song({ bpm, bars, chords, bassOctave = 36, melody = [], kick, hat, padLevel = 0.18, pluckLevel = 0.22 }) {
  const beat = 60 / bpm;
  const seconds = bars * 4 * beat;
  const out = new Float32Array(Math.round(seconds * RATE));
  const add = (startS, lengthS, fn) => {
    const from = Math.round(startS * RATE);
    const to = Math.min(out.length, from + Math.round(lengthS * RATE));
    for (let i = from; i < to; i++) out[i] += fn((i - from) / RATE);
  };
  for (let bar = 0; bar < bars; bar++) {
    const chord = chords[bar % chords.length];
    const at = bar * 4 * beat;
    // Pad: the chord held for the bar, soft in and out
    for (const note of chord) {
      const f = midi(note);
      add(at, 4 * beat, (t) => {
        const env = Math.min(1, t / 0.4) * Math.min(1, (4 * beat - t) / 0.4);
        return padLevel * 0.33 * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t));
      });
    }
    // Bass on beats 1 and 3
    for (const b of [0, 2]) {
      const f = midi(bassOctave + (chord[0] % 12));
      add(at + b * beat, 1.8 * beat, (t) => 0.3 * Math.exp(-t * 2.2) * Math.min(1, t / 0.01) * Math.sin(2 * Math.PI * f * t));
    }
    if (kick) for (let b = 0; b < 4; b += kick) add(at + b * beat, 0.35, (t) => 0.55 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) * t));
    if (hat) for (let s = 0; s < 8; s++) if (s % hat === 1 % hat) add(at + s * 0.5 * beat, 0.05, (t) => 0.06 * Math.exp(-t * 90) * rand());
  }
  // Melody: [bar, beat, note, beats]; plucks over everything
  for (const [bar, b, note, len] of melody) {
    const f = midi(note);
    add((bar * 4 + b) * beat, len * beat + 0.3, (t) => pluckLevel * Math.exp(-t * 3) * Math.min(1, t / 0.005) * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)));
  }
  // Ends meet, so the song loops without a click
  const edge = Math.round(0.02 * RATE);
  for (let i = 0; i < edge; i++) {
    out[i] *= i / edge;
    out[out.length - 1 - i] *= i / edge;
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  return out.map((v) => Math.tanh((v / peak) * 1.2) * 0.85);
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

// A phrase over each chord: [beat, step in the chord, beats]
const phrase = (bars, chords, pattern, lift = 12) =>
  Array.from({ length: bars }, (_, bar) => pattern.map(([b, step, len]) => [bar, b, chords[bar % chords.length][step % 3] + lift, len])).flat();

const chill = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
const trip = [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
const cafe = [[53, 57, 60], [52, 55, 59], [50, 53, 57], [55, 59, 62]]; // F Em Dm G

const songs = {
  'chill-evening': song({ bpm: 80, bars: 8, chords: chill, kick: 2, hat: 2, melody: phrase(8, chill, [[0, 2, 1], [1.5, 1, 0.5], [2, 0, 1], [3, 1, 1]]) }),
  'on-the-road': song({ bpm: 112, bars: 12, chords: trip, kick: 1, hat: 1, padLevel: 0.14, melody: phrase(12, trip, [[0, 0, 0.5], [0.5, 1, 0.5], [1, 2, 0.5], [2, 1, 0.5], [2.5, 2, 0.5], [3, 0, 1]], 24) }),
  'cafe-morning': song({ bpm: 92, bars: 8, chords: cafe, kick: 0, hat: 0, padLevel: 0.22, pluckLevel: 0.26, melody: phrase(8, cafe, [[0, 0, 1], [1, 2, 1], [2, 1, 1.5], [3.5, 2, 0.5]]) }),
};

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries(songs)) {
  writeFileSync(`${OUT}/${name}.wav`, wav(samples));
  console.log(`${OUT}/${name}.wav  ${(samples.length / RATE).toFixed(1)} s`);
}
