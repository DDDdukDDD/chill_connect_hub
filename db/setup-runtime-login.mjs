// One-time (or rotate): gives app_runtime a fresh random password and writes DATABASE_URL to .env.local.
// The password is never printed. Copy DATABASE_URL to Vercel's environment yourself.
// Usage: npm run db:runtime-login
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { adminConnection, ENV_FILE, readEnv } from './env.mjs';

const pooled = readEnv().POSTGRES_URL;
if (!pooled) throw new Error('POSTGRES_URL (transaction pooler) is not set');

const password = randomBytes(24).toString('hex');   // hex only: safe inside SQL and URLs
const sql = adminConnection();
try {
  await sql.unsafe(`alter role app_runtime with login password '${password}'`);
} finally {
  await sql.end();
}

// Same pooler host, different user: Supabase's pooler expects "<role>.<project ref>".
// Session mode (5432), not transaction mode (6543): measured 2026-10-25, the transaction pooler moved large results
// 40-70x slower (all places: 59 s vs 0.3-0.7 s).
const url = new URL(pooled);
url.port = '5432';
const projectRef = decodeURIComponent(url.username).split('.')[1];
url.username = projectRef ? `app_runtime.${projectRef}` : 'app_runtime';
url.password = password;
const line = `DATABASE_URL=${url.toString()}`;

const text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
const next = /^DATABASE_URL=.*$/m.test(text)
  ? text.replace(/^DATABASE_URL=.*$/m, line)
  : `${text.replace(/\s*$/, '\n')}# Website's own database login (app_runtime, data only). Rotate: npm run db:runtime-login\n${line}\n`;
writeFileSync(ENV_FILE, next);
console.log('app_runtime password set; DATABASE_URL written to .env.local (not shown).');
