'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  Radio,
  Activity,
  Plus,
  Trash2,
  Power,
  Database,
  Search,
  X,
  Compass,
} from 'lucide-react';
import { AdminPageHeader, AdminBadge, adminButton } from './AdminUI';
import { EventDataSource } from '@/lib/sourcesStore';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { MASTER_77_PROVINCES } from '@/data/masterHub';

interface ScrapeResultData {
  targetType: 'events' | 'spots';
  totalScanned: number;
  newCount: number;
  duplicateCount: number;
  duplicateDetails?: { rawTitle: string; reason: string }[];
  sourceResults: Array<{ sourceId: string; sourceName: string; scanned: number; imported: number; duplicates: number; error?: string }>;
}

export function ScraperEngineView() {
  const [sources, setSources] = useState<EventDataSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingSourceId, setScrapingSourceId] = useState<string | null>(null);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'events' | 'spots'>('events');
  const [isEnrichingSpots, setIsEnrichingSpots] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResultData | null>(null);
  // Province-based spot sources import one province per run
  const [spotProvince, setSpotProvince] = useState('');
  const [spotLimit, setSpotLimit] = useState(30);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Custom Source Form
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    targetType: 'events' as EventDataSource['targetType'],
    category: 'lifestyle' as EventDataSource['category'],
    categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
    icon: '🌐',
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ── Fetch Sources ──
  const fetchSources = async () => {
    try {
      setIsLoadingSources(true);
      const res = await fetch('/api/admin/sources');
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setIsLoadingSources(false);
    }
  };

  // ── Fetch Auto-Publish Status ──
  const fetchEventsConfig = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success && typeof data.autoPublish === 'boolean') {
        setAutoPublish(data.autoPublish);
      }
    } catch (err) {
      console.error('Failed to fetch events config:', err);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchEventsConfig();
  }, []);

  // ── Trigger Scrape ──
  const handleTriggerScrape = async (targetType: EventDataSource['targetType'], source?: EventDataSource) => {
    if (targetType === 'spots' && !spotProvince) {
      showToast('เลือกจังหวัดก่อนสแกน Spots');
      return;
    }
    try {
      setIsScraping(true);
      if (source) setScrapingSourceId(source.id);

      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetType === 'spots'
          ? { targetType, sourceId: source?.id, province: spotProvince, limit: spotLimit }
          : { targetType, sourceId: source?.id }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();

      if (res.ok && data.success) {
        const sourceResults = data.sourceResults || [];
        const failedSources = sourceResults.filter((result: ScrapeResultData['sourceResults'][number]) => result.error).length;
        setScrapeResult({
          targetType,
          totalScanned: data.totalScanned || (data.newCount + data.duplicateCount),
          newCount: data.newCount,
          duplicateCount: data.duplicateCount,
          duplicateDetails: data.duplicateDetails || [],
          sourceResults,
        });
        fetchSources();
        showToast(
          failedSources > 0
            ? `สแกนเสร็จ แต่มี ${failedSources} แหล่งที่อ่านไม่ได้ ดูรายละเอียดด้านล่าง`
            : data.newCount > 0
            ? `นำเข้า${targetType === 'spots' ? 'สถานที่' : 'อีเวนต์'}ใหม่ ${data.newCount} รายการ`
            : `สแกนเสร็จ: พบซ้ำ ${data.duplicateCount} รายการ`
        );
      } else {
        showToast(`❌ เกิดข้อผิดพลาด: ${data.error || 'ไม่สามารถสแกนได้'}`);
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Scraper');
    } finally {
      setIsScraping(false);
      setScrapingSourceId(null);
    }
  };

  // ── Toggle Source Status ──
  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        showToast(`🔄 อัปเดตสถานะแหล่งข้อมูลเป็น ${nextStatus === 'active' ? 'เปิดใช้งาน' : 'พักการดึง'}`);
      }
    } catch (err) {
      showToast('❌ ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  // ── Add Custom Source ──
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) {
      showToast('⚠️ กรุณาระบุชื่อและ URL ของแหล่งข้อมูล');
      return;
    }

    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        setShowAddModal(false);
        setNewSource({
          name: '',
          url: '',
          targetType: 'events',
          category: 'lifestyle',
          categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
          icon: '🌐',
          description: '',
        });
        showToast('🎉 เพิ่มแหล่งข้อมูลใหม่สำเร็จแล้ว!');
      } else {
        showToast(`❌ ${data.error}`);
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการเพิ่มแหล่งข้อมูล');
    }
  };

  // ── Delete Custom Source ──
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`ยืนยันการลบแหล่งข้อมูล "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        showToast('🗑️ ลบแหล่งข้อมูลเรียบร้อยแล้ว');
      }
    } catch (err) {
      showToast('❌ ไม่สามารถลบแหล่งข้อมูลได้');
    }
  };

  // ── Toggle Auto-Publish ──
  const handleToggleAutoPublish = async () => {
    const nextVal = !autoPublish;
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_publish', autoPublish: nextVal }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setAutoPublish(nextVal);
        showToast(
          nextVal
            ? '⚡ เปิดระบบ Auto-Publish: กิจกรรมที่ดูดมาจะอนุมัติขึ้นหน้าเว็บทันที'
            : '🛡️ ปิด Auto-Publish: กิจกรรมใหม่จะอยู่ในคิวรอตรวจสอบ (Pending Approval)'
        );
      }
    } catch (err) {
      showToast('❌ ไม่สามารถเปลี่ยนการตั้งค่าได้');
    }
  };

  // ── Reset & Seed Live Bangkok Events ──
  const handleResetAndSeed = async () => {
    if (!confirm('ต้องการรีเซ็ตและดึงข้อมูลอีเวนต์สดชุดใหญ่ (80+ รายการ) ใหม่ทั้งหมดใช่หรือไม่?')) return;
    try {
      setIsResetting(true);
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_and_seed' }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        fetchSources();
        showToast(`🎉 ${data.message}`);
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Spot Image AI Enricher ──
  const handleEnrichSpotImages = async () => {
    try {
      setIsEnrichingSpots(true);
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_enrich_images' }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        showToast(`✨ ${data.message}`);
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการเติมรูปภาพสถานที่');
    } finally {
      setIsEnrichingSpots(false);
    }
  };

  // Filtered Sources
  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus && s.targetType === sourceTypeFilter;
  });

  const eventSources = sources.filter((source) => source.targetType === 'events');
  const spotSources = sources.filter((source) => source.targetType === 'spots');
  const activeSources = sources.filter((source) => source.status === 'active' && source.targetType === sourceTypeFilter);
  const totalContentCount = sources
    .filter((source) => source.targetType === sourceTypeFilter)
    .reduce((total, source) => total + (sourceTypeFilter === 'spots' ? source.spotsCount || 0 : source.eventsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in max-w-md">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <AdminPageHeader
        icon={Bot}
        title="Scraper Engine"
        description="นำเข้า Event และ Spot จากแหล่งข้อมูลภายนอก พร้อมตรวจ robots.txt คัดข้อมูลไม่ครบ และกันรายการซ้ำ"
        badge={<AdminBadge>JSON-LD + ตัวอ่านเฉพาะเว็บ</AdminBadge>}
        actions={
          <>
            {sourceTypeFilter === 'spots' && (
              <>
                <select
                  value={spotProvince}
                  onChange={(event) => setSpotProvince(event.target.value)}
                  aria-label="จังหวัดที่จะสแกน"
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">เลือกจังหวัด</option>
                  {MASTER_77_PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  สูงสุด
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={spotLimit}
                    onChange={(event) => setSpotLimit(Math.min(100, Math.max(1, Number(event.target.value) || 1)))}
                    className="h-9 w-16 rounded-md border border-slate-300 px-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  แห่ง
                </label>
              </>
            )}
            {sourceTypeFilter === 'spots' && (
              <button
                onClick={handleEnrichSpotImages}
                disabled={isEnrichingSpots}
                className={adminButton.secondary}
                title="ใส่รูปตามหมวดหมู่ให้ Spot ที่ยังไม่มีรูป โดยไม่ดึงข้อมูลแหล่งใหม่"
              >
                <Compass size={14} className={isEnrichingSpots ? 'animate-spin' : ''} />
                {isEnrichingSpots ? 'กำลังเติมรูป...' : 'เติมรูปที่ขาด'}
              </button>
            )}
            {sourceTypeFilter === 'events' && (
              <button
                onClick={handleResetAndSeed}
                disabled={isResetting || isScraping}
                className={adminButton.secondary}
                title="รีเซ็ตชุด Event ตัวอย่างแบบคัดสรร (ไม่ใช่การดึงจากเว็บ)"
              >
                <Database size={14} className={isResetting ? 'animate-spin' : ''} />
                {isResetting ? 'กำลังโหลด...' : 'โหลดชุด Event ตัวอย่าง'}
              </button>
            )}
            <button
              onClick={() => handleTriggerScrape(sourceTypeFilter)}
              disabled={isScraping || isResetting || (sourceTypeFilter === 'spots' && !spotProvince)}
              title={sourceTypeFilter === 'spots' && !spotProvince ? 'เลือกจังหวัดก่อน' : undefined}
              className={adminButton.primary}
            >
              <Radio size={14} className={isScraping && !scrapingSourceId ? 'animate-pulse' : ''} />
              {isScraping && !scrapingSourceId
                ? `กำลังสแกน ${sourceTypeFilter === 'spots' ? 'Spots' : 'Events'}...`
                : sourceTypeFilter === 'spots'
                ? `สแกน Spots${spotProvince ? ` · ${spotProvince}` : ''}`
                : 'สแกน Event sources'}
            </button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'แหล่งข้อมูล', value: sourceTypeFilter === 'spots' ? spotSources.length : eventSources.length, unit: 'แห่ง', style: 'bg-sky-50 border-sky-100 text-[#2B527A]' },
          { label: 'กำลังใช้งาน', value: activeSources.length, unit: `/${sourceTypeFilter === 'spots' ? spotSources.length : eventSources.length}`, style: 'bg-[#EBF3ED] border-[#4A7C59]/15 text-[#4A7C59]' },
          { label: sourceTypeFilter === 'spots' ? 'Spots ที่นำเข้า' : 'Events ที่นำเข้า', value: totalContentCount, unit: 'รายการ', style: 'bg-amber-50 border-amber-100 text-amber-700' },
          ...(sourceTypeFilter === 'events' ? [{
            label: 'Auto-Publish Mode',
            value: autoPublish ? 'ON (อัตโนมัติ)' : 'OFF (รอตรวจ)',
            unit: '',
            style: autoPublish ? 'bg-[#EBF3ED] border-[#4A7C59]/20 text-[#2D5A3C]' : 'bg-slate-50 border-slate-200 text-slate-600',
          }] : [{
            label: 'สถานะนำเข้า',
            value: 'Draft first',
            unit: '',
            style: 'bg-amber-50 border-amber-200 text-amber-800',
          }]),
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3.5 ${s.style}`}>
            <p className="text-2xl font-bold">
              {s.value} <span className="text-xs font-normal opacity-70">{s.unit}</span>
            </p>
            <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scrape Result Banner / Modal Alert */}
      {scrapeResult && (
        <div className="bg-white border-2 border-[#4A7C59]/30 rounded-2xl p-5 shadow-md animate-fade-in relative">
          <button
            onClick={() => setScrapeResult(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <CheckCircle2 size={20} className="text-[#4A7C59]" />
            <h3 className="text-base font-bold text-slate-800">ผลสแกน {scrapeResult.targetType === 'spots' ? 'Spot sources' : 'Event sources'}</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-[11px] font-semibold uppercase">สแกนทั้งหมด</p>
              <p className="text-xl font-bold text-slate-700">{scrapeResult.totalScanned}</p>
            </div>
            <div className="bg-[#EBF3ED] border border-[#4A7C59]/20 rounded-xl p-3 text-center">
              <p className="text-[#4A7C59] text-[11px] font-semibold uppercase">นำเข้าใหม่</p>
              <p className="text-xl font-bold text-[#2D5A3C]">+{scrapeResult.newCount}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-amber-700 text-[11px] font-semibold uppercase">ข้ามที่ซ้ำ (Deduplicated)</p>
              <p className="text-xl font-bold text-amber-800">{scrapeResult.duplicateCount}</p>
            </div>
          </div>

          {scrapeResult.sourceResults.length > 0 && (
            <div className="space-y-1.5">
              {scrapeResult.sourceResults.map((result) => (
                <div key={result.sourceId} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs last:border-0">
                  <span className="font-semibold text-slate-700">{result.sourceName}</span>
                  <span className={result.error ? 'text-rose-700' : 'text-slate-500'}>
                    {result.error ? `ผิดพลาด · ${result.error}` : `พบ ${result.scanned} · ใหม่ ${result.imported} · ซ้ำ ${result.duplicates}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {scrapeResult.duplicateDetails && scrapeResult.duplicateDetails.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold text-slate-500 mb-2">🔍 รายการที่ระบบคัดกรองข้าม (Duplicate Protection):</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                {scrapeResult.duplicateDetails.slice(0, 10).map((dup, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                    <span className="text-slate-700 font-medium truncate flex-1 mr-2">{dup.rawTitle}</span>
                    <span className="text-amber-600 text-[11px] shrink-0">{dup.reason}</span>
                  </div>
                ))}
                {scrapeResult.duplicateDetails.length > 10 && (
                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    ...และอีก {scrapeResult.duplicateDetails.length - 10} รายการที่ซ้ำ
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engine Controls & Settings Bar */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        {sourceTypeFilter === 'events' && <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#2B527A]" />
            <span className="text-slate-700 text-xs font-bold">Auto-Publish Mode:</span>
          </div>
          <button
            onClick={handleToggleAutoPublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoPublish
                ? 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/30'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Power size={11} className={autoPublish ? 'text-[#4A7C59]' : 'text-slate-400'} />
            {autoPublish ? 'เปิดใช้งาน (Auto-Approve)' : 'ปิด (Moderate First)'}
          </button>
        </div>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className={adminButton.dark}
          >
            <Plus size={14} />
            เพิ่มแหล่งข้อมูล
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อแหล่งข้อมูล, URL หรือหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 shadow-xs"
          />
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="ประเภทแหล่งข้อมูล">
          {([
            { id: 'events', label: `Events (${eventSources.length})` },
            { id: 'spots', label: `Spots (${spotSources.length})` },
          ] as const).map((target) => (
            <button
              key={target.id}
              type="button"
              role="tab"
              aria-selected={sourceTypeFilter === target.id}
              onClick={() => setSourceTypeFilter(target.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${sourceTypeFilter === target.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {target.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {{ all: 'ทั้งหมด', active: 'Active', inactive: 'Inactive' }[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      {isLoadingSources ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4A7C59]/30 border-t-[#4A7C59] rounded-full animate-spin" />
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-l-2 border-slate-300 bg-white px-4 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {sourceTypeFilter === 'spots' && !spotSources.length ? 'ยังไม่มีแหล่งข้อมูล Spot' : 'ไม่พบแหล่งข้อมูลที่ตรงกับเงื่อนไข'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {sourceTypeFilter === 'spots' && !spotSources.length
                ? 'เพิ่มหน้าเว็บที่มี Schema.org Place JSON-LD และอนุญาตการเก็บข้อมูลตาม robots.txt'
                : 'ลองเปลี่ยนคำค้นหาหรือสถานะ'}
            </p>
          </div>
          {sourceTypeFilter === 'spots' && !spotSources.length && (
            <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]">
              <Plus size={14} /> เพิ่ม Spot source
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSources.map((source) => {
            const isThisScraping = isScraping && scrapingSourceId === source.id;
            const isActive = source.status === 'active';

            return (
              <div
                key={source.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm ${
                  isActive ? 'border-slate-200/80 hover:border-[#4A7C59]/30' : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Source Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                      {source.icon || '🌐'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h3 className="text-slate-800 font-bold text-sm leading-tight">{source.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </span>
                        {source.isCustom && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Custom Source
                          </span>
                        )}
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${source.targetType === 'spots' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
                          {source.targetType === 'spots' ? 'Spot source' : 'Event source'}
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed mb-2">
                        {source.description || source.categoryLabel}
                      </p>

                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#2B527A] flex items-center gap-1 transition-colors text-[11px]"
                        >
                          <ExternalLink size={10} />
                          {source.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock size={10} /> {source.lastRunAt ? `สแกนล่าสุด ${new Date(source.lastRunAt).toLocaleString('th-TH')}` : 'ยังไม่เคยสแกน'}
                        </span>
                        {source.lastRunStatus && <span className={`text-[11px] font-semibold ${source.lastRunStatus === 'failed' ? 'text-rose-700' : source.lastRunStatus === 'partial' ? 'text-amber-700' : 'text-emerald-700'}`}>{source.lastRunStatus}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-4 shrink-0 self-center sm:self-start">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">
                        {source.targetType === 'spots' ? source.spotsCount || 0 : source.eventsCount || 0} {source.targetType === 'spots' ? 'Spots' : 'Events'}
                      </p>
                      <p className="text-[10px] text-slate-400">ในระบบ</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(source.id, source.status)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isActive
                            ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                            : 'bg-[#EBF3ED] border-[#4A7C59]/20 text-[#2D5A3C] hover:bg-[#4A7C59] hover:text-white'
                        }`}
                        title={isActive ? 'พักการดึงข้อมูล (Deactivate)' : 'เปิดใช้งาน (Activate)'}
                      >
                        <Power size={13} />
                      </button>

                      <button
                        onClick={() => handleTriggerScrape(source.targetType, source)}
                        disabled={isScraping || !isActive}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-[#EBF3ED] border border-slate-200 hover:border-[#4A7C59]/30 text-slate-600 hover:text-[#2D5A3C] rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        title="สั่งดึงข้อมูลจากแหล่งนี้เดี๋ยวนี้"
                      >
                        <RefreshCw size={11} className={isThisScraping ? 'animate-spin text-[#4A7C59]' : ''} />
                        {isThisScraping ? 'กำลังสแกน...' : 'สแกน'}
                      </button>

                      {source.isCustom && (
                        <button
                          onClick={() => handleDeleteSource(source.id, source.name)}
                          className="p-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="ลบแหล่งข้อมูล"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-800">เพิ่มแหล่งข้อมูลใหม่ (Add Custom Source)</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  ชื่อแหล่งข้อมูล *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Eventpop / The Concert / ThaiRun"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  URL เว็บไซต์ *
                </label>
                <input
                  type="url"
                  required
                  placeholder={newSource.targetType === 'spots' ? 'https://... (Place JSON-LD)' : 'https://... (Event JSON-LD)'}
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  ประเภทข้อมูลที่ต้องการนำเข้า
                </label>
                <select
                  aria-label="ประเภทข้อมูลที่ต้องการนำเข้า"
                  value={newSource.targetType}
                  onChange={(e) => {
                    const targetType = e.target.value as EventDataSource['targetType'];
                    setNewSource({
                      ...newSource,
                      targetType,
                      categoryLabel: targetType === 'spots' ? 'สถานที่ท่องเที่ยวและจุดแวะพัก' : '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                >
                  <option value="events">Events / meetups / fairs</option>
                  <option value="spots">Spots / places</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">รองรับหน้าเว็บที่เปิดเผย Schema.org JSON-LD และอนุญาตตาม robots.txt</p>
              </div>

              <div className={`grid gap-3 ${newSource.targetType === 'events' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {newSource.targetType === 'events' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                    หมวดหมู่ Event
                  </label>
                  <select
                    aria-label="หมวดหมู่ Event"
                    value={newSource.category}
                    onChange={(e) => {
                      const cat = e.target.value as EventDataSource['category'];
                      const labels: Record<string, string> = {
                        sports: '⚽ กีฬา & แมตช์การแข่งขัน',
                        music: '🎵 คอนเสิร์ต & ดนตรีสด',
                        exhibition: '🏛️ มหกรรมเอ็กซ์โป & นิทรรศการ',
                        running: '🏃 งานวิ่ง & มาราธอน',
                        lifestyle: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
                        finance: '📈 สัมมนา & การลงทุน',
                      };
                      setNewSource({
                        ...newSource,
                        category: cat,
                        categoryLabel: labels[cat] || '🌐 เว็บไซต์อีเวนต์',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                  >
                    <option value="lifestyle">🎟️ ไลฟ์สไตล์ & เวิร์กช็อป</option>
                    <option value="music">🎵 ดนตรี & คอนเสิร์ต</option>
                    <option value="exhibition">🏛️ เอ็กซ์โป & นิทรรศการ</option>
                    <option value="running">🏃 งานวิ่ง & สปอร์ต</option>
                    <option value="sports">⚽ กีฬา & บอลไทย</option>
                    <option value="finance">📈 การเงิน & สัมมนา</option>
                  </select>
                </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                    ไอคอนแสดงผล
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 🎟️ / 🏃 / 🏛️"
                    value={newSource.icon}
                    onChange={(e) => setNewSource({ ...newSource, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                  คำอธิบายแหล่งข้อมูล
                </label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดประเภทของกิจกรรมที่ดึง..."
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-[#4A7C59]/50"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${adminButton.primary}`}
                >
                  บันทึกแหล่งข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
