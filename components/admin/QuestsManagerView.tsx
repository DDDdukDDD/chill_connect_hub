'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Clock3, Pencil, Plus, RefreshCw, Search, Trash2, Trophy, X, Zap } from 'lucide-react';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ChallengeQuest, QuestReward } from '@/data/mockData';
import { parseQuestDate } from '@/lib/questLifecycle';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { useMasterData } from '@/lib/useMasterData';
import { SPOT_CATEGORY_OPTIONS } from '@/lib/spotCategories';
import { ImageField } from './masterAdmin';
import { ChallengeList } from '@/components/ChallengeList';

type QuestStatus = 'draft' | 'active' | 'ended';
type QuestCategory = string;

interface QuestDraft {
  title: string;
  badgeLabel: string;
  targetGoal: string;
  /** The longer description shown on the challenge page */
  objective: string;
  category: QuestCategory;
  total: string;
  rewardPoints: string;
  startDate: string; // ISO yyyy-mm-dd for <input type="date">
  endDate: string;
  image: string;
  rewardType: QuestReward['type'];
  partnerName: string;
  rewardTitle: string;
  voucherCodePrefix: string;
  exclusiveNotice: string;
  hubRewardNote: string;
  terms: string;
  /** What the server counts toward the challenge; '' = it is not counted automatically */
  ruleType: '' | 'spot' | 'community' | 'fair';
  ruleEvidence: 'marked' | 'moment' | 'checkin';
  // Comma-separated lists, as typed
  ruleCategories: string;
  ruleKeywords: string;
  ruleProvinces: string;
  ruleTargetIds: string;
  /** spotVibes ids, as grouped on /spots */
  ruleVibes: string;
}

const RULE_TYPE_LABELS = { spot: 'ไปสถานที่', community: 'ร่วมกิจกรรมคอมมูนิตี้', fair: 'ไปงานแฟร์' } as const;
// The categories a rule can name, by their names: places use the data categories, events the four moods
const EVENT_CATEGORY_OPTIONS = [
  { id: 'chill', label: 'จิบกาแฟ & ชิลล์' },
  { id: 'move', label: 'ขยับกาย & กีฬา' },
  { id: 'heal', label: 'ฮีลใจ & สมาธิ' },
  { id: 'learn', label: 'ศิลปะ & เวิร์กช็อป' },
];
/** Adds or removes one value in a comma-separated list */
const toggleInList = (list: string, value: string) => {
  const items = splitList(list);
  return (items.includes(value) ? items.filter((item) => item !== value) : [...items, value]).join(', ');
};
const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

interface VoucherInfo {
  code: string;
  issuedAt: string;
  usedAt: string | null;
  questTitle: string;
  rewardTitle: string;
  partnerName: string;
  memberName: string;
}
/** One choice in a rule, picked by its name */
function RuleChip({ label, isOn, onToggle }: { label: string; isOn: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isOn}
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${isOn ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
    >
      {isOn && <Check size={12} aria-hidden="true" />}
      {label}
    </button>
  );
}

const thaiDateTime = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

const EMPTY_DRAFT: QuestDraft = {
  title: '',
  badgeLabel: '',
  targetGoal: '',
  objective: '',
  category: 'social',
  total: '1',
  rewardPoints: '100',
  startDate: '',
  endDate: '',
  image: '',
  rewardType: 'hub_central',
  partnerName: '',
  rewardTitle: 'สะสม XP แลกของรางวัลที่ชอบ',
  voucherCodePrefix: '',
  exclusiveNotice: '',
  hubRewardNote: '',
  terms: '',
  ruleType: '',
  ruleEvidence: 'moment',
  ruleCategories: '',
  ruleKeywords: '',
  ruleProvinces: '',
  ruleTargetIds: '',
  ruleVibes: '',
};

// Stored dates may be Thai ("31 ธ.ค. 2569") or ISO; the date input needs ISO
function toIsoDate(value?: string): string {
  const timestamp = parseQuestDate(value, false);
  if (timestamp === null) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toPayload(draft: QuestDraft) {
  const isPartner = draft.rewardType === 'brand_partner';
  return {
    title: draft.title,
    badgeLabel: draft.badgeLabel,
    targetGoal: draft.targetGoal,
    objective: draft.objective.trim() || draft.targetGoal,
    category: draft.category,
    total: draft.total,
    rewardPoints: Number(draft.rewardPoints) || 0,
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    image: draft.image.trim() || undefined,
    brandReward: {
      type: draft.rewardType,
      title: draft.rewardTitle,
      partnerName: isPartner ? draft.partnerName : undefined,
      voucherCodePrefix: isPartner ? draft.voucherCodePrefix : undefined,
      exclusiveNotice: isPartner ? draft.exclusiveNotice : undefined,
      hubRewardNote: isPartner ? undefined : draft.hubRewardNote,
      terms: draft.terms,
    },
    // The target number above is how many different places or events must be visited; null removes the rule
    rule: draft.ruleType
      ? {
          targetTypes: [draft.ruleType],
          count: Math.max(1, Math.floor(Number(draft.total)) || 1),
          minEvidence: draft.ruleEvidence,
          categories: splitList(draft.ruleCategories),
          keywords: splitList(draft.ruleKeywords),
          provinces: splitList(draft.ruleProvinces),
          targetIds: splitList(draft.ruleTargetIds),
          vibes: draft.ruleType === 'spot' ? splitList(draft.ruleVibes) : [],
        }
      : null,
  };
}

/** The draft as a challenge, for the preview row: the dates decide whether it shows as running or coming up */
function previewQuest(draft: QuestDraft): ChallengeQuest {
  const payload = toPayload(draft);
  const now = Date.now();
  const start = parseQuestDate(payload.startDate, false);
  const end = parseQuestDate(payload.endDate, true);
  const day = 24 * 60 * 60 * 1000;
  return {
    ...(payload as unknown as ChallengeQuest),
    id: 'preview',
    title: payload.title || 'ชื่อชาเลนจ์',
    targetGoal: payload.targetGoal || 'สิ่งที่ต้องทำ',
    rule: payload.rule ?? undefined,
    image: payload.image,
    status: 'active',
    participantsCount: 0,
    daysRemaining: end !== null ? Math.max(0, Math.ceil((end - now) / day)) : undefined,
    startsInDays: start !== null && start > now ? Math.ceil((start - now) / day) : undefined,
  };
}

function describeTimeLeft(quest: ChallengeQuest): string | null {
  if (!quest.endDate) return null;
  if (quest.daysRemaining === 0) return `หมดเวลา ${quest.endDate}`;
  return `เหลือ ${quest.daysRemaining} วัน · ถึง ${quest.endDate}`;
}

const STATUS_LABELS: Record<QuestStatus, string> = {
  draft: 'แบบร่าง',
  active: 'เผยแพร่',
  ended: 'สิ้นสุด',
};

const STATUS_STYLES: Record<QuestStatus, string> = {
  draft: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ended: 'bg-slate-100 text-slate-600 border-slate-200',
};

async function fetchQuests(): Promise<ChallengeQuest[]> {
  const response = await fetch('/api/admin/quests?limit=100', { cache: 'no-store' });
  if (handleAdminUnauthorized(response)) {
    throw new Error('เซสชันผู้ดูแลหมดอายุ กำลังนำทางไปหน้าเข้าสู่ระบบ...');
  }
  const data = await response.json();
  if (!response.ok || !data.success || !Array.isArray(data.quests)) {
    throw new Error(data.error || 'Unable to load quests');
  }
  return data.quests;
}

export function QuestsManagerView() {
  const [quests, setQuests] = useState<ChallengeQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | QuestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuestDraft>(EMPTY_DRAFT);
  // Categories are managed under "หมวดหมู่" in this console
  const { questCategories, spotVibes } = useMasterData();
  // How many places or events the rule being written would count (POST action preview_rule), asked again shortly after each change
  const [rulePreview, setRulePreview] = useState<{ total: number; targets: { title: string; detail?: string }[] } | null>(null);
  const rulePayload = isDialogOpen ? JSON.stringify(toPayload(draft).rule) : 'null';
  useEffect(() => {
    if (rulePayload === 'null') return;
    let isCurrent = true;
    setRulePreview(null);
    const timer = setTimeout(() => {
      fetch('/api/admin/quests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview_rule', rule: JSON.parse(rulePayload) }) })
        .then((res) => res.json())
        .then((json) => {
          if (isCurrent && json?.success) setRulePreview({ total: json.total, targets: json.targets ?? [] });
        })
        .catch(() => {});
    }, 400);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [rulePayload]);
  // Reward codes members show at a partner brand
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<VoucherInfo | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  const sendVoucher = async (action: 'check_voucher' | 'use_voucher') => {
    if (!voucherCode.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherError(null);
    try {
      const response = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code: voucherCode }),
      });
      if (handleAdminUnauthorized(response)) return;
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'ตรวจรหัสไม่สำเร็จ');
      setVoucher(data.voucher);
    } catch (caught) {
      setVoucher(null);
      setVoucherError(caught instanceof Error ? caught.message : 'ตรวจรหัสไม่สำเร็จ');
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const loadQuests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setQuests(await fetchQuests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load quests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    fetchQuests()
      .then((items) => {
        if (isActive) setQuests(items);
      })
      .catch((loadError) => {
        if (isActive) setError(loadError instanceof Error ? loadError.message : 'Unable to load quests');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const getStatus = (quest: ChallengeQuest): QuestStatus => {
    if (quest.status) return quest.status;
    return quest.visibility === 'private' ? 'draft' : 'active';
  };

  const filteredQuests = quests.filter((quest) => {
    const matchesStatus = filter === 'all' || getStatus(quest) === filter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || `${quest.title} ${quest.badgeLabel} ${quest.targetGoal || ''}`.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setIsDialogOpen(true);
  };

  const openEdit = (quest: ChallengeQuest) => {
    setEditingId(quest.id);
    setDraft({
      title: quest.title,
      badgeLabel: quest.badgeLabel,
      targetGoal: quest.targetGoal || '',
      objective: quest.objective && quest.objective !== quest.targetGoal ? quest.objective : '',
      category: quest.category || 'social',
      total: quest.total || '1',
      rewardPoints: String(quest.rewardPoints || 0),
      startDate: toIsoDate(quest.startDate),
      endDate: toIsoDate(quest.endDate),
      image: quest.image || quest.badgeCoverImg || '',
      rewardType: quest.brandReward?.type || 'hub_central',
      partnerName: quest.brandReward?.type === 'brand_partner' ? quest.brandReward.partnerName : '',
      rewardTitle: quest.brandReward?.title || EMPTY_DRAFT.rewardTitle,
      voucherCodePrefix: quest.brandReward?.voucherCodePrefix || '',
      exclusiveNotice: quest.brandReward?.exclusiveNotice || '',
      hubRewardNote: quest.brandReward?.hubRewardNote || '',
      terms: quest.brandReward?.terms || '',
      ruleType: quest.rule?.targetTypes[0] || '',
      ruleEvidence: quest.rule?.minEvidence || 'marked',
      ruleCategories: quest.rule?.categories?.join(', ') || '',
      ruleVibes: quest.rule?.vibes?.join(', ') || '',
      ruleKeywords: quest.rule?.keywords?.join(', ') || '',
      ruleProvinces: quest.rule?.provinces?.join(', ') || '',
      ruleTargetIds: quest.rule?.targetIds?.join(', ') || '',
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const submitDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = editingId
        ? { action: 'update', id: editingId, updatedFields: toPayload(draft) }
        : { action: 'create', quest: toPayload(draft) };
      const response = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (handleAdminUnauthorized(response)) return;
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save quest');
      setNotice(editingId ? 'บันทึกการแก้ไขแล้ว' : 'สร้างแบบร่างภารกิจแล้ว');
      setIsDialogOpen(false);
      await loadQuests();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save quest');
    } finally {
      setIsSaving(false);
    }
  };

  const setQuestStatus = async (quest: ChallengeQuest, status: QuestStatus) => {
    setError(null);
    try {
      const response = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', id: quest.id, status }),
      });
      if (handleAdminUnauthorized(response)) return;
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update status');
      setNotice(`เปลี่ยนสถานะเป็น ${STATUS_LABELS[status]} แล้ว`);
      await loadQuests();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update status');
    }
  };

  const deleteQuest = async (quest: ChallengeQuest) => {
    if (!window.confirm(`ลบภารกิจ "${quest.title}"?`)) return;
    setError(null);
    try {
      const response = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: quest.id }),
      });
      if (handleAdminUnauthorized(response)) return;
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to delete quest');
      setNotice('ลบภารกิจแล้ว');
      await loadQuests();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete quest');
    }
  };

  const draftCount = quests.filter((quest) => getStatus(quest) === 'draft').length;
  const activeCount = quests.filter((quest) => getStatus(quest) === 'active').length;
  const endedCount = quests.filter((quest) => getStatus(quest) === 'ended').length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Zap}
        title="ชาเลนจ์ & ภารกิจ"
        description="จัดการภารกิจ รางวัล XP และเหรียญตรา"
        actions={
          <>
            <button type="button" onClick={loadQuests} disabled={isLoading} className={adminButton.secondary}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
            <button type="button" onClick={openCreate} className={adminButton.primary}>
              <Plus size={14} /> สร้างภารกิจ
            </button>
          </>
        }
      />

      <section aria-label="Quest summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'ทั้งหมด', value: quests.length, tone: 'text-slate-950' },
          { label: 'เผยแพร่', value: activeCount, tone: 'text-emerald-800' },
          { label: 'แบบร่าง', value: draftCount, tone: 'text-amber-800' },
          { label: 'สิ้นสุด', value: endedCount, tone: 'text-slate-600' },
        ].map((item) => (
          <div key={item.label} className="border-l-2 border-slate-300 py-1 pl-3">
            <p className={`text-2xl font-bold tabular-nums ${item.tone}`}>{isLoading ? '—' : item.value}</p>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4" aria-labelledby="voucher-check-title">
        <div>
          <h3 id="voucher-check-title" className="text-sm font-bold text-slate-900">ตรวจรหัสรางวัล</h3>
          <p className="text-xs font-medium text-slate-500">รหัสที่สมาชิกได้เมื่อทำชาเลนจ์ของแบรนด์ครบ ตรวจก่อนให้สิทธิ์ แล้วทำเครื่องหมายว่าใช้แล้ว</p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void sendVoucher('check_voucher');
          }}
        >
          <label className="block flex-1">
            <span className="sr-only">รหัสรางวัล</span>
            <input value={voucherCode} onChange={(event) => setVoucherCode(event.target.value)} placeholder="เช่น ARI-BREW-XXXXXXXX" autoComplete="off" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm uppercase focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <button type="submit" disabled={isCheckingVoucher || !voucherCode.trim()} className="h-10 whitespace-nowrap rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50">
            {isCheckingVoucher ? 'กำลังตรวจ…' : 'ตรวจรหัส'}
          </button>
        </form>
        {voucherError && <p role="alert" className="text-sm text-rose-700">{voucherError}</p>}
        {voucher && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${voucher.usedAt ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <div className="min-w-0 space-y-0.5">
              <p className="font-bold">{voucher.usedAt ? `ใช้ไปแล้วเมื่อ ${thaiDateTime(voucher.usedAt)}` : 'รหัสถูกต้อง ยังไม่เคยใช้'}</p>
              <p className="font-medium">{voucher.rewardTitle || voucher.questTitle}{voucher.partnerName ? ` · ${voucher.partnerName}` : ''}</p>
              <p className="text-xs font-medium">สมาชิก: {voucher.memberName} · ชาเลนจ์: {voucher.questTitle} · ออกรหัส {thaiDateTime(voucher.issuedAt)}</p>
            </div>
            {!voucher.usedAt && (
              <button type="button" disabled={isCheckingVoucher} onClick={() => void sendVoucher('use_voucher')} className="h-9 whitespace-nowrap rounded-md border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50">
                ทำเครื่องหมายว่าใช้แล้ว
              </button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="tablist" aria-label="กรองสถานะภารกิจ">
            {(['all', 'active', 'draft', 'ended'] as const).map((status) => (
              <button key={status} type="button" role="tab" aria-selected={filter === status} onClick={() => setFilter(status)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${filter === status ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {{ all: `ทั้งหมด ${quests.length}`, active: `เผยแพร่ ${activeCount}`, draft: `แบบร่าง ${draftCount}`, ended: `สิ้นสุด ${endedCount}` }[status]}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:w-72">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="ค้นหาภารกิจหรือเหรียญตรา" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>

        {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
        {error && <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1fr)_96px_minmax(140px,180px)_104px_168px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-500 md:grid">
            <span>ภารกิจ</span><span>หมวดหมู่</span><span>รางวัล</span><span>สถานะ</span><span className="text-right">จัดการ</span>
          </div>
          {isLoading ? (
            <div className="space-y-px" aria-label="กำลังโหลดภารกิจ">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}
            </div>
          ) : filteredQuests.length === 0 ? (
            <div className="flex items-center justify-between gap-4 px-4 py-6">
              <p className="text-sm text-slate-600">ไม่พบภารกิจที่ตรงกับตัวกรอง</p>
              <button type="button" onClick={() => { setFilter('all'); setSearchQuery(''); }} className="text-sm font-semibold text-blue-700 hover:text-blue-900">ล้างตัวกรอง</button>
            </div>
          ) : filteredQuests.map((quest) => {
            const status = getStatus(quest);
            return (
              <article key={quest.id} className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_96px_minmax(140px,180px)_104px_168px] md:items-center md:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="shrink-0 text-amber-600" />
                    <h2 className="truncate text-sm font-semibold text-slate-950">{quest.title}</h2>
                  </div>
                  <p className="mt-1 line-clamp-2 pl-[22px] text-xs leading-5 text-slate-600">{quest.targetGoal || 'ยังไม่มีคำอธิบายเป้าหมาย'}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-[22px]">
                    {quest.brandReward ? (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${quest.brandReward.type === 'brand_partner' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-purple-200 bg-purple-50 text-purple-800'}`}>
                        Official • {quest.brandReward.type === 'brand_partner' ? quest.brandReward.partnerName : 'Chill & Connect'}
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">ยังไม่ระบุประเภทรางวัล</span>
                    )}
                    {describeTimeLeft(quest) && <span className="text-[11px] font-semibold text-slate-500">{describeTimeLeft(quest)}</span>}
                  </div>
                </div>
                <span className="text-xs font-medium capitalize text-slate-700">{quest.category || 'ไม่ระบุ'}</span>
                <div className="min-w-0 text-xs text-slate-700">
                  <p className="font-bold tabular-nums">{quest.rewardPoints || 0} XP</p>
                  <p className="text-slate-500 line-clamp-2" title={quest.badgeLabel}>{quest.badgeLabel}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
                    {status === 'draft' ? <Clock3 size={12} /> : status === 'active' ? <Check size={12} /> : <Trophy size={12} />}
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                    {status === 'draft' && <button type="button" onClick={() => setQuestStatus(quest, 'active')} title="เผยแพร่ภารกิจ" aria-label={`เผยแพร่ ${quest.title}`} className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800">เผยแพร่</button>}
                    {status === 'active' && <button type="button" onClick={() => setQuestStatus(quest, 'ended')} title="สิ้นสุดภารกิจ" aria-label={`สิ้นสุด ${quest.title}`} className="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">ปิดภารกิจ</button>}
                    <button type="button" onClick={() => openEdit(quest)} title="แก้ไขภารกิจ" aria-label={`แก้ไข ${quest.title}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950"><Pencil size={14} /></button>
                    <button type="button" onClick={() => deleteQuest(quest)} title="ลบภารกิจ" aria-label={`ลบ ${quest.title}`} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={14} /></button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsDialogOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="quest-dialog-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="quest-dialog-title" className="text-lg font-bold text-slate-950">{editingId ? 'แก้ไขภารกิจ' : 'สร้างภารกิจแบบร่าง'}</h2>
                <p className="mt-1 text-xs text-slate-600">ภารกิจใหม่จะยังไม่ปรากฏต่อผู้ใช้จนกว่าจะเผยแพร่</p>
              </div>
              <button type="button" onClick={() => setIsDialogOpen(false)} aria-label="ปิดหน้าต่าง" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={submitDraft} className="space-y-4 p-5">
              <label className="block space-y-1.5 text-sm font-medium text-slate-800">ชื่อภารกิจ
                <input required minLength={5} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-800">เป้าหมาย
                <textarea required minLength={15} rows={3} value={draft.targetGoal} onChange={(event) => setDraft({ ...draft, targetGoal: event.target.value })} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-800">รายละเอียด (ไม่บังคับ)
                <textarea value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} rows={3} maxLength={600} placeholder="เล่าว่าชาเลนจ์นี้ชวนทำอะไร ทำไมน่าร่วม เหมาะกับใคร" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <span className="block text-xs font-medium text-slate-500">แสดงใต้หัวข้อ &quot;รายละเอียดชาเลนจ์&quot; ต่อจากเป้าหมาย</span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">ชื่อเหรียญตรา
                  <input required value={draft.badgeLabel} onChange={(event) => setDraft({ ...draft, badgeLabel: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">หมวดหมู่
                  <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as QuestCategory })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                    {questCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">รางวัล XP
                  <input required type="number" min="0" value={draft.rewardPoints} onChange={(event) => setDraft({ ...draft, rewardPoints: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>

              <fieldset className="space-y-3 border-t border-slate-200 pt-4">
                <legend className="text-sm font-bold text-slate-900">ระยะเวลา</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">วันเริ่มต้น
                    <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">วันสิ้นสุด
                    <input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </label>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500">ระบบจะเปลี่ยนเป็น &quot;สิ้นสุด&quot; เองเมื่อเลยวันสิ้นสุด และคำนวณจำนวนวันที่เหลือให้อัตโนมัติ</p>
              </fieldset>

              <fieldset className="space-y-3 border-t border-slate-200 pt-4">
                <legend className="text-sm font-bold text-slate-900">การนับความคืบหน้า</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">นับจาก
                    <select required value={draft.ruleType} onChange={(event) => setDraft({ ...draft, ruleType: event.target.value as QuestDraft['ruleType'], ruleCategories: '', ruleVibes: '' })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="" disabled>เลือกสิ่งที่ระบบจะนับ</option>
                      {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  {/* How many is part of the rule: it sits here, beside what is counted */}
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">ต้องไปให้ครบ
                    <span className="flex items-center gap-2">
                      <input required type="number" min="1" value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      <span className="shrink-0 text-sm text-slate-600">{draft.ruleType === 'spot' ? 'แห่ง' : draft.ruleType === 'fair' ? 'งาน' : 'ครั้ง'}</span>
                    </span>
                  </label>
                  {draft.ruleType && (
                    <label className="block space-y-1.5 text-sm font-medium text-slate-800">หลักฐานขั้นต่ำ
                      <select value={draft.ruleEvidence} onChange={(event) => setDraft({ ...draft, ruleEvidence: event.target.value as QuestDraft['ruleEvidence'] })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="marked">กด &quot;มาที่นี่แล้ว&quot;</option>
                        <option value="moment">แชร์โมเมนต์พร้อมรูป</option>
                        {draft.ruleType === 'community' && <option value="checkin">โฮสต์เช็กอินให้</option>}
                      </select>
                    </label>
                  )}
                </div>
                {draft.ruleType ? (
                  <>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500">นับเฉพาะที่ตรงทุกเงื่อนไขที่เลือก ส่วนที่ไม่ได้เลือกคือไม่จำกัด</p>
                    {draft.ruleType === 'spot' && (
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-slate-800">หมวดแบบที่สมาชิกเห็นในหน้าที่เที่ยว</p>
                        <div className="flex flex-wrap gap-1.5">
                          {spotVibes.map((vibe) => (
                            <RuleChip key={vibe.id} label={vibe.name} isOn={splitList(draft.ruleVibes).includes(vibe.id)} onToggle={() => setDraft({ ...draft, ruleVibes: toggleInList(draft.ruleVibes, vibe.id) })} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-slate-800">{draft.ruleType === 'spot' ? 'ประเภทสถานที่' : 'หมวดกิจกรรม'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(draft.ruleType === 'spot' ? SPOT_CATEGORY_OPTIONS : EVENT_CATEGORY_OPTIONS).map((option) => (
                          <RuleChip key={option.id} label={option.label} isOn={splitList(draft.ruleCategories).includes(option.id)} onToggle={() => setDraft({ ...draft, ruleCategories: toggleInList(draft.ruleCategories, option.id) })} />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block space-y-1.5 text-sm font-medium text-slate-800">จังหวัด
                        <input value={draft.ruleProvinces} onChange={(event) => setDraft({ ...draft, ruleProvinces: event.target.value })} placeholder="เช่น กรุงเทพฯ (คั่นด้วยจุลภาค)" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="block space-y-1.5 text-sm font-medium text-slate-800">คำในชื่อ (ตรงคำใดคำหนึ่ง)
                        <input value={draft.ruleKeywords} onChange={(event) => setDraft({ ...draft, ruleKeywords: event.target.value })} placeholder="เช่น ตลาด, hyrox" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="block space-y-1.5 text-sm font-medium text-slate-800 sm:col-span-2">เฉพาะรหัสเหล่านี้
                        <input value={draft.ruleTargetIds} onChange={(event) => setDraft({ ...draft, ruleTargetIds: event.target.value })} placeholder="รหัสสถานที่หรือกิจกรรม (ไม่บังคับ)" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      </label>
                    </div>
                    {/* What the rule counts right now, so a rule nobody can finish shows before it is saved */}
                    <div role="status" className={`rounded-md border px-3 py-2.5 text-sm ${rulePreview && rulePreview.total < Math.max(1, Number(draft.total) || 1) ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                      {!rulePreview ? (
                        'กำลังนับว่ามีกี่แห่งที่ตรงเงื่อนไข…'
                      ) : (
                        <>
                          <p className="font-semibold">
                            ตรงเงื่อนไข {rulePreview.total.toLocaleString()} {draft.ruleType === 'spot' ? 'แห่ง' : 'งาน'}
                            {rulePreview.total < Math.max(1, Number(draft.total) || 1) && ` น้อยกว่าที่ต้องไปให้ครบ (${draft.total}) สมาชิกจะทำไม่ครบ`}
                          </p>
                          {rulePreview.targets.length > 0 && (
                            <p className="mt-0.5 text-xs text-slate-600">เช่น {rulePreview.targets.map((target) => `${target.title}${target.detail ? ` (${target.detail})` : ''}`).join(', ')}</p>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500">ทุกชาเลนจ์ต้องมีวิธีที่ระบบตรวจได้ สมาชิกจึงจะได้ XP และรางวัลเมื่อทำครบ</p>
                )}
              </fieldset>

              <fieldset className="space-y-3 border-t border-slate-200 pt-4">
                <legend className="text-sm font-bold text-slate-900">ประเภทภารกิจ & รางวัล</legend>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="ประเภทภารกิจ">
                  {([['hub_central', 'ภารกิจกลางของ Hub'], ['brand_partner', 'ภารกิจพาร์ทเนอร์']] as const).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={draft.rewardType === value} onClick={() => setDraft({ ...draft, rewardType: value })} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold ${draft.rewardType === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {draft.rewardType === 'brand_partner' && (
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">ชื่อแบรนด์พาร์ทเนอร์
                    <input required value={draft.partnerName} onChange={(event) => setDraft({ ...draft, partnerName: event.target.value })} placeholder="เช่น Ari Specialty Coffee Club" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </label>
                )}
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">{draft.rewardType === 'brand_partner' ? 'สิทธิพิเศษจากแบรนด์' : 'รางวัลจาก Hub'}
                  <input required minLength={3} value={draft.rewardTitle} onChange={(event) => setDraft({ ...draft, rewardTitle: event.target.value })} placeholder={draft.rewardType === 'brand_partner' ? 'เช่น ฟรี Cold Brew 1 แก้ว (มูลค่า 140.-)' : ''} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                {draft.rewardType === 'brand_partner' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5 text-sm font-medium text-slate-800">คำนำหน้ารหัสคูปอง
                      <input value={draft.voucherCodePrefix} onChange={(event) => setDraft({ ...draft, voucherCodePrefix: event.target.value.toUpperCase() })} placeholder="เช่น ARI-BREW-" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="block space-y-1.5 text-sm font-medium text-slate-800">เงื่อนไขเฉพาะแบรนด์
                      <input value={draft.exclusiveNotice} onChange={(event) => setDraft({ ...draft, exclusiveNotice: event.target.value })} placeholder="เช่น ใช้ได้เฉพาะหน้าร้านทุกสาขา" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                  </div>
                ) : (
                  <label className="block space-y-1.5 text-sm font-medium text-slate-800">รายละเอียดรางวัล Hub
                    <input value={draft.hubRewardNote} onChange={(event) => setDraft({ ...draft, hubRewardNote: event.target.value })} placeholder="เช่น รับ XP Boosted XP ไปแลกของรางวัลที่ /rewards" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </label>
                )}
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">ข้อกำหนดการใช้สิทธิ์
                  <textarea rows={2} value={draft.terms} onChange={(event) => setDraft({ ...draft, terms: event.target.value })} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                <div className="space-y-1.5 text-sm font-medium text-slate-800">
                  <label htmlFor="quest-cover">รูปภาพปก (ไม่บังคับ)</label>
                  <ImageField id="quest-cover" value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} folder="quests" />
                </div>
              </fieldset>
              {/* The row as members will see it on /challenges (tapping it does nothing here) */}
              <section aria-label="ตัวอย่างบนหน้าชาเลนจ์" className="space-y-2 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-900">ตัวอย่างบนหน้าชาเลนจ์</p>
                <div className="pointer-events-none" aria-hidden="true">
                  <ChallengeList quests={[previewQuest(draft)]} joinedIds={[]} progress={[]} />
                </div>
              </section>
              {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50"><Check size={15} />{isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
