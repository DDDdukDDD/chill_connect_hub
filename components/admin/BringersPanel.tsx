'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Footprints } from 'lucide-react';
import type { Bringer, CreatorPost } from '@/lib/social/actionLog';

/**
 * "ใครพาเพื่อนออกไปได้มากที่สุด" (docs/TRACEABILITY.md, owner 2026-11-13): different people who joined, saved, went or
 * said "ไปกัน" after a member's post, profile or invitation, and how many saw their posts (one member once per post per
 * day). Tapping a name lists that member's posts. Used to find creators; counting began on 2026-11-13.
 */
const RANGES = [7, 30, 90] as const;

export function BringersPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [rows, setRows] = useState<Bringer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/admin/bringers?days=${days}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => alive && (json?.success ? setRows(json.bringers) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [days]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="bringers-title">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Footprints size={16} className="text-slate-500" aria-hidden="true" />
        <h2 id="bringers-title" className="text-sm font-bold text-slate-900">ใครพาเพื่อนออกไป และมีคนเห็นมากที่สุด</h2>
        <div className="ml-auto flex gap-1" role="group" aria-label="ช่วงเวลา">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                if (d === days) return;
                setRows(null);
                setOpenId(null);
                setDays(d);
              }}
              aria-pressed={days === d}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>
      {failed ? (
        <p className="px-4 py-6 text-sm text-slate-500">โหลดไม่สำเร็จ</p>
      ) : !rows ? (
        <div className="px-4 py-6 h-24 animate-pulse bg-slate-50" />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">ยังไม่มีข้อมูลในช่วงนี้ (เริ่มนับ 13 พ.ย. 2569)</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-semibold">สมาชิก</th>
                <th className="px-3 py-2 font-semibold text-right">พาไป (คน)</th>
                <th className="px-3 py-2 font-semibold text-right">ไปถึงจริง</th>
                <th className="px-3 py-2 font-semibold text-right">เข้าร่วม</th>
                <th className="px-3 py-2 font-semibold text-right">ตอบรับคำชวน</th>
                <th className="px-3 py-2 font-semibold text-right">บันทึก</th>
                <th className="px-3 py-2 font-semibold text-right">คนเห็น</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <React.Fragment key={r.memberId}>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === r.memberId ? null : r.memberId)}
                        aria-expanded={openId === r.memberId}
                        className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:underline cursor-pointer text-left"
                      >
                        {r.name || r.memberId}
                        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${openId === r.memberId ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{r.people}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.visits}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.joins}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.inviteYes}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.saves}</td>
                    <td className="px-3 py-2 text-right tabular-nums" title={r.postsSeen ? `จาก ${r.postsSeen} โพสต์` : undefined}>{r.views.toLocaleString()}</td>
                  </tr>
                  {openId === r.memberId && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-3">
                        <CreatorPosts memberId={r.memberId} days={days} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** One member's posts in the range: what each brought and how many saw it */
function CreatorPosts({ memberId, days }: { memberId: string; days: number }) {
  const [posts, setPosts] = useState<CreatorPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/admin/bringers?days=${days}&member=${encodeURIComponent(memberId)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => alive && (json?.success ? setPosts(json.posts) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [memberId, days]);

  const profile = (
    <a href={`/profile?id=${encodeURIComponent(memberId)}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-600 hover:underline">
      เปิดโปรไฟล์
    </a>
  );
  if (failed) return <p className="text-sm text-slate-500">โหลดไม่สำเร็จ</p>;
  if (!posts) return <div className="h-16 animate-pulse rounded-lg bg-slate-100" />;
  if (posts.length === 0) return <p className="text-sm text-slate-500">ไม่มีโพสต์ที่มีคนเห็นหรือพาคนไปในช่วงนี้ (คนนี้พาไปจากโปรไฟล์หรือคำชวน) · {profile}</p>;
  return (
    <div>
      <ul className="divide-y divide-slate-200">
        {posts.map((p) => (
          <li key={p.id} className="flex items-baseline gap-3 py-1.5 text-sm">
            <a href={`/moments/${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-slate-800 hover:underline">
              {p.caption.trim() || 'ไม่มีแคปชัน'}
            </a>
            {p.status !== 'published' && <span className="shrink-0 text-xs text-slate-500">ซ่อนอยู่</span>}
            <span className="shrink-0 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
            <span className="w-20 shrink-0 text-right tabular-nums text-xs"><b className="text-slate-900">{p.people}</b> พาไป</span>
            <span className="w-20 shrink-0 text-right tabular-nums text-xs text-slate-600">{p.views.toLocaleString()} เห็น</span>
          </li>
        ))}
      </ul>
      <div className="mt-2">{profile}</div>
    </div>
  );
}
