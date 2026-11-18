'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { fieldInputClass } from './AdminDrawer';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface Found {
  id: string;
  displayName: string;
  email?: string;
  status?: string;
}

/** One search of members (name, email or id) through the members API; null when this account may not search members */
async function searchMembers(q: string, limit: number): Promise<Found[] | null> {
  const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}&status=active&page=1&limit=${limit}`, { cache: 'no-store' });
  if (handleAdminUnauthorized(res)) return [];
  if (res.status === 403) return null;
  const json = await res.json().catch(() => null);
  return Array.isArray(json?.members) ? json.members : [];
}

/**
 * The member account that runs a staff-made ตี้ (owner 2026-11-18: the ATM 5K run had none, so nobody could scan tickets).
 * The account picked checks people in, sees who joined and leads the ตี้ chat. The name shown on the ตี้ stays the
 * "ผู้จัด" field, so a staff account can run a ตี้ shown as "ทีม Chillwaa".
 */
export function HostPicker({ inputId, currentId, value, onChange }: { inputId?: string; currentId?: string; value: Found | null; onChange: (member: Found | null) => void }) {
  const [current, setCurrent] = useState<Found | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  // The account running it now, by name
  useEffect(() => {
    if (!currentId) return;
    let active = true;
    searchMembers(currentId, 1)
      .then((found) => active && setCurrent(found?.find((m) => m.id === currentId) ?? { id: currentId, displayName: currentId }))
      .catch(() => active && setCurrent({ id: currentId, displayName: currentId }));
    return () => {
      active = false;
    };
  }, [currentId]);

  const search = async () => {
    const q = query.trim();
    if (q.length < 2 || busy) return;
    setBusy(true);
    const found = await searchMembers(q, 6).catch(() => []);
    setBusy(false);
    if (found === null) return setDenied(true);
    setResults(found);
  };

  const shown = value ?? current;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">
        {shown ? (
          <>
            <span className="font-semibold text-slate-900">{shown.displayName}</span>
            {shown.email && <span className="text-slate-500"> · {shown.email}</span>}
            {value && currentId !== value.id && <span className="ml-2 text-xs font-semibold text-[#2563EB]">(ยังไม่บันทึก)</span>}
          </>
        ) : (
          <span className="font-semibold text-rose-600">ยังไม่มี: ไม่มีใครสแกนเช็กอินตี้นี้ได้</span>
        )}
        {value && (
          <button type="button" onClick={() => onChange(null)} className="ml-2 inline-flex items-center gap-0.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            <X size={12} /> ยกเลิก
          </button>
        )}
      </p>
      {denied ? (
        <p className="text-xs font-semibold text-rose-600">บัญชีนี้ไม่มีสิทธิ์ค้นหาสมาชิก ให้ทีมที่ดูแลสมาชิกตั้งโฮสต์ให้</p>
      ) : (
        <div className="flex gap-2">
          <input
            id={inputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="ค้นหาด้วยชื่อหรืออีเมลของสมาชิก"
            className={fieldInputClass}
          />
          <button type="button" onClick={() => void search()} disabled={query.trim().length < 2 || busy} className="shrink-0 inline-flex items-center gap-1 h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-white cursor-pointer">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} ค้นหา
          </button>
        </div>
      )}
      {results && (
        results.length === 0 ? (
          <p className="text-xs text-slate-500">ไม่พบสมาชิกที่ใช้งานอยู่ชื่อนี้</p>
        ) : (
          <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
            {results.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(member);
                    setResults(null);
                    setQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="block text-sm font-semibold text-slate-900">{member.displayName}</span>
                  <span className="block text-xs text-slate-500">{member.email || member.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
