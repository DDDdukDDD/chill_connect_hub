// Checks the database lock-down: run after migrations. Usage: npm run db:verify
import { adminConnection, postgres, readEnv } from './env.mjs';

const results = [];
const check = async (label, expectOk, run) => {
  let ok;
  try { await run(); ok = true; } catch { ok = false; }
  results.push({ label, pass: ok === expectOk });
};

const admin = adminConnection();
const runtimeUrl = readEnv().DATABASE_URL;
if (!runtimeUrl) throw new Error('DATABASE_URL is not set: run npm run db:runtime-login');
const runtime = postgres(runtimeUrl, { max: 1, ssl: 'require', prepare: false, onnotice: () => {} });

try {
  const tables = await admin`
    select c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'app' and c.relkind = 'r' and c.relname <> 'schema_migrations'`;
  results.push({ label: `RLS on and forced on all ${tables.length} tables`, pass: tables.every((t) => t.relrowsecurity && t.relforcerowsecurity) });

  for (const role of ['anon', 'authenticated']) {
    const [{ usable }] = await admin`select has_schema_privilege(${role}, 'app', 'usage') as usable`;
    results.push({ label: `${role} cannot use schema app`, pass: !usable });
  }

  await check('website can read', true, () => runtime`select count(*) from app.events`);
  await check('website cannot create tables', false, () => runtime`create table app.nope (id int)`);
  await check('website cannot drop tables', false, () => runtime`drop table app.events`);
  await check('website cannot read schema_migrations', false, () => runtime`select * from app.schema_migrations`);
  await check('website can write audit_log', true, () => runtime.begin(async (tx) => {
    await tx`insert into app.audit_log (actor_kind, action, target_type) values ('system', 'verify', 'none')`;
    throw new Error('rollback');
  }).catch((e) => { if (e.message !== 'rollback') throw e; }));
  await check('website cannot edit audit_log', false, () => runtime`update app.audit_log set summary = 'x' where false`);
  await check('website cannot delete xp_ledger', false, () => runtime`delete from app.xp_ledger where false`);
  const [{ statement_timeout }] = await runtime`show statement_timeout`;
  results.push({ label: `website statement_timeout = ${statement_timeout}`, pass: statement_timeout === '5s' });
} finally {
  await runtime.end();
  await admin.end();
}

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.label}`);
if (results.some((r) => !r.pass)) process.exitCode = 1;
