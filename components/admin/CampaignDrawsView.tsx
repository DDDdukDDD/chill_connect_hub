'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, RefreshCw } from 'lucide-react';
import { type DrawCampaign, type WinnerStatus, RESULTS_PATH, campaignDay } from '@/lib/campaigns/types';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';

const dateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '');

const STATUS: Record<WinnerStatus, { label: string; tone: string }> = {
  pending: { label: 'รอผู้โชคดียืนยัน', tone: 'bg-amber-50 text-amber-800' },
  claimed: { label: 'ยืนยันแล้ว รอทีมงานส่งรางวัล', tone: 'bg-blue-50 text-blue-800' },
  confirmed: { label: 'ส่งมอบแล้ว', tone: 'bg-emerald-50 text-emerald-800' },
  forfeited: { label: 'สละสิทธิ์', tone: 'bg-slate-100 text-slate-500' },
};

/**
 * The prize draw (owner 2026-11-04). Its one job: pick winners fairly, tell them, and see each prize through.
 * The order on screen is the order of the work: draw, check who came up, announce, then one winner at a time.
 */
export function CampaignDrawsView() {
  const { can } = useAdminSession();
  const canAct = can('content.edit');
  const [campaigns, setCampaigns] = useState<DrawCampaign[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns/draws', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'โหลดไม่สำเร็จ');
      setCampaigns(json.campaigns);
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

  const act = async (key: string, payload: Record<string, string>, confirmText: string, done: string) => {
    if (!window.confirm(confirmText)) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/campaigns/draws', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'ทำรายการไม่สำเร็จ');
      setNotice(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setBusy(null);
      void load();
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Gift}
        title="จับรางวัล"
        description="สุ่มผู้โชคดีจากรหัสสิทธิ์ ตรวจรายชื่อ ประกาศผล แล้วติดตามจนส่งมอบรางวัล"
        actions={
          <button type="button" onClick={() => void load()} className={adminButton.icon} aria-label="โหลดใหม่">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        }
      />
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      {!campaigns ? (
        <AdminEmptyState>{isLoading ? 'กำลังโหลด…' : 'ยังโหลดไม่ได้'}</AdminEmptyState>
      ) : campaigns.length === 0 ? (
        <AdminEmptyState>ยังไม่มีแคมเปญที่มีการจับรางวัล</AdminEmptyState>
      ) : (
        campaigns.map((campaign) => {
          const standing = campaign.winners.filter((w) => w.status !== 'forfeited');
          const waiting = standing.filter((w) => !w.announcedAt);
          const left = campaign.prizeCount - standing.length;
          const isOut = campaign.winners.some((w) => w.announcedAt);
          return (
            <section key={campaign.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{campaign.name}</h2>
                  <p className="text-sm text-slate-600">{campaign.prizeTitle} · {campaign.prizeCount} รางวัล</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    จบ {campaignDay(campaign.endDate)} · จับรางวัล {campaign.drawLabel} · ลุ้นได้ {campaign.entries.toLocaleString()} สิทธิ์
                    {isOut && (
                      <>
                        {' · '}
                        <a href={RESULTS_PATH} target="_blank" rel="noreferrer" className="font-semibold underline">ดูหน้าประกาศผล</a>
                      </>
                    )}
                  </p>
                </div>
                {canAct && (
                  <div className="flex flex-wrap gap-2">
                    {left > 0 && (
                      <button
                        type="button"
                        disabled={Boolean(campaign.refusal) || campaign.entries === 0 || busy !== null}
                        onClick={() =>
                          void act(
                            `draw:${campaign.id}`,
                            { action: 'draw', campaignId: campaign.id },
                            isOut ? `จับรางวัลใหม่ ${left} รางวัล? ประกาศผลแล้ว ผู้โชคดีคนใหม่จะได้รับแจ้งทันที ย้อนกลับไม่ได้` : `สุ่มผู้โชคดี ${left} รางวัล จาก ${campaign.entries.toLocaleString()} สิทธิ์? ยังไม่มีใครได้รับแจ้งจนกว่าจะกดประกาศผล`,
                            'สุ่มผู้โชคดีแล้ว'
                          )
                        }
                        className={adminButton.primary}
                      >
                        {busy === `draw:${campaign.id}` && <Loader2 size={14} className="animate-spin" />}
                        {isOut ? 'จับรางวัลใหม่' : 'สุ่มผู้โชคดี'}
                      </button>
                    )}
                    {waiting.length > 0 && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          void act(
                            `announce:${campaign.id}`,
                            { action: 'announce', campaignId: campaign.id },
                            `ประกาศผลและแจ้งผู้โชคดี ${waiting.length} คน กับผู้มีสิทธิ์ที่เหลือทุกคน? ส่งแล้วเรียกคืนไม่ได้`,
                            'ประกาศผลและแจ้งสมาชิกแล้ว'
                          )
                        }
                        className={adminButton.primary}
                      >
                        {busy === `announce:${campaign.id}` && <Loader2 size={14} className="animate-spin" />}
                        ประกาศผลและแจ้งผู้โชคดี
                      </button>
                    )}
                  </div>
                )}
              </div>

              {left > 0 && campaign.refusal && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">{campaign.refusal}</p>}
              {left > 0 && !campaign.refusal && campaign.entries === 0 && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">ยังไม่มีผู้มีสิทธิ์ลุ้น</p>}

              {campaign.winners.length > 0 && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {campaign.winners.map((winner) => {
                    const lapsed = winner.status === 'pending' && winner.claimBy && Date.parse(winner.claimBy) < Date.now();
                    const status = STATUS[winner.status];
                    return (
                      <li key={winner.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                            <span className="font-mono">{winner.code}</span>
                            <span>{winner.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${lapsed ? 'bg-rose-50 text-rose-700' : status.tone}`}>{lapsed ? 'เลยกำหนดยืนยัน' : status.label}</span>
                            {!winner.announcedAt && winner.status !== 'forfeited' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">ยังไม่ประกาศ</span>}
                          </p>
                          <p className="text-xs text-slate-600 tabular-nums">{[winner.email, winner.phone].filter(Boolean).join(' · ') || 'ไม่มีอีเมลหรือเบอร์โทร ติดต่อได้ทางแจ้งเตือนเท่านั้น'}</p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            สุ่มเมื่อ {dateTime(winner.drawnAt)} จาก {winner.poolSize.toLocaleString()} สิทธิ์
                            {winner.claimBy && winner.status === 'pending' && ` · ยืนยันภายใน ${dateTime(winner.claimBy)}`}
                            {winner.claimedAt && ` · ยืนยันเมื่อ ${dateTime(winner.claimedAt)}`}
                          </p>
                        </div>
                        {canAct && (
                          <div className="flex gap-2">
                            {winner.status === 'claimed' && (
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => void act(`confirm:${winner.id}`, { action: 'confirm', winnerId: winner.id, campaignId: campaign.id }, `ตรวจตัวตนแล้วและส่งมอบรางวัลให้ ${winner.code} แล้ว?`, 'บันทึกการส่งมอบแล้ว')}
                                className={adminButton.secondarySm}
                              >
                                ส่งมอบแล้ว
                              </button>
                            )}
                            {(winner.status === 'pending' || winner.status === 'claimed') && (
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => void act(`forfeit:${winner.id}`, { action: 'forfeit', winnerId: winner.id, campaignId: campaign.id }, `ให้ ${winner.code} สละสิทธิ์? ย้อนกลับไม่ได้ และคนนี้จะไม่ถูกจับอีก`, 'บันทึกการสละสิทธิ์แล้ว จับรางวัลใหม่ได้')}
                                className={adminButton.dangerSm}
                              >
                                สละสิทธิ์
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
