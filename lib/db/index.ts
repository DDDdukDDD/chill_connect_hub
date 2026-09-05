import { IDataRepository } from './repository';
import { JsonFileAdapter } from './adapters/jsonAdapter';

// Global singleton instance across Next.js re-evaluations
const globalForDb = globalThis as unknown as {
  _chillDbInstance?: IDataRepository;
};

/**
 * Factory to retrieve the singleton database repository instance
 * Enables switching between in-memory/JSON and PostgreSQL/Supabase seamlessly.
 */
export function getDatabase(): IDataRepository {
  if (!globalForDb._chillDbInstance) {
    // In future production rollout, if DATABASE_PROVIDER === 'postgres', load PostgresAdapter
    globalForDb._chillDbInstance = new JsonFileAdapter();
  }
  return globalForDb._chillDbInstance;
}

export const db: IDataRepository = getDatabase();

export * from './types';
export * from './repository';
export * from './queryEngine';
export * from './mutex';
