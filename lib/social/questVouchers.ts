import { randomInt } from 'node:crypto';
import type { ChallengeQuest } from '@/data/mockData';
import { voucherStore } from './stores';

/**
 * The code a member shows a partner brand after finishing its challenge (lib/social/stores.ts).
 * One code per member per challenge, issued by the server the first time the finished challenge is read.
 * Nothing is issued for a platform challenge: its reward is points.
 */
export interface QuestVoucher {
  code: string;
  memberId: string;
  questId: string;
  issuedAt: string;
  /** Set by staff when the partner has honoured the code */
  usedAt?: string;
}

// No 0/O or 1/I, so a code read out loud at a counter is not misheard
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomPart = (length: number) => Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const voucherOf = (memberId: string, questId: string): Promise<QuestVoucher | undefined> => voucherStore.find(memberId, questId);

export const vouchersOf = async (memberId: string) =>
  (await voucherStore.ofMember(memberId)).map(({ code, questId, issuedAt }) => ({ code, questId, issuedAt }));

/** The member's code for a finished partner challenge; issued on first call, the same code afterwards */
export async function issueVoucher(memberId: string, quest: ChallengeQuest): Promise<QuestVoucher | null> {
  if (quest.brandReward?.type !== 'brand_partner') return null;
  const prefix = (quest.brandReward.voucherCodePrefix || 'CCH-').toUpperCase().slice(0, 16);
  // A code already taken by someone else issues nothing, so try again with a new one
  for (let tries = 0; tries < 5; tries += 1) {
    const issued = await voucherStore.issue({ code: `${prefix}${randomPart(8)}`, memberId, questId: quest.id, issuedAt: new Date().toISOString() });
    if (issued) return issued;
  }
  return null;
}

const tidyCode = (code: string) => code.trim().toUpperCase();

export const findVoucherByCode = (code: string): Promise<QuestVoucher | undefined> => voucherStore.findByCode(tidyCode(code));

/** Marks a code as used; a code already used keeps its first time */
export async function markVoucherUsed(code: string): Promise<QuestVoucher | undefined> {
  return voucherStore.markUsed(tidyCode(code));
}

/** Account deletion */
export async function removeVouchersBy(memberId: string): Promise<void> {
  await voucherStore.removeBy(memberId);
}
