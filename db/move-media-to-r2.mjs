// Moves every uploaded file from Vercel Blob to Cloudflare R2 (docs/VIDEO_PLAN.md, stage 2) and points the database
// at the new address. A file keeps its path: https://<store>.public.blob.vercel-storage.com/moments/x.webp becomes
// https://media.chillwaa.com/moments/x.webp, so the database change is one host swap in every column that holds it.
//
//   node db/move-media-to-r2.mjs                 count files and database values, change nothing
//   node db/move-media-to-r2.mjs --copy          copy files Blob → R2 (skips files already there), database untouched
//   node db/move-media-to-r2.mjs --switch        copy anything missing, then rewrite the database links
//   node db/move-media-to-r2.mjs --delete-blob   after a week on R2: delete the Blob files no longer linked anywhere
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). Blob login and the live R2 key: `.env.vercel` from
// `npx vercel env pull .env.vercel --environment=production` (delete it afterwards).
import { existsSync, readFileSync } from 'node:fs';
import { AwsClient } from 'aws4fetch';
import { list, del } from '@vercel/blob';
import { adminConnection } from './env.mjs';

const VERCEL_ENV = new URL('../.env.vercel', import.meta.url);
if (existsSync(VERCEL_ENV)) {
  for (const line of readFileSync(VERCEL_ENV, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\r\n]*)/);
    if (m && /^(BLOB_|VERCEL_OIDC_TOKEN|R2_)/.test(m[1]) && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) throw new Error('R2_* settings missing (.env.vercel)');
const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;

const args = process.argv.slice(2);
const copy = args.includes('--copy') || args.includes('--switch');
const switchDb = args.includes('--switch');
const deleteBlob = args.includes('--delete-blob');

const r2 = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' });
const objectUrl = (key) => `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
const newBase = `${R2_PUBLIC_URL.replace(/\/+$/, '')}/`;
const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;

const blobs = [];
for (let cursor; ; ) {
  const page = await list({ cursor, limit: 1000, token });
  blobs.push(...page.blobs);
  if (!page.hasMore) break;
  cursor = page.cursor;
}
const oldBase = blobs.length ? `${new URL(blobs[0].url).origin}/` : null;
console.log(`Blob: ${blobs.length} files, ${mb(blobs.reduce((s, b) => s + b.size, 0))}${oldBase ? ` at ${oldBase}` : ''}`);

const sql = adminConnection();
try {
  // Every text, varchar, text[] and jsonb column in the app schema that mentions the old host
  const columns = await sql`
    select table_name, column_name, data_type from information_schema.columns
    where table_schema = 'app' and (data_type in ('text', 'character varying', 'jsonb') or (data_type = 'ARRAY' and udt_name = '_text'))
      and table_name in (select table_name from information_schema.tables where table_schema = 'app' and table_type = 'BASE TABLE')`;
  const hits = [];
  if (oldBase) {
    for (const c of columns) {
      const [{ n }] = await sql`select count(*)::int as n from ${sql('app.' + c.table_name)} where ${sql(c.column_name)}::text like ${'%' + oldBase + '%'}`;
      if (n > 0) hits.push({ ...c, n });
    }
  }
  console.log(`Database: ${hits.reduce((s, h) => s + h.n, 0)} rows link to Blob${hits.length ? ': ' + hits.map((h) => `${h.table_name}.${h.column_name} ${h.n}`).join(', ') : ''}`);

  if (copy) {
    let copied = 0;
    for (const blob of blobs) {
      const head = await r2.fetch(objectUrl(blob.pathname), { method: 'HEAD' });
      if (head.ok && Number(head.headers.get('content-length')) === blob.size) continue;
      const res = await fetch(blob.url);
      if (!res.ok) { console.log(`  skipped ${blob.pathname}: download ${res.status}`); continue; }
      const body = new Uint8Array(await res.arrayBuffer());
      const put = await r2.fetch(objectUrl(blob.pathname), {
        method: 'PUT',
        body,
        headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable' },
      });
      if (!put.ok) throw new Error(`R2 upload ${blob.pathname}: ${put.status}`);
      copied++;
    }
    console.log(`Copied ${copied} file(s) to R2 (${blobs.length - copied} were already there)`);
  }

  if (switchDb && oldBase) {
    // Every Blob file must be on R2 before any link moves
    for (const blob of blobs) {
      const head = await r2.fetch(objectUrl(blob.pathname), { method: 'HEAD' });
      if (!head.ok) throw new Error(`Not on R2 yet, nothing switched: ${blob.pathname}`);
    }
    await sql.begin(async (tx) => {
      for (const h of hits) {
        const col = tx(h.column_name);
        const table = tx('app.' + h.table_name);
        if (h.data_type === 'jsonb') await tx`update ${table} set ${col} = replace(${col}::text, ${oldBase}, ${newBase})::jsonb where ${col}::text like ${'%' + oldBase + '%'}`;
        else if (h.data_type === 'ARRAY') await tx`update ${table} set ${col} = array(select replace(x, ${oldBase}, ${newBase}) from unnest(${col}) x) where ${col}::text like ${'%' + oldBase + '%'}`;
        else await tx`update ${table} set ${col} = replace(${col}, ${oldBase}, ${newBase}) where ${col} like ${'%' + oldBase + '%'}`;
      }
    });
    console.log(`Switched: database links now point to ${newBase}`);
  }

  if (deleteBlob) {
    if (hits.length) throw new Error('The database still links to Blob: run --switch first');
    const urls = blobs.map((b) => b.url);
    for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100), { token });
    console.log(`Deleted ${urls.length} file(s) from Blob`);
  }
} finally {
  await sql.end();
}
