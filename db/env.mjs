// Reads database settings for the CLI scripts in db/: real environment first, then .env.local.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export const postgres = createRequire(import.meta.url)('postgres');

export const ENV_FILE = new URL('../.env.local', import.meta.url);

export function readEnv() {
  const fromFile = existsSync(ENV_FILE)
    ? Object.fromEntries(
        readFileSync(ENV_FILE, 'utf8')
          .split(/\r?\n/)
          .filter((line) => /^[A-Z0-9_]+=/.test(line))
          .map((line) => {
            const at = line.indexOf('=');
            return [line.slice(0, at), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
          }),
      )
    : {};
  return { ...fromFile, ...process.env };
}

/** The direct (session) connection: migrations and admin scripts only, never the website */
export function adminConnection() {
  const url = readEnv().POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error('POSTGRES_URL_NON_POOLING is not set (.env.local or environment)');
  return postgres(url, { max: 1, ssl: 'require', onnotice: () => {} });
}
