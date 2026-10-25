// Applies db/migrations/*.sql in order, each once, each in its own transaction.
// Usage: npm run db:migrate            apply pending migrations
//        npm run db:migrate -- --status list applied and pending
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const dir = new URL('./migrations/', import.meta.url);
const files = readdirSync(dir).filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
const checksum = (text) => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');

const sql = adminConnection();
try {
  await sql`create schema if not exists app`;
  await sql`
    create table if not exists app.schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`;
  const applied = new Map((await sql`select name, checksum from app.schema_migrations`).map((row) => [row.name, row.checksum]));

  // An applied file must never change: write a new migration instead
  for (const name of files) {
    const known = applied.get(name);
    if (known && known !== checksum(readFileSync(new URL(name, dir), 'utf8'))) {
      throw new Error(`${name} was edited after it was applied. Revert it and add a new migration.`);
    }
  }

  const pending = files.filter((name) => !applied.has(name));
  if (process.argv.includes('--status')) {
    for (const name of files) console.log(`${applied.has(name) ? 'applied ' : 'pending '} ${name}`);
  } else if (pending.length === 0) {
    console.log('Database is up to date.');
  } else {
    for (const name of pending) {
      const text = readFileSync(new URL(name, dir), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`insert into app.schema_migrations (name, checksum) values (${name}, ${checksum(text)})`;
      });
      console.log(`applied  ${name}`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
