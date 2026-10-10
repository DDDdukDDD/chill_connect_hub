import { jsonMomentRepository } from './jsonMomentRepository';
import type { MomentRepository } from './types';

export * from './types';

/** Swap this for a database-backed repository when moving off the JSON prototype store. */
export const momentRepository: MomentRepository = jsonMomentRepository;
