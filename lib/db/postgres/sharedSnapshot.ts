import { createHmac } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { unstable_cache } from 'next/cache';
import { r2Config, r2Fetch, r2ObjectUrl, type R2Config } from '../../media/r2';

/**
 * A list every server needs (all places, events, challenges), shared between servers so the database sends it once per
 * change instead of once per new server. Database egress is billed and capped on the free plan; R2 downloads are free.
 *
 * With R2 set up: one gzip file per list, holding the table version it was read at. A server reads the file; if its
 * version is not the one asked for, the server reads the database and writes the file again. One fixed file per list,
 * so old copies do not pile up. The bucket is public through media.chillwaa.com, so the file name is a keyed hash
 * (AUTH_SECRET) nobody can guess: the full place list holds drafts.
 *
 * Without R2 (a fresh clone): Next's data cache, as before 2026-11-26. It refuses entries over about 2 MB, which the
 * place lists now pass, so it only suits small lists.
 */
const R2_WAIT_MS = 5000;

function snapshotKey(name: string): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return `cache/${createHmac('sha256', secret).update(`list-snapshot:${name}`).digest('hex').slice(0, 40)}.json.gz`;
}

async function readFromR2<T>(config: R2Config, key: string, version: string): Promise<T | undefined> {
  try {
    const res = await r2Fetch(config, r2ObjectUrl(config, key), { signal: AbortSignal.timeout(R2_WAIT_MS) });
    if (!res.ok) {
      if (res.status !== 404) console.warn(`List snapshot read failed (${res.status})`);
      return undefined;
    }
    const saved = JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8')) as { version?: string; items?: T };
    return saved.version === version ? saved.items : undefined;
  } catch (error) {
    console.warn(`List snapshot read failed: ${(error as Error).message}`);
    return undefined;
  }
}

async function writeToR2(config: R2Config, key: string, version: string, items: unknown): Promise<void> {
  try {
    const body = gzipSync(JSON.stringify({ version, items }));
    const res = await r2Fetch(config, r2ObjectUrl(config, key), {
      method: 'PUT',
      body,
      headers: { 'content-type': 'application/gzip', 'content-length': String(body.length), 'cache-control': 'no-store' },
      signal: AbortSignal.timeout(R2_WAIT_MS * 2),
    });
    if (!res.ok) console.warn(`List snapshot write failed (${res.status})`);
  } catch (error) {
    console.warn(`List snapshot write failed: ${(error as Error).message}`);
    // The next server reads the database again; nothing else depends on the file
  }
}

export async function sharedAcrossServers<T>(name: string, version: string, read: () => Promise<T>): Promise<T> {
  const config = r2Config();
  const key = config ? snapshotKey(name) : null;
  if (config && key) {
    const saved = await readFromR2<T>(config, key, version);
    if (saved !== undefined) return saved;
    const items = await read();
    await writeToR2(config, key, version, items);
    return items;
  }
  try {
    return await unstable_cache(read, ['pg-list', name, version], { revalidate: 7 * 24 * 60 * 60 })();
  } catch {
    return read(); // Outside a request, where the cache is not available
  }
}
