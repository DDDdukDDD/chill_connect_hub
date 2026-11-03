// Sets up the development database named in .env.development.local, separate from the live one in .env.local.
// Usage: npm run db:dev            applies migrations and gives the website its own login there
//        npm run db:dev -- --copy  also replaces the development data with a copy of the live data
// The live database is only read, on a read-only session. Phone numbers are not copied, and neither is the audit log.
// The development login is never printed. Copy the finished file to each computer yourself; it is not in Git.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { postgres } from './env.mjs';

const LIVE_FILE = new URL('../.env.local', import.meta.url);
const DEV_FILE = new URL('../.env.development.local', import.meta.url);
const SKIPPED_TABLES = new Set(['schema_migrations', 'audit_log']);
const HIDDEN_COLUMNS = { members: new Set(['phone', 'phone_verified_at', 'phone_verification']) };

const parse = (file) =>
  Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const at = line.indexOf('=');
        return [line.slice(0, at), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
const projectRef = (url) => decodeURIComponent(new URL(url).username).split('.')[1];
const connect = (url) => postgres(url, { max: 1, ssl: 'require', prepare: false, onnotice: () => {} });
const name = (id) => `"${id.replace(/"/g, '""')}"`;

if (!existsSync(DEV_FILE)) throw new Error('.env.development.local is missing: put the development database in it first');
const dev = parse(DEV_FILE);
const live = existsSync(LIVE_FILE) ? parse(LIVE_FILE) : {};
if (!dev.POSTGRES_URL_NON_POOLING) throw new Error('POSTGRES_URL_NON_POOLING is not set in .env.development.local');
const devRef = projectRef(dev.POSTGRES_URL_NON_POOLING);
if (!devRef) throw new Error('Could not read the project from the development connection string (use the Session pooler one)');
if (live.POSTGRES_URL_NON_POOLING && projectRef(live.POSTGRES_URL_NON_POOLING) === devRef) {
  throw new Error('.env.development.local points at the live database. Nothing was changed.');
}

function migrate() {
  const script = fileURLToPath(new URL('./migrate.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [script], { stdio: 'inherit', env: { ...process.env, POSTGRES_URL_NON_POOLING: dev.POSTGRES_URL_NON_POOLING } });
  if (run.status !== 0) throw new Error('Migrations failed');
}

/** The website logs in as app_runtime here too, so missing grants and timeouts show up in development */
async function setRuntimeLogin() {
  // Already set: a new password here would lock out every other computer using this database
  if (dev.DATABASE_URL && decodeURIComponent(new URL(dev.DATABASE_URL).username).startsWith('app_runtime.')) return;
  const password = randomBytes(24).toString('hex');
  const sql = connect(dev.POSTGRES_URL_NON_POOLING);
  try {
    await sql.unsafe(`alter role app_runtime with login password '${password}'`);
  } finally {
    await sql.end();
  }
  const url = new URL(dev.POSTGRES_URL_NON_POOLING);
  url.username = `app_runtime.${devRef}`;
  url.password = password;
  const line = `DATABASE_URL=${url.toString()}`;
  const text = readFileSync(DEV_FILE, 'utf8');
  writeFileSync(DEV_FILE, /^DATABASE_URL=.*$/m.test(text) ? text.replace(/^DATABASE_URL=.*$/m, line) : `${text.replace(/\s*$/, '\n')}${line}\n`);
  console.log('app_runtime login set; DATABASE_URL written to .env.development.local (not shown).');
}

/** Parents before children, so foreign keys hold while rows arrive */
function inLoadOrder(tables, links) {
  const ordered = [];
  const waiting = new Set(tables);
  while (waiting.size) {
    const ready = [...waiting].filter((t) => !links.some((l) => l.child === t && l.parent !== t && waiting.has(l.parent)));
    if (!ready.length) throw new Error(`Foreign keys form a loop among: ${[...waiting].join(', ')}`);
    for (const t of ready) {
      ordered.push(t);
      waiting.delete(t);
    }
  }
  return ordered;
}

async function copyLiveData() {
  if (!live.POSTGRES_URL_NON_POOLING) throw new Error('POSTGRES_URL_NON_POOLING is not set in .env.local');
  const to = connect(dev.POSTGRES_URL_NON_POOLING);
  try {
    const rows = await to`select table_name from information_schema.tables where table_schema = 'app' and table_type = 'BASE TABLE'`;
    const tables = rows.map((r) => r.table_name).filter((t) => !SKIPPED_TABLES.has(t));
    const links = await to`
      select c.conrelid::regclass::text as child, c.confrelid::regclass::text as parent from pg_constraint c
      where c.contype = 'f' and c.connamespace = 'app'::regnamespace`;
    const bare = (t) => t.replace(/^app\./, '').replace(/"/g, '');
    const order = inLoadOrder(tables, links.map((l) => ({ child: bare(l.child), parent: bare(l.parent) })));

    await to.unsafe(`truncate ${order.map((t) => `app.${name(t)}`).join(', ')} cascade`);
    for (const table of order) {
      const columns = (await to`
        select column_name from information_schema.columns
        where table_schema = 'app' and table_name = ${table} and is_generated = 'NEVER' order by ordinal_position`).map((c) => c.column_name);
      const hidden = HIDDEN_COLUMNS[table] ?? new Set();
      const list = columns.map(name).join(', ');
      const picks = columns.map((c) => (hidden.has(c) ? `null as ${name(c)}` : name(c))).join(', ');
      // A fresh connection per table: the driver can leave its socket paused after a large copy, and the next query then waits forever
      const from = connect(live.POSTGRES_URL_NON_POOLING);
      try {
        await from`set default_transaction_read_only = on`;
        const source = await from.unsafe(`copy (select ${picks} from app.${name(table)}) to stdout`).readable();
        const target = await to.unsafe(`copy app.${name(table)} (${list}) from stdin`).writable();
        await pipeline(source, target);
      } finally {
        await from.end({ timeout: 1 });
      }
      console.log(`copied ${table}`);
    }
    await to.unsafe(`
      do $$
      declare s record;
      begin
        for s in
          select c.relname as tab, a.attname as col, pg_get_serial_sequence(format('app.%I', c.relname), a.attname) as seq
          from pg_class c join pg_attribute a on a.attrelid = c.oid
          where c.relnamespace = 'app'::regnamespace and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
            and pg_get_serial_sequence(format('app.%I', c.relname), a.attname) is not null
        loop
          execute format('select setval(%L, coalesce((select max(%I) from app.%I), 0) + 1, false)', s.seq, s.col, s.tab);
        end loop;
      end $$`);
  } finally {
    await to.end({ timeout: 1 });
  }
}

try {
  migrate();
  await setRuntimeLogin();
  if (process.argv.includes('--copy')) await copyLiveData();
  console.log('Development database is ready.');
} catch (error) {
  console.error(String(error.message).replace(/postgres(ql)?:\/\/\S+/g, '<connection string>'));
  process.exitCode = 1;
}
