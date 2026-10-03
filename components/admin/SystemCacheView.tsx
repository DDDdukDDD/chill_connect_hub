'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  RefreshCw,
  Trash2,
  Activity,
  Clock,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { AdminPageHeader, adminButton } from './AdminUI';
import { CacheStats } from '@/lib/cache/types';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface TagInfo {
  tag: string;
  label: string;
  description: string;
}

interface ActiveTag {
  tag: string;
  count: number;
}

interface CacheApiResponse {
  success: boolean;
  stats: CacheStats;
  activeTags: ActiveTag[];
  supportedTags: TagInfo[];
  timestamp: string;
  error?: string;
}

export function SystemCacheView() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([]);
  const [supportedTags, setSupportedTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [flushingTag, setFlushingTag] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCacheData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/cache');
      if (handleAdminUnauthorized(res)) return;
      const data: CacheApiResponse = await res.json();
      if (data.success) {
        setStats(data.stats);
        setActiveTags(data.activeTags || []);
        setSupportedTags(data.supportedTags || []);
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแคช');
      }
    } catch (err) {
      console.error('Failed to load cache:', err);
      showToast('ไม่สามารถเชื่อมต่อระบบ Cache Engine ได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheData();
  }, [fetchCacheData]);

  const handleFlushAll = async () => {
    if (!confirm('ยืนยันล้าง L1 Memory Cache ทั้งหมดในระบบ? (ระบบจะโหลดข้อมูลใหม่เมื่อมีผู้เข้าชมครั้งถัดไป)')) return;
    try {
      setFlushingTag('all');
      const res = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flush_all' }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setStats(data.stats);
        fetchCacheData();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการล้างแคช');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setFlushingTag(null);
    }
  };

  const handleFlushTag = async (tag: string) => {
    try {
      setFlushingTag(tag);
      const res = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flush_tag', tag }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchCacheData();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการล้างแคช');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setFlushingTag(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Zap}
        title="Cache & Performance"
        description="แคช L1 ในหน่วยความจำของ server: อัตรา hit/miss และการล้างแคชรายหมวด"
        actions={
          <>
            <button onClick={fetchCacheData} disabled={isLoading} className={adminButton.secondary}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
            <button onClick={handleFlushAll} disabled={flushingTag === 'all'} className={adminButton.danger}>
              <Trash2 size={14} />
              {flushingTag === 'all' ? 'กำลังล้าง...' : 'ล้างแคชทั้งหมด'}
            </button>
          </>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">แคชในหน่วยความจำ</span>
            <Database size={16} className="text-[#4A7C59]" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats ? stats.size.toLocaleString() : '...'} <span className="text-sm font-normal text-slate-400">รายการ</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">L1 Memory Cache Store</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Hit Ratio</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats ? `${(stats.hitRatio * 100).toFixed(1)}%` : '...'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Hits: {stats ? stats.hits : 0} / Misses: {stats ? stats.misses : 0}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">TTL Default</span>
            <Clock size={16} className="text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            60 <span className="text-sm font-normal text-slate-400">วินาที</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Auto-refresh background</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Policy Eviction</span>
            <ShieldCheck size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">LRU + Tags</p>
          <p className="text-[11px] text-slate-400 mt-1">Max 1,000 Entries</p>
        </div>
      </div>

      {/* 1-Click Flush By Tag Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">1-Click Tag-Based Invalidation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกเคลียร์แคชเฉพาะส่วนที่ต้องการ โดยไม่กระทบต่อผู้ใช้งานในส่วนอื่น
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supportedTags.map((item) => {
            const activeEntry = activeTags.find((t) => t.tag === item.tag);
            const count = activeEntry ? activeEntry.count : 0;
            const isFlushing = flushingTag === item.tag;

            return (
              <div
                key={item.tag}
                className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                    <span className="px-1.5 py-0.5 bg-slate-200/70 text-slate-600 rounded text-[10px] font-mono">
                      tag: {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                  <p className="text-[11px] text-[#4A7C59] font-medium mt-1">
                    Cached entries: <span className="font-bold">{count}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleFlushTag(item.tag)}
                  disabled={isFlushing}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-2xs disabled:opacity-50"
                >
                  {isFlushing ? 'กำลังล้าง...' : 'ล้างแคช'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture Info Card */}
      <div className="bg-[#EBF3ED]/60 border border-[#4A7C59]/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4A7C59]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Zap size={16} className="text-[#4A7C59]" />
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            ระบบแคชแบบ Multi-Tier (Memory L1 + Stale-While-Revalidate)
          </p>
          <p>
            เมื่อมีการอัปเดตข้อมูลสถานที่, กิจกรรม, หรืองานแฟร์ผ่านหน้า Admin ระบบจะทำการ Invalidate แท็กที่เกี่ยวข้องอัตโนมัติ 
            ทำให้ผู้ใช้งานภายนอกได้รับข้อมูลอัปเดตทันทีโดยไม่ต้องรอ TTL หมดอายุ
          </p>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
