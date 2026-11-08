import type { Sql } from './client';

/**
 * Version numbers of the cached tables (migration 0035): every write moves its table's number, so a cache knows
 * whether to read the table again by reading one short row instead of scanning the table.
 */
export type VersionedTable = 'events' | 'places' | 'quests' | 'provinces' | 'zones' | 'categories' | 'venues' | 'venue_groups' | 'community_clubs';

// Until 0035 runs on a database (a deploy can land before the migration), fall back to scanning the table
let missing = false;

export async function tableVersions(db: Sql, tables: readonly VersionedTable[]): Promise<string> {
  if (!missing) {
    try {
      const rows = await db`select name, version from app.table_versions where name in ${db(tables as VersionedTable[])}`;
      const by = new Map(rows.map((r) => [r.name as string, String(r.version)]));
      return tables.map((t) => `${t}:${by.get(t) ?? 0}`).join('|');
    } catch (error) {
      if ((error as { code?: string }).code !== '42P01') throw error;
      missing = true;
    }
  }
  const parts = tables.map((t) => `(select count(*) || ':' || coalesce(sum(extract(epoch from updated_at)), 0) from app.${t})`);
  const [row] = await db.unsafe(`select concat_ws('|', ${parts.join(', ')}) as version`);
  return `scan|${row.version}`;
}
