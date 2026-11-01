import postgres from 'postgres';

/**
 * The website's database connection (Supabase session pooler, port 5432, role app_runtime).
 * Not the transaction pooler (6543): it moved large results 40-70x slower (db/setup-runtime-login.mjs).
 * DATA_STORE=postgres turns it on; without it the site keeps using the JSON files, so switching back is one env change.
 */
export const USE_POSTGRES = process.env.DATA_STORE === 'postgres';

const globalForSql = globalThis as unknown as { _cchSql?: postgres.Sql };

export function sql(): postgres.Sql {
  if (!globalForSql._cchSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATA_STORE=postgres needs DATABASE_URL (npm run db:runtime-login writes it to .env.local)');
    globalForSql._cchSql = postgres(url, {
      // Prepared statements only work when the pooler keeps one session per client (session mode, 5432)
      prepare: !url.includes(':6543/'),
      // Supabase's session pooler allows 15 connections across all servers, and a burst on Vercel starts many servers.
      // One each, closed soon after use. So inside sql().begin() every query must use `tx`: a separate query would wait forever.
      max: 1,
      idle_timeout: 5,
      ssl: 'require',
      onnotice: () => {},
    });
  }
  return globalForSql._cchSql;
}

export type Sql = postgres.Sql | postgres.TransactionSql;
