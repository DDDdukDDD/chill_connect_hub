'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Clock3, Pencil, Plus, RefreshCw, Search, Trash2, Trophy, X, Zap } from 'lucide-react';
import { AdminPageHeader, adminButton } from './AdminUI';
import { ChallengeQuest } from '@/data/mockData';
import { handleAdminUnauthorized } from './adminAuthUtils';

type QuestStatus = 'draft' | 'active' | 'ended';
type QuestCategory = 'heal' | 'move' | 'chill' | 'learn';

interface QuestDraft {
  title: string;
  badgeLabel: string;
  targetGoal: string;
  category: QuestCategory;
  total: string;
  rewardPoints: string;
}

const EMPTY_DRAFT: QuestDraft = {
  title: '',
  badgeLabel: '',
  targetGoal: '',
  category: 'chill',
  total: '1',
  rewardPoints: '100',
};

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
      category: quest.category || 'chill',
      total: quest.total || '1',
      rewardPoints: String(quest.rewardPoints || 0),
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
        ? { action: 'update', id: editingId, updatedFields: { ...draft, rewardPoints: Number(draft.rewardPoints) || 0 } }
        : { action: 'create', quest: { ...draft, rewardPoints: Number(draft.rewardPoints) || 0 } };
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
        title="Quests & Badges"
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
          <section role="dialog" aria-modal="true" aria-labelledby="quest-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-2xl">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">ชื่อเหรียญตรา
                  <input required value={draft.badgeLabel} onChange={(event) => setDraft({ ...draft, badgeLabel: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">หมวดหมู่
                  <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as QuestCategory })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="heal">ฮีลใจ</option><option value="move">แอคทีฟ</option><option value="chill">ชิลล์</option><option value="learn">เรียนรู้</option>
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">จำนวนเป้าหมาย
                  <input required type="number" min="1" value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-800">รางวัล XP
                  <input required type="number" min="0" value={draft.rewardPoints} onChange={(event) => setDraft({ ...draft, rewardPoints: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
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
