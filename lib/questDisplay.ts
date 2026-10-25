import type { ChallengeQuest, QuestRule } from '@/data/mockData';
import { parseQuestDate } from './questLifecycle';

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const shortYear = (d: Date) => String((d.getFullYear() + 543) % 100).padStart(2, '0');
const dayMonth = (d: Date) => `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;

/** "1 พ.ย. – 6 ธ.ค. 69", or "1 พ.ย. 69 – 31 ม.ค. 70" across a new year; empty without both dates */
export function questDateRange(quest: Pick<ChallengeQuest, 'startDate' | 'endDate'>): string {
  const from = parseQuestDate(quest.startDate, false);
  const to = parseQuestDate(quest.endDate, true);
  if (from === null || to === null) return '';
  const a = new Date(from);
  const b = new Date(to);
  return a.getFullYear() === b.getFullYear() ? `${dayMonth(a)} – ${dayMonth(b)} ${shortYear(b)}` : `${dayMonth(a)} ${shortYear(a)} – ${dayMonth(b)} ${shortYear(b)}`;
}

/** One challenge date as "28 ก.พ. 70", whichever way it was stored; the stored text when it cannot be read */
export function questDay(value: string | undefined): string {
  const ts = parseQuestDate(value, false);
  if (ts === null) return value ?? '';
  const d = new Date(ts);
  return `${dayMonth(d)} ${shortYear(d)}`;
}

/**
 * What the screens need to present a challenge: its reward, the answer of GET /api/quests/[id],
 * and its rules put into words. Everything said here follows how the server really counts a challenge
 * (lib/social/questProgress.ts), so a screen never promises a check the product does not do.
 */
export interface QuestRewardProfile {
  type: 'brand_partner' | 'hub_central';
  title: string;
  shortTitle?: string;
  partnerName: string;
  voucherCodePrefix?: string;
  exclusiveNotice?: string;
  terms?: string;
  hubRewardNote?: string;
}

export type BrandVoucherReward = QuestRewardProfile;

/** The most characters a short prize label may have, so it fits the strip on a challenge card */
export const PRIZE_LABEL_MAX = 24;

/** Characters as people count them: a Thai letter with its vowel and tone marks is one */
export function prizeLabelLength(text: string): number {
  return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].length;
}

/**
 * The prize as the challenge card shows it: the host's short label, else the full title without its
 * "(มูลค่า ...)" part and a trailing "+ N XP" (the XP sticker says that). Empty when the challenge gives XP only.
 */
export function questPrizeLabel(quest: Pick<ChallengeQuest, 'brandReward'>): string {
  const reward = quest.brandReward;
  if (!reward) return '';
  const label = reward.shortTitle?.trim() || reward.title.replace(/\s*\(มูลค่า[^)]*\)/g, '').replace(/\s*\+\s*[\d,]+\s*XP\s*$/i, '').trim();
  return label.startsWith('สะสม XP') ? '' : label;
}

export function getQuestBrandReward(quest: Pick<ChallengeQuest, 'brandReward'> | null | undefined): QuestRewardProfile {
  if (quest?.brandReward) return quest.brandReward as QuestRewardProfile;

  // A challenge that names no reward is a platform challenge: XP, spent on any reward
  return {
    type: 'hub_central',
    title: 'สะสม XP แลกของรางวัลที่ชอบ',
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
  mine: {
    joined: boolean;
    current: number;
    total: number | null;
    completed: boolean;
    voucherCode: string | null;
    voucherUsedAt?: string | null;
    /** Set once the challenge is finished */
    finishedAt?: string | null;
    /** The places the member went for a finished challenge, oldest first, with their own photo when they shared one */
    memories?: { targetType: string; id: string; title: string; image?: string; ownPhoto: boolean; href: string; at: string }[];
  } | null;
  /** After finishing: one running challenge the member has not joined */
  next?: { id: string; title: string; image: string | null; rewardPoints: number; rewardTitle: string | null } | null;
  /** A few more open challenges, the same category first */
  related?: { id: string; title: string; image: string | null; rewardPoints: number; period: string; startsInDays: number; participantsCount: number }[];
}

/** Said beside the places, to a member who is doing the challenge */
export const EVIDENCE_HINTS: Record<Evidence, string> = {
  marked: 'ไปถึงแล้วเปิดหน้าสถานที่ กด "มาที่นี่แล้ว" ระบบจะนับให้ทันที',
  moment: 'ไปถึงแล้วแชร์โมเมนต์พร้อมรูปจากที่นั่น ระบบจะนับให้ทันที',
  checkin: 'ไปร่วมตี้แล้วให้โฮสต์เช็กอินให้ ระบบจะนับให้ทันที',
};

/** How each visit is confirmed, in the wording of the rules */
const PROOF_LINES: Record<Evidence, string> = {
  marked: 'กดยืนยัน "มาที่นี่แล้ว" ด้วยตนเองในหน้าของสถานที่นั้น',
  moment: 'โพสต์โมเมนต์พร้อมรูปถ่ายจากสถานที่นั้น',
  checkin: 'โฮสต์ผู้จัดตี้เช็กอินให้ ณ จุดนัดพบ',
};

export const SELF_NOTED_HINT = 'ชาเลนจ์นี้ยังไม่มีระบบตรวจให้ คุณบันทึกเองได้เพื่อเตือนตัวเองว่าทำไปถึงไหนแล้ว การบันทึกเองยังไม่ได้ XP หรือของรางวัล';

const KINDS = {
  spot: { noun: 'สถานที่', unit: 'แห่ง' },
  community: { noun: 'ตี้', unit: 'ครั้ง' },
  fair: { noun: 'อีเวนต์', unit: 'งาน' },
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
  /** Who may take part, when the rule narrows it (a welcome challenge for new members) */
  eligible?: string;
}

/** The rule of a counted challenge in words; null for a challenge the server does not count */
export function describeQuestRule(rule: QuestRule | undefined, evidence: Evidence | null): QuestRulesText | null {
  if (!rule) return null;
  const eligible = rule.newMemberDays
    ? `สมาชิกใหม่ นับเฉพาะการไปภายใน ${rule.newMemberDays} วันแรกหลังสมัคร`
    : undefined;
  if (rule.asHost) {
    return {
      unit: 'ตี้',
      scope: `ตี้ที่คุณเปิดเองเป็นโฮสต์ และมีเพื่อนมาเช็กอินอย่างน้อย ${rule.asHost} คน`,
      proof: `คุณเช็กอินเพื่อนที่มาถึงจุดนัดในหน้าตี้ของคุณ ครบ ${rule.asHost} คน`,
      onceEach: 'ตี้เดียวกันนับได้ 1 ครั้ง',
      goStep: `เปิดตี้ของคุณเอง แล้วมีเพื่อนมาเช็กอินอย่างน้อย ${rule.asHost} คน ให้ครบ {n} ตี้`,
      eligible,
    };
  }
  if (rule.withFriends) {
    const friend = rule.friendsVia === 'invite' ? 'เพื่อนที่คุณชวนมา หรือเพื่อนที่ชวนคุณมา' : 'เพื่อน (คนที่ชวนกันมา หรือติดตามกันและกัน)';
    const who = rule.withFriends > 1 ? `${friend} อย่างน้อย ${rule.withFriends} คน` : friend;
    return {
      unit: 'ตี้',
      scope: `ตี้ที่คุณไปพร้อม${who}`,
      proof: 'โฮสต์เช็กอินให้ทั้งคุณและเพื่อนที่จุดนัดพบ',
      onceEach: 'ตี้เดียวกันนับได้ 1 ครั้ง',
      goStep: `ชวน${rule.friendsVia === 'invite' ? 'เพื่อนสมัครผ่านลิงก์ชวนเพื่อนของคุณ' : 'เพื่อน'} แล้วไปตี้เดียวกัน ให้ครบ {n} ตี้`,
      eligible,
    };
  }
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
    eligible,
    // A weekend challenge counts weekends, not places
    ...(rule.perWeekend && {
      unit: 'สุดสัปดาห์',
      scope: `${scope} ในวันเสาร์หรืออาทิตย์`,
      onceEach: 'สุดสัปดาห์เดียวกันนับ 1 ครั้ง ไม่ว่าจะไปกี่ที่',
      goStep: `ออกไป${scope} ทุกสุดสัปดาห์ ให้ครบ {n} สุดสัปดาห์`,
    }),
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
