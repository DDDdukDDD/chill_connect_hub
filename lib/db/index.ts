import { IDataRepository } from './repository';
import { JsonFileAdapter } from './adapters/jsonAdapter';
import { PostgresAdapter } from './adapters/postgresAdapter';
import { USE_POSTGRES } from './postgres/client';

// Global singleton instance across Next.js re-evaluations
const globalForDb = globalThis as unknown as {
  _chillDbInstance?: IDataRepository;
};

/**
 * Factory to retrieve the singleton database repository instance
 * DATA_STORE=postgres uses the Supabase database; otherwise the JSON files in data/.
 */
export function getDatabase(): IDataRepository {
  if (!globalForDb._chillDbInstance) {
    globalForDb._chillDbInstance = USE_POSTGRES ? new PostgresAdapter() : new JsonFileAdapter();
  }
  return globalForDb._chillDbInstance;
}

export const db: IDataRepository = getDatabase();

export * from './types';
export * from './repository';
export * from './queryEngine';
export * from './mutex';
