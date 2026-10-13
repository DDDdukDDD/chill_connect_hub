import type { ChallengeQuest, QuestRule } from '@/data/mockData';

/**
 * What the screens need to present a challenge: its reward, the answer of GET /api/quests/[id],
 * and its rules put into words. Everything said here follows how the server really counts a challenge
 * (lib/social/questProgress.ts), so a screen never promises a check the product does not do.
 */
export interface QuestRewardProfile {
  type: 'brand_partner' | 'hub_central';
  title: string;
  partnerName: string;
  voucherCodePrefix?: string;
  exclusiveNotice?: string;
  terms?: string;
  hubRewardNote?: string;
}

export type BrandVoucherReward = QuestRewardProfile;

export function getQuestBrandReward(quest: Pick<ChallengeQuest, 'brandReward'> | null | undefined): QuestRewardProfile {
  if (quest?.brandReward) return quest.brandReward as QuestRewardProfile;

  // A challenge that names no reward is a platform challenge: XP, spent on any reward
  return {
    type: 'hub_central',
    title: 'แต้มสะสมอิสระ + ปลดล็อกของรางวัลใน Hub Rewards',
    partnerName: 'Chill & Connect Hub',
    hubRewardNote: 'ชาเลนจ์กิจกรรมกลางของระบบ รับแต้มสะสมอิสระเพื่อนำไปเลือกแลกของรางวัลในหน้า /rewards',
    terms: 'นำ XP ไปเลือกของรางวัลที่ต้องการได้ตลอดเวลา',
  };
}

type Evidence = NonNullable<QuestRule['minEvidence']>;

/** GET /api/quests/[id]: where to go for the challenge and what the server counted for the signed-in member */
export interface QuestDetail {
  tracked: boolean;
  minEvidence: Evidence | null;
  targets: { targetType: string; id: string; title: string; image?: string; detail?: string; href: string; visited: boolean }[];
  targetsTotal: number;
  browseHref: string | null;
  quest?: ChallengeQuest;
  mine: { joined: boolean; current: number; total: number | null; completed: boolean; voucherCode: string | null; voucherUsedAt?: string | null } | null;
}

/** Said beside the places, to a member who is doing the challenge */
export const EVIDENCE_HINTS: Record<Evidence, string> = {
  marked: 'ไปถึงแล้วเปิดหน้าสถานที่ กด "มาที่นี่แล้ว" ระบบจะนับให้ทันที',
  moment: 'ไปถึงแล้วแชร์โมเมนต์พร้อมรูปจากที่นั่น ระบบจะนับให้ทันที',
  checkin: 'ไปร่วมกิจกรรมแล้วให้โฮสต์เช็กอินให้ ระบบจะนับให้ทันที',
};

/** How each visit is confirmed, in the wording of the rules */
const PROOF_LINES: Record<Evidence, string> = {
  marked: 'กดยืนยัน "มาที่นี่แล้ว" ด้วยตนเองในหน้าของสถานที่นั้น',
  moment: 'โพสต์โมเมนต์พร้อมรูปถ่ายจากสถานที่นั้น',
  checkin: 'โฮสต์ผู้จัดกิจกรรมเช็กอินให้ ณ จุดนัดพบ',
};

export const SELF_NOTED_HINT = 'ชาเลนจ์นี้ยังไม่มีระบบตรวจให้ คุณบันทึกเองได้เพื่อเตือนตัวเองว่าทำไปถึงไหนแล้ว การบันทึกเองยังไม่ได้ XP หรือของรางวัล';

const KINDS = {
  spot: { noun: 'สถานที่', unit: 'แห่ง' },
  community: { noun: 'กิจกรรมคอมมูนิตี้', unit: 'ครั้ง' },
  fair: { noun: 'งานแฟร์', unit: 'งาน' },
} as const;

// A rule names categories by id; these are the words a visitor knows them by
const CATEGORY_WORDS: Record<string, string> = {
  cafe: 'คาเฟ่',
  park: 'สวนสาธารณะ',
  art: 'แกลเลอรีและหอศิลป์',
  museum: 'พิพิธภัณฑ์',
  temple: 'วัด',
  nature: 'แหล่งธรรมชาติ',
  market: 'ตลาด',
  beach: 'ชายหาด',
  viewpoint: 'จุดชมวิว',
  oldtown: 'ย่านเมืองเก่า',
  heal: 'สายฮีลใจ',
  move: 'สายขยับตัว',
  chill: 'สายชิลล์',
  learn: 'สายเรียนรู้',
};

export interface QuestRulesText {
  /** 'แห่ง', 'ครั้ง' or 'งาน' */
  unit: string;
  /** What counts, e.g. "คาเฟ่ที่อยู่ในระบบ" or "กิจกรรมคอมมูนิตี้ที่ชื่อมีคำว่า HYROX" */
  scope: string;
  /** How one visit is confirmed */
  proof: string;
  /** Why going to the same one twice adds nothing */
  onceEach: string;
  /** The step that says where to go and how many, with {n} for the number */
  goStep: string;
}

/** The rule of a counted challenge in words; null for a challenge the server does not count */
export function describeQuestRule(rule: QuestRule | undefined, evidence: Evidence | null): QuestRulesText | null {
  if (!rule) return null;
  const kind = KINDS[rule.targetTypes[0]] ?? KINDS.spot;
  const isEvent = rule.targetTypes[0] !== 'spot';
  const categories = (rule.categories ?? []).map((id) => CATEGORY_WORDS[id] ?? id);

  let scope: string;
  let goStep = '';
  if (rule.targetIds?.length) {
    goStep = `ไป${kind.noun}ที่ระบุไว้ในหน้านี้ให้ครบทั้ง {n} ${kind.unit}`;
    scope = `${kind.noun} ${rule.targetIds.length} ${kind.unit}ที่ระบุไว้ในหน้านี้`;
  } else {
    const what = categories.length ? (isEvent ? `${kind.noun}${categories.join(' หรือ')}` : categories.join(' หรือ')) : kind.noun;
    const named = rule.keywords?.length ? `ที่ชื่อมีคำว่า ${rule.keywords.map((word) => `"${word}"`).join(' หรือ ')}` : 'ที่อยู่ในระบบ';
    const where = rule.provinces?.length ? ` ในจังหวัด${rule.provinces.join(' หรือ ')}` : '';
    scope = `${what}${named}${where}`;
  }
  return {
    unit: kind.unit,
    scope,
    proof: PROOF_LINES[evidence ?? rule.minEvidence ?? 'marked'],
    onceEach: `${kind.noun}เดียวกันนับได้ 1 ครั้ง ไปซ้ำที่เดิมไม่นับเพิ่ม`,
    goStep: goStep || `ไป${scope} ให้ครบ {n} ${kind.unit}`,
  };
}

/** Progress a member notes for themselves on a challenge the server does not count, kept in this browser */
export const NOTES_KEY = 'cch_quest_notes';
export function readNotes(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
