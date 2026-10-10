'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { compressImage } from '@/lib/media/compressor';
import type { MasterCollection, MasterData, MasterEntry } from '@/lib/masterData';
import { fieldInputClass } from './AdminDrawer';
import { adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';

/** Loads all master data and exposes the admin actions; every view of "ข้อมูลหลัก" uses it. */
export function useMasterAdmin() {
  const { can } = useAdminSession();
  const canEdit = can('system.manage');
  const [data, setData] = useState<MasterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/master', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || 'โหลดข้อมูลหลักไม่สำเร็จ');
        if (active) setData(json);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลหลักไม่สำเร็จ'); });
    return () => { active = false; };
  }, [reloadToken]);

  const post = useCallback(async (body: Record<string, unknown>, success: string, busyKey: string) => {
    setBusy(busyKey);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (handleAdminUnauthorized(res)) return false;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || 'บันทึกไม่สำเร็จ');
      setError(null);
      setNotice(success);
      setReloadToken((token) => token + 1);
      return true;
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'บันทึกไม่สำเร็จ');
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  return {
    data,
    error,
    notice,
    busy,
    canEdit,
    setError,
    reload: () => setReloadToken((token) => token + 1),
    save: (collection: MasterCollection, item: Record<string, unknown>, label: string) =>
      post({ action: 'save', collection, item }, `บันทึก "${label}" แล้ว`, `save:${item.id ?? 'new'}`),
    setActive: (collection: MasterCollection, id: string, active: boolean, label: string) =>
      post({ action: 'set_active', collection, id, active }, `${active ? 'เปิด' : 'ปิด'}ใช้งาน "${label}" แล้ว`, `active:${id}`),
    remove: (collection: MasterCollection, id: string, label: string) =>
      post({ action: 'delete', collection, id }, `ลบ "${label}" แล้ว`, `delete:${id}`),
    reorder: (collection: MasterCollection, ids: string[]) =>
      post({ action: 'reorder', collection, ids }, 'จัดลำดับใหม่แล้ว', `reorder:${collection}`),
  };
}

/** Image URL field with an upload button (compressed to WebP in the browser, then /api/upload). */
export function ImageField({ id, value, onChange, folder }: { id: string; value: string; onChange: (url: string) => void; folder: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600 });
      const form = new FormData();
      form.append('file', compressed);
      form.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'อัปโหลดไม่สำเร็จ');
      onChange(json.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://... หรือ /images/..." className={fieldInputClass} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className={`${adminButton.secondary} shrink-0`}>
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} อัปโหลด
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) upload(file);
          }}
        />
      </div>
      {uploadError && <p className="text-[11px] font-semibold text-rose-600">{uploadError}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-28 w-full max-w-xs rounded-xl border border-slate-200 object-cover" />
      )}
    </div>
  );
}

interface MasterListRow {
  entry: MasterEntry;
  title: string;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  extra?: React.ReactNode;
}

/** Ordered list with move up/down, active switch, edit and (for non built-in entries) delete. */
export function MasterList({
  collection,
  rows,
  admin,
  onEdit,
  reorderable = true,
  allowDeactivate = true,
}: {
  collection: MasterCollection;
  rows: MasterListRow[];
  admin: ReturnType<typeof useMasterAdmin>;
  onEdit: (entry: MasterEntry) => void;
  reorderable?: boolean;
  /** Provinces stay active: content is stored against them */
  allowDeactivate?: boolean;
}) {
  const move = (index: number, delta: number) => {
    const ids = rows.map((row) => row.entry.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    admin.reorder(collection, ids);
  };

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
      {rows.map((row, index) => {
        const { entry } = row;
        const busy = admin.busy?.endsWith(`:${entry.id}`) || admin.busy === `reorder:${collection}`;
        return (
          <li key={entry.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 sm:px-4 ${entry.active ? '' : 'bg-slate-50/70'}`}>
            {reorderable && admin.canEdit && (
              <div className="flex flex-col">
                <button type="button" aria-label="เลื่อนขึ้น" disabled={index === 0 || busy} onClick={() => move(index, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={13} /></button>
                <button type="button" aria-label="เลื่อนลง" disabled={index === rows.length - 1 || busy} onClick={() => move(index, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={13} /></button>
              </div>
            )}
            {row.leading}
            <div className={`min-w-0 flex-1 ${entry.active ? '' : 'opacity-60'}`}>
              <p className="truncate text-sm font-bold text-slate-800">{row.title}</p>
              {row.subtitle && <div className="mt-0.5 truncate text-[11px] text-slate-500">{row.subtitle}</div>}
            </div>
            {row.extra}
            {allowDeactivate && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold ${entry.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                {entry.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
              </span>
            )}
            {entry.builtIn && allowDeactivate && <span className="text-[10px] font-semibold text-slate-400" title="มากับระบบ ลบไม่ได้ ปิดใช้งานได้">มากับระบบ</span>}
            {admin.canEdit && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onEdit(entry)} className={adminButton.icon} title="แก้ไข"><Pencil size={13} /></button>
                {allowDeactivate && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => admin.setActive(collection, entry.id, !entry.active, row.title)}
                    className={adminButton.secondarySm}
                  >
                    {entry.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </button>
                )}
                {!entry.builtIn && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { if (confirm(`ลบ "${row.title}"? ลบแล้วกู้คืนไม่ได้`)) admin.remove(collection, entry.id, row.title); }}
                    className={adminButton.icon}
                    title="ลบ"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function MasterNotices({ admin }: { admin: ReturnType<typeof useMasterAdmin> }) {
  return (
    <>
      {admin.error && <div role="alert" className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">{admin.error}</div>}
      {admin.notice && <div role="status" className="border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{admin.notice}</div>}
      {!admin.canEdit && <p className="text-xs text-slate-500">บัญชีนี้ดูได้อย่างเดียว การแก้ไขข้อมูลหลักต้องมีสิทธิ์ “ข้อมูลหลัก รูปภาพ cache”</p>}
    </>
  );
}
