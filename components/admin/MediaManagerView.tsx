'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  HardDrive,
  Sparkles,
  Search,
  Filter,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { StoredMediaFile, MediaStorageStats } from '@/lib/media/types';

interface MediaFileWithOrphan extends StoredMediaFile {
  isOrphan?: boolean;
}

interface MediaApiResponse {
  success: boolean;
  files: MediaFileWithOrphan[];
  stats: MediaStorageStats & {
    orphanCount: number;
    referencedDatabaseImages: number;
  };
  error?: string;
}

export function MediaManagerView() {
  const [files, setFiles] = useState<MediaFileWithOrphan[]>([]);
  const [stats, setStats] = useState<MediaApiResponse['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'orphan' | 'in_use'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/media');
      const data: MediaApiResponse = await res.json();
      if (data.success) {
        setFiles(data.files);
        setStats(data.stats);
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการโหลดไฟล์มีเดีย');
      }
    } catch (err) {
      console.error('Failed to load media:', err);
      showToast('ไม่สามารถเชื่อมต่อระบบจัดเก็บไฟล์มีเดียได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCopy = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    showToast('คัดลอกลิงก์รูปภาพแล้ว');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`ยืนยันการลบไฟล์ "${key}" ออกจาก Storage?`)) return;
    try {
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`ลบไฟล์ ${key} สำเร็จ`);
        fetchMedia();
      } else {
        showToast(data.error || 'ลบไฟล์ไม่สำเร็จ');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบไฟล์');
    }
  };

  const handleCleanOrphans = async () => {
    if (!confirm('ยืนยันลบไฟล์ที่ไม่มีการอ้างอิงในฐานข้อมูล (Orphan Files) ทั้งหมด?')) return;
    try {
      setIsCleaning(true);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clean_orphans' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchMedia();
      } else {
        showToast(data.error || 'ล้างไฟล์ขยะไม่สำเร็จ');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการทำความสะอาด');
    } finally {
      setIsCleaning(false);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterMode === 'all' ||
        (filterMode === 'orphan' && f.isOrphan) ||
        (filterMode === 'in_use' && !f.isOrphan);
      return matchesSearch && matchesFilter;
    });
  }, [files, searchQuery, filterMode]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={20} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">Media & Image Asset Hub</h1>
          </div>
          <p className="text-slate-500 text-sm">
            ศูนย์จัดการคลังไฟล์มีเดีย รูปภาพอัปโหลด และระบบตรวจจับไฟล์ขยะ (Orphan Files)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMedia}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#4A7C59]' : ''} />
            รีเฟรช
          </button>
          {stats && stats.orphanCount > 0 && (
            <button
              onClick={handleCleanOrphans}
              disabled={isCleaning}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isCleaning ? 'กำลังล้าง...' : `ล้างไฟล์ขยะ (${stats.orphanCount})`}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">พื้นที่จัดเก็บทั้งหมด</span>
            <HardDrive size={16} className="text-[#4A7C59]" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats ? formatBytes(stats.totalSizeBytes) : '...'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Driver: Local (public/uploads)</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">จำนวนไฟล์ทั้งหมด</span>
            <Layers size={16} className="text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats ? stats.totalFiles.toLocaleString() : '...'} <span className="text-sm font-normal text-slate-400">ไฟล์</span>
          </p>
          <p className="text-[11px] text-sky-600 font-medium mt-1">
            WebP format: {stats ? stats.webpFilesCount : 0} ไฟล์
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">ไฟล์ขยะ (Orphan)</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className={`text-2xl font-bold ${stats && stats.orphanCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {stats ? stats.orphanCount.toLocaleString() : '...'} <span className="text-sm font-normal text-slate-400">ไฟล์</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">ไม่มีการอ้างอิงในฐานข้อมูล</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">รูปภาพในระบบอ้างอิง</span>
            <FileCheck2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats ? stats.referencedDatabaseImages.toLocaleString() : '...'} <span className="text-sm font-normal text-slate-400">URLs</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Spots + Events + Fairs</p>
        </div>
      </div>

      {/* Orphan Notice Banner */}
      {stats && stats.orphanCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                พบไฟล์ขยะ {stats.orphanCount} ไฟล์ที่ไม่ได้ใช้งานในระบบ
              </p>
              <p className="text-xs text-amber-600/90 mt-0.5">
                ไฟล์เหล่านี้เกิดขึ้นจากการทดสอบอัปโหลดหรือกิจกรรมที่ถูกลบไปแล้ว สามารถเคลียร์ออกเพื่อคืนพื้นที่จัดเก็บได้
              </p>
            </div>
          </div>
          <button
            onClick={handleCleanOrphans}
            disabled={isCleaning}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            {isCleaning ? 'กำลังลบไฟล์...' : '🧹 ล้างไฟล์ขยะทั้งหมด'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์ หรือ key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-[#EBF3ED] text-[#2D5A3C]'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({files.length})
          </button>
          <button
            onClick={() => setFilterMode('in_use')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'in_use'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ใช้งานอยู่ ({files.filter((f) => !f.isOrphan).length})
          </button>
          <button
            onClick={() => setFilterMode('orphan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'orphan'
                ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ไฟล์ขยะ ({files.filter((f) => f.isOrphan).length})
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4A7C59]/30 border-t-[#4A7C59] rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/70 rounded-2xl">
          <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">ไม่พบไฟล์มีเดียในโฟลเดอร์</p>
          <p className="text-xs text-slate-400 mt-1">ไฟล์จะปรากฏที่นี่เมื่อมีการอัปโหลดภาพผ่านระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => {
            const isCopied = copiedKey === file.key;
            return (
              <div
                key={file.key}
                className={`group bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                  file.isOrphan ? 'border-amber-200/80' : 'border-slate-200/80'
                }`}
              >
                {/* Image Preview */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                    }}
                  />

                  {/* Status Tag */}
                  <div className="absolute top-2 left-2">
                    {file.isOrphan ? (
                      <span className="px-1.5 py-0.5 bg-amber-500/90 text-white rounded text-[10px] font-bold backdrop-blur-xs">
                        Orphan
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-600/90 text-white rounded text-[10px] font-bold backdrop-blur-xs">
                        In Use
                      </span>
                    )}
                  </div>

                  {/* Extension badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 bg-slate-900/60 text-white rounded text-[9px] font-semibold backdrop-blur-xs uppercase">
                      {file.mimeType.split('/')[1] || 'img'}
                    </span>
                  </div>
                </div>

                {/* File Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopy(file.url, file.key)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="คัดลอก URL"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="เปิดดูขนาดจริง"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => handleDelete(file.key)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                      title="ลบไฟล์"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
