import { jsonMemberRepository } from './jsonMemberRepository';
import type { MemberRepository } from './types';

export * from './types';

/** Swap this for a database-backed repository when moving off the JSON prototype store. */
export const memberRepository: MemberRepository = jsonMemberRepository;
