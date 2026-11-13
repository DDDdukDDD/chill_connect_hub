'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Footprints } from 'lucide-react';
import type { Bringer, BringerSort, CreatorPost } from '@/lib/social/actionLog';
import type { OutboundTarget } from '@/lib/social/linkClicks';
import { LINK_KIND_LABELS, type LinkKind } from '@/lib/social/linkKinds';

/**
 * Creators and outbound taps on the admin dashboard (docs/TRACEABILITY.md, owner 2026-11-13).
 * ครีเอเตอร์: who brought people out (joined, saved, went, said "ไปกัน" after their post, profile or invitation) and how
 * many saw their posts; tapping a name lists that member's posts. ออกไปข้างนอก: where people left for a map, website,
 * tickets or LINE. Every list reads a daily table a page at a time (built to stay quick with hundreds of thousands of
 * members); creator numbers are rebuilt hourly. Counting began on 2026-11-13.
 */
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
type Tab = 'creators' | 'outbound';

const TYPE_LABEL: Record<OutboundTarget['type'], string> = { spot: 'ที่เที่ยว', fair: 'อีเวนต์', community: 'ตี้', challenge: 'ชาเลนจ์' };
const TYPE_PATH: Record<OutboundTarget['type'], string> = { spot: 'spots', fair: 'events', community: 'community', challenge: 'challenges' };

/** One page-at-a-time list: the first page on any change of `query`, then "ดูเพิ่ม" */
function usePaged<T>(query: string, key: 'bringers' | 'targets') {
  const [rows, setRows] = useState<T[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchPage = useCallback(
    (offset: number) =>
      fetch(`/api/admin/bringers?${query}&offset=${offset}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((json) => {
          if (!json?.success) throw new Error('failed');
          return { list: json[key] as T[], more: Boolean(json.hasMore) };
        }),
    [query, key]
  );
  useEffect(() => {
    let alive = true;
    fetchPage(0)
      .then(({ list, more }) => {
        if (!alive) return;
        setRows(list);
        setHasMore(more);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [fetchPage]);
  const more = () => {
    if (!rows || loadingMore) return;
    setLoadingMore(true);
    fetchPage(rows.length)
      .then(({ list, more: next }) => {
        setRows((current) => [...(current ?? []), ...list]);
        setHasMore(next);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  };
  const reset = () => {
    setRows(null);
    setFailed(false);
  };
  return { rows, hasMore, failed, loadingMore, more, reset };
}

export function BringersPanel() {
  const [tab, setTab] = useState<Tab>('creators');
  const [days, setDays] = useState<Range>(30);

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
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold cursor-pointer ${days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-4 border-b border-slate-100 px-4" role="tablist" aria-label="มุมมอง">
        {([['creators', 'ครีเอเตอร์'], ['outbound', 'กดออกไปข้างนอก']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 py-2 text-xs font-semibold cursor-pointer ${tab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'creators' ? <Creators key={days} days={days} /> : <Outbound key={days} days={days} />}
    </section>
  );
}

function Creators({ days }: { days: Range }) {
  const [sort, setSort] = useState<BringerSort>('people');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = usePaged<Bringer>(`days=${days}&sort=${sort}`, 'bringers');
  const sortBy = (next: BringerSort) => {
    if (next === sort) return;
    list.reset();
    setOpenId(null);
    setSort(next);
  };
  const sortHead = (id: BringerSort, label: string) => (
    <th className="px-3 py-2 text-right" aria-sort={sort === id ? 'descending' : 'none'}>
      <button type="button" onClick={() => sortBy(id)} className={`font-semibold cursor-pointer hover:text-slate-900 ${sort === id ? 'text-slate-900 underline underline-offset-4' : ''}`}>
        {label}
      </button>
    </th>
  );

  if (list.failed) return <p className="px-4 py-6 text-sm text-slate-500">โหลดไม่สำเร็จ</p>;
  if (!list.rows) return <div className="h-24 animate-pulse bg-slate-50" />;
  if (list.rows.length === 0) return <p className="px-4 py-6 text-sm text-slate-500">ยังไม่มีข้อมูลในช่วงนี้ (เริ่มนับ 13 พ.ย. 2569 · อัปเดตทุกชั่วโมง)</p>;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-semibold">สมาชิก</th>
              {sortHead('people', 'พาไป')}
              <th className="px-3 py-2 font-semibold text-right">ไปถึงจริง</th>
              <th className="px-3 py-2 font-semibold text-right">เข้าร่วม</th>
              <th className="px-3 py-2 font-semibold text-right">ตอบรับคำชวน</th>
              <th className="px-3 py-2 font-semibold text-right">บันทึก</th>
              <th className="px-3 py-2 font-semibold text-right">กดออกไป</th>
              <th className="px-3 py-2 font-semibold text-right">สมัครตาม</th>
              <th className="px-3 py-2 font-semibold text-right">เปิดลิงก์แชร์</th>
              {sortHead('views', 'คนเห็น')}
            </tr>
          </thead>
          <tbody>
            {list.rows.map((r) => (
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
                  <td className={`px-3 py-2 text-right tabular-nums ${sort === 'people' ? 'font-bold' : ''}`}>{r.people.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.visits.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.joins.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.inviteYes.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.saves.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.outbound.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.signups.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.shareOpens.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${sort === 'views' ? 'font-bold' : ''}`}>{r.views.toLocaleString()}</td>
                </tr>
                {openId === r.memberId && (
                  <tr className="bg-slate-50">
                    <td colSpan={10} className="px-4 py-3">
                      <CreatorPosts memberId={r.memberId} days={days} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter hasMore={list.hasMore} loading={list.loadingMore} onMore={list.more} note="นับคนละครั้งต่อวัน แล้วรวมทุกวันในช่วง · อัปเดตทุกชั่วโมง" />
    </div>
  );
}

function Outbound({ days }: { days: Range }) {
  const list = usePaged<OutboundTarget>(`days=${days}&view=outbound`, 'targets');
  if (list.failed) return <p className="px-4 py-6 text-sm text-slate-500">โหลดไม่สำเร็จ</p>;
  if (!list.rows) return <div className="h-24 animate-pulse bg-slate-50" />;
  if (list.rows.length === 0) return <p className="px-4 py-6 text-sm text-slate-500">ยังไม่มีคนกดออกไปข้างนอกในช่วงนี้ (เริ่มนับ 13 พ.ย. 2569)</p>;
  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {list.rows.map((t) => {
          const kinds = Object.entries(t.kinds)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .map(([kind, n]) => `${LINK_KIND_LABELS[kind as LinkKind] ?? kind} ${(n ?? 0).toLocaleString()}`);
          return (
            <li key={`${t.type}:${t.ref}`} className="flex items-baseline gap-3 px-4 py-2 text-sm">
              <span className="w-16 shrink-0 text-xs text-slate-500">{TYPE_LABEL[t.type]}</span>
              <span className="min-w-0 flex-1">
                <a href={`/${TYPE_PATH[t.type]}/${encodeURIComponent(t.ref)}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:underline">
                  {t.title}
                </a>
                <span className="block text-xs text-slate-500">{kinds.join(' · ')}</span>
              </span>
              <span className="shrink-0 tabular-nums font-bold text-slate-900">{t.total.toLocaleString()}</span>
            </li>
          );
        })}
      </ul>
      <ListFooter hasMore={list.hasMore} loading={list.loadingMore} onMore={list.more} note="ทุกคน รวมคนที่ไม่ได้ล็อกอิน ไม่เก็บว่าเป็นใคร" />
    </div>
  );
}

function ListFooter({ hasMore, loading, onMore, note }: { hasMore: boolean; loading: boolean; onMore: () => void; note: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-2.5">
      <span className="text-xs text-slate-500">{note}</span>
      {hasMore && (
        <button type="button" onClick={onMore} disabled={loading} className="ml-auto h-8 px-3 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50">
          {loading ? 'กำลังโหลด…' : 'ดูเพิ่ม'}
        </button>
      )}
    </div>
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
            <span className="w-20 shrink-0 text-right tabular-nums text-xs"><b className="text-slate-900">{p.people.toLocaleString()}</b> พาไป</span>
            <span className="w-20 shrink-0 text-right tabular-nums text-xs text-slate-600">{p.views.toLocaleString()} เห็น</span>
          </li>
        ))}
      </ul>
      <div className="mt-2">{profile}</div>
    </div>
  );
}
