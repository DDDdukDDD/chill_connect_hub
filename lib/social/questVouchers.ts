import { randomInt } from 'node:crypto';
import type { ChallengeQuest } from '@/data/mockData';
import { createJsonStore } from './jsonStore';

/**
 * The code a member shows a partner brand after finishing its challenge (data/quest_vouchers.json, gitignored).
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

const store = createJsonStore<QuestVoucher>('quest_vouchers');

// No 0/O or 1/I, so a code read out loud at a counter is not misheard
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomPart = (length: number) => Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const voucherOf = (memberId: string, questId: string): QuestVoucher | undefined =>
  store.read().find((voucher) => voucher.memberId === memberId && voucher.questId === questId);

export const vouchersOf = (memberId: string) =>
  store.read().filter((voucher) => voucher.memberId === memberId).map(({ code, questId, issuedAt }) => ({ code, questId, issuedAt }));

/** The member's code for a finished partner challenge; issued on first call, the same code afterwards */
export async function issueVoucher(memberId: string, quest: ChallengeQuest): Promise<QuestVoucher | null> {
  if (quest.brandReward?.type !== 'brand_partner') return null;
  const prefix = (quest.brandReward.voucherCodePrefix || 'CCH-').toUpperCase().slice(0, 16);
  let issued: QuestVoucher | undefined;
  await store.update((items) => {
    issued = items.find((voucher) => voucher.memberId === memberId && voucher.questId === quest.id);
    if (issued) return items;
    let code = `${prefix}${randomPart(8)}`;
    while (items.some((voucher) => voucher.code === code)) code = `${prefix}${randomPart(8)}`;
    issued = { code, memberId, questId: quest.id, issuedAt: new Date().toISOString() };
    return [issued, ...items];
  });
  return issued ?? null;
}

const tidyCode = (code: string) => code.trim().toUpperCase();

export const findVoucherByCode = (code: string): QuestVoucher | undefined => store.read().find((voucher) => voucher.code === tidyCode(code));

/** Marks a code as used; a code already used keeps its first time */
export async function markVoucherUsed(code: string): Promise<QuestVoucher | undefined> {
  let marked: QuestVoucher | undefined;
  await store.update((items) =>
    items.map((voucher) => {
      if (voucher.code !== tidyCode(code)) return voucher;
      marked = voucher.usedAt ? voucher : { ...voucher, usedAt: new Date().toISOString() };
      return marked;
    })
  );
  return marked;
}

/** Account deletion */
export async function removeVouchersBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((voucher) => voucher.memberId !== memberId));
}
