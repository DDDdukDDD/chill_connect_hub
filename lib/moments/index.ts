import { USE_POSTGRES } from '../db/postgres/client';
import { jsonMomentRepository } from './jsonMomentRepository';
import { pgMomentRepository } from './pgMomentRepository';
import type { MomentRepository } from './types';

export * from './types';

/** DATA_STORE=postgres uses the database; without it the JSON prototype store (lib/db/postgres/client.ts) */
export const momentRepository: MomentRepository = USE_POSTGRES ? pgMomentRepository : jsonMomentRepository;
