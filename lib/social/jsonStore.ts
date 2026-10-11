import fs from 'fs';
import os from 'os';
import path from 'path';
import { IS_SERVERLESS } from '../db/databaseFile';
import { AsyncMutex } from '../db/mutex';

/**
 * Small JSON list store for the prototype (data/<name>.json, gitignored: member content).
 * On serverless hosts it lives in /tmp and does not persist. Swap for a database table later.
 */
export function createJsonStore<T>(name: string) {
  const file = IS_SERVERLESS ? path.join(os.tmpdir(), `${name}.json`) : path.join(process.cwd(), 'data', `${name}.json`);
  const cache = globalThis as unknown as Record<string, unknown>;
  const key = `_cchStore_${name}`;
  const mutex = (cache[`${key}_mutex`] ??= new AsyncMutex()) as AsyncMutex;

  const read = (): T[] => {
    if (cache[key]) return cache[key] as T[];
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      cache[key] = Array.isArray(parsed) ? parsed : [];
    } catch {
      cache[key] = [];
    }
    return cache[key] as T[];
  };

  /** Applies `change` to the list under a lock and saves the result */
  const update = async (change: (items: T[]) => T[]): Promise<T[]> => {
    const release = await mutex.acquire();
    try {
      const next = change(read());
      cache[key] = next;
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(next, null, 2), 'utf-8');
      } catch (error) {
        console.error(`${name.toUpperCase()} WRITE FAILED:`, error);
      }
      return next;
    } finally {
      release();
    }
  };

  return { read, update };
}
