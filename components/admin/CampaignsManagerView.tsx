'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Megaphone, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { CampaignStrip } from '@/components/CampaignStrip';
import { type Campaign, type CampaignStats, bangkokToday, campaignDay, homeCampaignOf } from '@/lib/campaigns/types';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { ImageField } from './masterAdmin';

type AdminCampaign = Campaign & { live: boolean; stats: CampaignStats };
type QuestOption = { id: string; title: string; status?: string; startDate?: string; endDate?: string; rewardPoints: number };
type RewardOption = { id: string; title: string; costXp: number; drawLabel?: string };
type Role = 'none' | 'step' | 'extra';

const EMPTY: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
  id: '', name: '', eyebrow: '', headline: '', text: '', stripText: '', cta: 'ดูวิธีร่วมสนุก',
  startDate: bangkokToday(), endDate: bangkokToday(), prizeImage: '', rewardId: '', questIds: [], extraQuestIds: [], showOnHome: false, published: false,
};

/** Where a campaign stands today, in words staff use */
function phaseOf(campaign: Campaign): { label: string; tone: string } {
  const today = bangkokToday();
  if (!campaign.published) return { label: 'ฉบับร่าง', tone: 'bg-slate-100 text-slate-700' };
  if (today < campaign.startDate) return { label: 'ยังไม่เริ่ม', tone: 'bg-blue-50 text-blue-800' };
  if (today > campaign.endDate) return { label: 'จบแล้ว', tone: 'bg-slate-100 text-slate-500' };
  return { label: 'กำลังจัด', tone: 'bg-emerald-50 text-emerald-800' };
}

const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');

function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] sm:text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

function CampaignEditor({ entry, quests, rewards, homeNow, onClose, onSaved }: { entry: AdminCampaign | null; quests: QuestOption[]; rewards: RewardOption[]; homeNow: AdminCampaign | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState(() => (entry ? { ...entry, prizeImage: entry.prizeImage ?? '', rewardId: entry.rewardId ?? '' } : { ...EMPTY }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  const roleOf = (id: string): Role => (form.questIds.includes(id) ? 'step' : form.extraQuestIds.includes(id) ? 'extra' : 'none');
  const setRole = (id: string, role: Role) =>
    setForm((current) => ({
      ...current,
      questIds: role === 'step' ? [...current.questIds.filter((q) => q !== id), id] : current.questIds.filter((q) => q !== id),
      extraQuestIds: role === 'extra' ? [...current.extraQuestIds.filter((q) => q !== id), id] : current.extraQuestIds.filter((q) => q !== id),
    }));
  // Challenges in the campaign first (steps in their order), then the rest by start date
  const ordered = [...quests].sort((a, b) => {
    const rank = (q: QuestOption) => (form.questIds.includes(q.id) ? 0 : form.extraQuestIds.includes(q.id) ? 1 : 2);
    return rank(a) - rank(b) || form.questIds.indexOf(a.id) - form.questIds.indexOf(b.id) || (b.startDate ?? '').localeCompare(a.startDate ?? '');
  });

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', campaign: form }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      onSaved(`บันทึกแคมเปญ ${data.campaign.name} แล้ว`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const preview: Campaign = { ...form, createdAt: '', updatedAt: '', prizeImage: form.prizeImage || undefined, rewardId: form.rewardId || undefined };

  return (
    <AdminDrawer
      title={entry ? `แก้ไขแคมเปญ · ${entry.name}` : 'สร้างแคมเปญ'}
      subtitle={entry ? <span>id: {entry.id}</span> : 'บันทึกเป็นฉบับร่างก่อนได้ เปิดเผยแพร่เมื่อพร้อม'}
      onClose={onClose}
      preview={
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-1 text-[11px] sm:text-xs font-semibold text-slate-500">ตัวอย่างแถบบนหน้าแรก</p>
          <div className="pointer-events-none">
            <CampaignStrip campaign={preview} />
          </div>
        </div>
      }
      footer={
        <>
          {error && <p className="mr-auto text-sm font-semibold text-rose-700">{error}</p>}
          <button type="button" onClick={onClose} className={adminButton.secondary}>ยกเลิก</button>
          <button type="button" disabled={isSaving} onClick={save} className={adminButton.primary}>
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึก
          </button>
        </>
      }
    >
      <FormSection title="ข้อความ" hint='แคมเปญจับรางวัลต้องใช้คำว่า "ลุ้น" เสมอ ห้ามเขียน "รับฟรี"'>
        <Field label="ชื่อแคมเปญ (ทีมงานเห็น):" htmlFor="campaign-name" wide>
          <input id="campaign-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="ป้ายเล็กด้านบน:" htmlFor="campaign-eyebrow" hint="เช่น กิจกรรมเปิดตัว Chill & Connect">
          <input id="campaign-eyebrow" value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำบนปุ่ม:" htmlFor="campaign-cta">
          <input id="campaign-cta" value={form.cta} onChange={(e) => set('cta', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="พาดหัว:" htmlFor="campaign-headline" wide hint="เช่น แค่ออกไปใช้ชีวิต ก็ลุ้น iPhone Duo ฟรี">
          <input id="campaign-headline" value={form.headline} onChange={(e) => set('headline', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="บรรทัดรองบนหน้าแรก:" htmlFor="campaign-strip" wide>
          <input id="campaign-strip" value={form.stripText} onChange={(e) => set('stripText', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="คำอธิบายบนหน้าชาเลนจ์:" htmlFor="campaign-text" wide>
          <textarea id="campaign-text" rows={2} value={form.text} onChange={(e) => set('text', e.target.value)} className={fieldInputClass} />
        </Field>
      </FormSection>

      <FormSection title="ช่วงเวลาและการแสดงผล">
        <Field label="วันเริ่ม:" htmlFor="campaign-start">
          <input id="campaign-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={fieldInputClass} />
        </Field>
        <Field label="วันจบ:" htmlFor="campaign-end">
          <input id="campaign-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={fieldInputClass} />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-800">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} /> เผยแพร่ (ไม่ติ๊ก = ฉบับร่าง)
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.showOnHome} onChange={(e) => set('showOnHome', e.target.checked)} /> แสดงแถบบนหน้าแรกและหน้าชาเลนจ์
          </label>
        </div>
        {form.showOnHome && homeNow && homeNow.id !== form.id && (
          <p className="sm:col-span-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            หน้าแรกแสดงได้ทีละแคมเปญ ตอนนี้แสดง “{homeNow.name}” อยู่ ถ้าเปิดพร้อมกัน แคมเปญที่เริ่มทีหลังจะแสดงแทน
          </p>
        )}
      </FormSection>

      <FormSection title="ของรางวัล" hint="รูปพื้นขาวหรือพื้นใส สัดส่วนประมาณ 3:2 ต้องเป็นรูปที่เรามีสิทธิ์ใช้">
        <Field label="ของรางวัลในแคตตาล็อก:" htmlFor="campaign-reward" wide>
          <select id="campaign-reward" value={form.rewardId} onChange={(e) => set('rewardId', e.target.value)} className={fieldInputClass}>
            <option value="">ไม่มี</option>
            {rewards.map((r) => (
              <option key={r.id} value={r.id}>{r.title} · {r.costXp.toLocaleString()} XP{r.drawLabel ? ` · จับรางวัล ${r.drawLabel}` : ''}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <ImageField id="campaign-image" value={form.prizeImage ?? ''} onChange={(url) => set('prizeImage', url)} folder="campaign" />
        </div>
      </FormSection>

      <FormSection title="ชาเลนจ์ในแคมเปญ" hint="ขั้นตอนหลักแสดงเป็นลำดับ 1-2-3 บนป้ายแคมเปญ สะสมเพิ่มแสดงเป็นทางเลือกด้านล่าง">
        <ul className="sm:col-span-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {ordered.map((quest) => (
            <li key={quest.id} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{quest.title}</span>
                <span className="block text-[11px] text-slate-500">
                  {quest.startDate ? `${campaignDay(quest.startDate)} – ${campaignDay(quest.endDate)}` : 'ไม่กำหนดวัน'} · +{quest.rewardPoints} XP{quest.status === 'draft' ? ' · ฉบับร่าง' : ''}
                </span>
              </span>
              <select aria-label={`บทบาทของ ${quest.title}`} value={roleOf(quest.id)} onChange={(e) => setRole(quest.id, e.target.value as Role)} className="h-9 rounded-lg border border-slate-300 px-2 text-xs">
                <option value="none">ไม่อยู่ในแคมเปญ</option>
                <option value="step">ขั้นตอนหลัก {form.questIds.includes(quest.id) ? `#${form.questIds.indexOf(quest.id) + 1}` : ''}</option>
                <option value="extra">สะสมเพิ่ม</option>
              </select>
            </li>
          ))}
        </ul>
      </FormSection>
    </AdminDrawer>
  );
}

/**
 * Campaigns (owner 2026-10-25): what the home page strip and the /challenges banner say, when they run, the
 * challenges and prize behind them, and what each campaign brought in. Its one job: run a campaign and see if it works.
 */
export function CampaignsManagerView() {
  const { can } = useAdminSession();
  const canEdit = can('content.edit');
  const [data, setData] = useState<{ campaigns: AdminCampaign[]; quests: QuestOption[]; rewards: RewardOption[] } | null>(null);
  // The campaign guests see on the home strip today (same rule as the server), to warn about others marked for it
  const homeNow = data ? homeCampaignOf(data.campaigns) : null;
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCampaign | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'โหลดไม่สำเร็จ');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // One tap shows or hides the strip on the home page and /challenges, without opening the editor
  const toggleHome = async (campaign: AdminCampaign) => {
    const showOnHome = !campaign.showOnHome;
    const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', campaign: { ...campaign, showOnHome } }) });
    const json = await res.json();
    if (!json.success) setError(json.error || 'บันทึกไม่สำเร็จ');
    else setNotice(showOnHome ? `แสดงแถบ ${campaign.name} บนหน้าแรกและหน้าชาเลนจ์แล้ว` : `ซ่อนแถบ ${campaign.name} จากหน้าแรกและหน้าชาเลนจ์แล้ว`);
    void load();
  };

  const remove = async (campaign: AdminCampaign) => {
    if (!window.confirm(`ลบแคมเปญ "${campaign.name}"? ชาเลนจ์และของรางวัลยังอยู่ ลบเฉพาะแคมเปญ`)) return;
    const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: campaign.id }) });
    const json = await res.json();
    if (!json.success) setError(json.error || 'ลบไม่สำเร็จ');
    else setNotice(`ลบแคมเปญ ${campaign.name} แล้ว`);
    void load();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Megaphone}
        title="แคมเปญ"
        description="แถบโปรโมทบนหน้าแรก ป้ายบนหน้าชาเลนจ์ ชาเลนจ์และของรางวัลของแต่ละแคมเปญ พร้อมตัวเลขว่าแคมเปญได้ผลแค่ไหน"
        actions={
          <>
            <button type="button" onClick={() => void load()} className={adminButton.icon} aria-label="โหลดใหม่">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {canEdit && (
              <button type="button" onClick={() => setEditing(null)} className={adminButton.primary}>
                <Plus size={16} /> สร้างแคมเปญ
              </button>
            )}
          </>
        }
      />
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      {!data ? (
        <AdminEmptyState>{isLoading ? 'กำลังโหลด…' : 'ยังโหลดแคมเปญไม่ได้'}</AdminEmptyState>
      ) : data.campaigns.length === 0 ? (
        <AdminEmptyState>ยังไม่มีแคมเปญ</AdminEmptyState>
      ) : (
        data.campaigns.map((campaign) => {
          const phase = phaseOf(campaign);
          const s = campaign.stats;
          return (
            <section key={campaign.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{campaign.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${phase.tone}`}>{phase.label}</span>
                    {campaign.showOnHome &&
                      (homeNow && campaign.live && homeNow.id !== campaign.id ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">ไม่ได้แสดงบนหน้าแรก: “{homeNow.name}” แสดงอยู่</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">{homeNow?.id === campaign.id ? 'แสดงบนหน้าแรกอยู่' : 'แถบหน้าแรก'}</span>
                      ))}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{campaign.headline}</p>
                  <p className="text-xs text-slate-500">{campaignDay(campaign.startDate)} – {campaignDay(campaign.endDate)}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void toggleHome(campaign)} aria-pressed={campaign.showOnHome} className={adminButton.secondarySm}>
                      {campaign.showOnHome ? <EyeOff size={13} /> : <Eye size={13} />} {campaign.showOnHome ? 'ซ่อนแถบ' : 'แสดงแถบ'}
                    </button>
                    <button type="button" onClick={() => setEditing(campaign)} className={adminButton.secondarySm}><Pencil size={13} /> แก้ไข</button>
                    <button type="button" onClick={() => void remove(campaign)} className={adminButton.dangerSm}><Trash2 size={13} /> ลบ</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <Kpi label="สมัครใหม่ช่วงแคมเปญ" value={s.signups.toLocaleString()} />
                <Kpi label="ไปตี้แรกภายใน 14 วัน" value={percent(s.firstTeeWithin14Days, s.signups)} note={`${s.firstTeeWithin14Days} จาก ${s.signups} คน`} />
                <Kpi label="สมัครผ่านลิงก์ชวนเพื่อน" value={s.invited.toLocaleString()} note={`ไปตี้กับคนชวนแล้ว ${s.invitedActivated} คน`} />
                <Kpi label="แลกสิทธิ์ลุ้นรางวัล" value={s.entries.toLocaleString()} />
              </div>

              {s.quests.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] sm:text-xs font-semibold text-slate-500">
                        <th className="py-1.5 pr-3">ชาเลนจ์</th>
                        <th className="py-1.5 px-3 text-right">กดร่วม</th>
                        <th className="py-1.5 px-3 text-right">ทำสำเร็จ</th>
                        <th className="py-1.5 pl-3 text-right">อัตราสำเร็จ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {s.quests.map((q) => (
                        <tr key={q.id}>
                          <td className="py-1.5 pr-3 text-slate-800">{q.isStep && <span className="mr-1.5 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">หลัก</span>}{q.title}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">{q.joined.toLocaleString()}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">{q.finished.toLocaleString()}</td>
                          <td className="py-1.5 pl-3 text-right tabular-nums text-slate-600">{percent(q.finished, q.joined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}

      {editing !== undefined && data && (
        <CampaignEditor
          entry={editing}
          homeNow={homeNow}
          quests={data.quests}
          rewards={data.rewards}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setEditing(undefined);
            setNotice(message);
            void load();
          }}
        />
      )}
    </div>
  );
}
