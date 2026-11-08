// Load test against a local `next start` on the DEV database, never the live site (BE-308).
// Usage: next build + next start -p 3100 with the dev DATA_STORE/DATABASE_URL/POSTGRES_URL_NON_POOLING in the environment, then node scripts/load-test.mjs
const B = process.env.BASE ?? 'http://localhost:3100';
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(B)) throw new Error('local only');

const pick = async (path, key) => ((await (await fetch(B + path)).json())[key] ?? []);
const spots = await pick('/api/spots?limit=20', 'spots');
const tees = await pick('/api/events?type=community&limit=20', 'events');
const fairs = await pick('/api/events?type=public_venue&limit=20', 'events');
const paths = [
  '/', '/community', '/events', '/spots', '/moments', '/challenges',
  '/api/spots/browse?page=1', '/api/events?type=community&limit=24', '/api/moments?limit=12', '/api/master',
  ...spots.slice(0, 5).map((s) => `/spots/${encodeURIComponent(s.id)}`),
  ...tees.slice(0, 5).map((e) => `/community/${encodeURIComponent(e.id)}`),
  ...fairs.slice(0, 5).map((e) => `/events/${encodeURIComponent(e.id)}`),
];

async function stage(users, seconds) {
  const times = [];
  const byPath = new Map();
  let errors = 0, limited = 0, bytes = 0;
  const end = Date.now() + seconds * 1000;
  await Promise.all(Array.from({ length: users }, async (_, u) => {
    let i = u;
    while (Date.now() < end) {
      const path = paths[i++ % paths.length];
      const t = performance.now();
      try {
        const res = await fetch(B + path, { headers: { 'accept-encoding': 'gzip' } });
        const body = await res.arrayBuffer();
        bytes += body.byteLength;
        if (res.status === 429) limited++;
        else if (res.status >= 400) errors++;
      } catch { errors++; }
      const ms = performance.now() - t;
      times.push(ms);
      (byPath.get(path) ?? byPath.set(path, []).get(path)).push(ms);
    }
  }));
  times.sort((a, b) => a - b);
  const q = (list, p) => Math.round(list[Math.min(list.length - 1, Math.floor(list.length * p))]);
  const slowest = [...byPath].map(([p, l]) => [p, q(l.sort((a, b) => a - b), 0.95)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`${users} users: ${times.length} requests, ${(times.length / seconds).toFixed(1)}/s, p50 ${q(times, 0.5)} ms, p95 ${q(times, 0.95)} ms, max ${Math.round(times.at(-1))} ms, errors ${errors}, 429 ${limited}, ${(bytes / 1e6).toFixed(1)} MB`);
  console.log('   slowest p95:', slowest.map(([p, ms]) => `${p.slice(0, 40)} ${ms}ms`).join(' | '));
}

// Warm up once so the first-request compile and cache fill do not count
for (const p of paths) await fetch(B + p).catch(() => {});
for (const users of [10, 25, 50]) await stage(users, 20);
