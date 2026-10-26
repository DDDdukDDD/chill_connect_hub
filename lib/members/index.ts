import { USE_POSTGRES } from '../db/postgres/client';
import { jsonMemberRepository } from './jsonMemberRepository';
import { pgMemberRepository } from './pgMemberRepository';
import type { MemberRepository } from './types';

export * from './types';

/** DATA_STORE=postgres uses the Supabase database; otherwise data/members.json */
export const memberRepository: MemberRepository = USE_POSTGRES ? pgMemberRepository : jsonMemberRepository;
