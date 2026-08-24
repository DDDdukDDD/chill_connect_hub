'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminEventItem } from '@/lib/eventsStore';
import { EventDataSource } from '@/lib/sourcesStore';
import { BANGKOK_ZONES } from '@/data/mockData';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Plus,
  Eye,
  Check,
  X,
  Trophy,
  Database,
  Radio,
  Server,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPage() {
  const [activeMainTab, setActiveMainTab] = useState<'events' | 'sources'>('events');
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [sources, setSources] = useState<EventDataSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapingSourceId, setScrapingSourceId] = useState<string | null>(null);
  const [autoPublish, setAutoPublishState] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'all' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<AdminEventItem | null>(null);

  // Add Custom Source Modal State
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [newSourceForm, setNewSourceForm] = useState<{
    name: string;
    url: string;
    category: 'sports' | 'music' | 'exhibition' | 'running' | 'finance' | 'lifestyle';
    categoryLabel: string;
    icon: string;
    description: string;
  }>({
    name: '',
    url: '',
    category: 'lifestyle',
    categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
    icon: '🌐',
    description: '',
  });

  // Scrape Audit Result Modal State
  const [scrapeResult, setScrapeResult] = useState<{
    totalScanned: number;
    newCount: number;
    duplicateCount: number;
    duplicateDetails: { rawTitle: string; reason: string }[];
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all admin events
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        setAutoPublishState(data.autoPublish);
        const hasPending = data.events.some((e: any) => e.approvalStatus === 'pending');
        if (!hasPending) {
          setSelectedTab('all');
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data sources
  const fetchSources = async () => {
    try {
      const res = await fetch('/api/admin/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to fetch data sources:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSources();
  }, []);

  // Trigger Scraper (All or Specific Source)
  const handleTriggerScrape = async (sourceName?: string, sourceId?: string) => {
    try {
      setIsScraping(true);
      if (sourceId) setScrapingSourceId(sourceId);

      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceName }),
      });
      const data = await res.json();

      if (data.success) {
        setEvents(data.events);
        fetchSources(); // refresh timestamps

        // Set detailed audit report modal
        setScrapeResult({
          totalScanned: data.totalScanned || (data.newCount + data.duplicateCount),
          newCount: data.newCount,
          duplicateCount: data.duplicateCount,
          duplicateDetails: data.duplicateDetails || [],
        });

        showToast(`🤖 ${data.message}`);
        if (data.newCount > 0 && !autoPublish) {
          setSelectedTab('pending');
        }
      } else {
        showToast('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (err) {
      showToast('ไม่สามารถเชื่อมต่อระบบ Scraper ได้');
    } finally {
      setIsScraping(false);
      setScrapingSourceId(null);
    }
  };

  // Add Custom Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceForm.name.trim() || !newSourceForm.url.trim()) {
      showToast('กรุณากรอกชื่อและ URL ของแหล่งข้อมูล');
      return;
    }

    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSourceForm),
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        setShowAddSourceModal(false);
        setNewSourceForm({
          name: '',
          url: '',
          category: 'lifestyle',
          categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
          icon: '🌐',
          description: '',
        });
        showToast(`✅ ${data.message}`);
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการเพิ่มแหล่งข้อมูล');
      }
    } catch (err) {
      showToast('ไม่สามารถเชื่อมต่อระบบจัดการแหล่งข้อมูลได้');
    }
  };

  // Toggle Source Status (Active / Inactive)
  const handleToggleSourceStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        showToast(`⚡ ${data.message}`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // Delete Custom Source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`ยืนยันการลบแหล่งข้อมูล "${name}" ออกจากระบบ?`)) return;
    try {
      const res = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
        showToast(`🗑️ ${data.message}`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Approve / Reject Event
  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast(newStatus === 'approved' ? '✅ อนุมัติขึ้นหน้าเว็บเรียบร้อย!' : 'ย้ายไปสถานะที่เลือกแล้ว');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  // Approve All Pending
  const handleApproveAll = async () => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all' }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast('⚡ อนุมัติกิจกรรมที่รอดำเนินการทั้งหมดเรียบร้อยแล้ว!');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอนุมัติทั้งหมด');
    }
  };

  // Reset & Fresh Seed All Events
  const handleResetAndSeed = async () => {
    if (!confirm('ต้องการรีเซ็ตและดึงข้อมูลอีเวนต์สดชุดใหญ่ (80+ รายการ) ใหม่ทั้งหมดใช่หรือไม่?')) return;
    try {
      setIsScraping(true);
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_and_seed' }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        setSelectedTab('all'); // Show all 80+ loaded events immediately
        fetchSources();
        showToast(`🎉 ${data.message}`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
    } finally {
      setIsScraping(false);
    }
  };

  // Delete Event
  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบกิจกรรมนี้ออกจากระบบ?')) return;
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast('🗑️ ลบกิจกรรมออกจากระบบแล้ว');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Toggle Auto-publish
  const handleToggleAutoPublish = async () => {
    const nextVal = !autoPublish;
    setAutoPublishState(nextVal);
    try {
      await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_publish', autoPublish: nextVal }),
      });
      showToast(nextVal ? '⚡ เปิดโหมด Auto-publish (งานใหม่จะอนุมัติทันที)' : 'ปิดโหมด Auto-publish (ต้องกดยืนยันก่อน)');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Edit Event
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_fields',
          id: editingEvent.id,
          updatedFields: editingEvent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        setEditingEvent(null);
        showToast('💾 บันทึกการแก้ไขข้อมูลเรียบร้อย!');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const pending = events.filter((e) => e.approvalStatus === 'pending').length;
    const approved = events.filter((e) => e.approvalStatus === 'approved').length;
    const rejected = events.filter((e) => e.approvalStatus === 'rejected').length;
    return {
      total: events.length,
      pending,
      approved,
      rejected,
    };
  }, [events]);

  // Sources Stats
  const sourcesStats = useMemo(() => {
    const active = sources.filter((s) => s.status === 'active').length;
    const inactive = sources.filter((s) => s.status === 'inactive').length;
    const totalIndexed = sources.reduce((acc, s) => acc + s.eventsCount, 0);
    return {
      total: sources.length,
      active,
      inactive,
      totalIndexed,
    };
  }, [sources]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Tab filter
      if (selectedTab !== 'all' && ev.approvalStatus !== selectedTab) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchLoc = ev.location.toLowerCase().includes(q);
        const matchSource = ev.source?.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchSource) return false;
      }
      return true;
    });
  }, [events, selectedTab, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-[#F26430] selection:text-white flex flex-col">
      
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#1E293B]/90 backdrop-blur-xl border-b border-slate-700/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4A7C59] to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                <span>Event Aggregator & AI Engine</span>
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-400">ระบบดึงข้อมูลอีเวนต์ไทย & วิเคราะห์หมวดหมู่ด้วย Gemini AI</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/myhub"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
            title="เปิดจัดการชาเลนจ์ & เผยแพร่แคมเปญ Official Quests"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>จัดการชาเลนจ์ & Quests ↗</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
            title="เปิดดูหน้าเว็บ Chill & Connect Hub จริง"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>ดูหน้าเว็บจริง ↗</span>
          </Link>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Switch Tabs: Events Catalog vs. Data Sources */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveMainTab('events')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMainTab === 'events'
                  ? 'bg-[#4A7C59] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>คลังและตรวจสอบอีเวนต์ ({stats.total})</span>
            </button>

            <button
              onClick={() => setActiveMainTab('sources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMainTab === 'sources'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>แหล่งข้อมูลเชื่อมต่อ (Data Sources) ({sources.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deduplication Engine: Active (กรองซ้ำ 100%)</span>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: EVENTS CATALOG & REVIEW VIEW */}
        {/* ======================================================== */}
        {activeMainTab === 'events' && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Events */}
              <div className="bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">อีเวนต์ทั้งหมดในระบบ</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{stats.total}</span>
                  <span className="text-xs text-slate-400 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <span>จาก {sourcesStats.active} แหล่งข้อมูลเชื่อมต่อ</span>
                </div>
              </div>

              {/* Card 2: Pending Approval */}
              <div 
                onClick={() => setSelectedTab('pending')}
                className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-md relative overflow-hidden ${
                  selectedTab === 'pending'
                    ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/20'
                    : 'bg-[#1E293B] hover:bg-slate-800/80 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">รอการตรวจสอบ (Pending)</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-300">{stats.pending}</span>
                  <span className="text-xs text-amber-400/80 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-400/70">
                  {stats.pending > 0 ? 'มีงานใหม่ที่ AI วิเคราะห์แล้ว รอคุณอนุมัติ' : 'ไม่มีงานค้างอนุมัติ'}
                </div>
              </div>

              {/* Card 3: Live on Web */}
              <div 
                onClick={() => setSelectedTab('approved')}
                className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-md relative overflow-hidden ${
                  selectedTab === 'approved'
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/20'
                    : 'bg-[#1E293B] hover:bg-slate-800/80 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">เผยแพร่อยู่บนหน้าแรก (Live)</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-300">{stats.approved}</span>
                  <span className="text-xs text-emerald-400/80 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400/70">
                  <span>แสดงผลในหมวดหมู่ & แผนที่ Near Me</span>
                </div>
              </div>

              {/* Card 4: Auto-Publish Control */}
              <div className="bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">โหมด Auto-publish</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-bold block ${autoPublish ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {autoPublish ? 'เปิดใช้งานอัตโนมัติ' : 'ปิด (ต้องกดอนุมัติ)'}
                    </span>
                    <span className="text-[10px] text-slate-400">อนุมัติงานใหม่ทันทีที่ AI วิเคราะห์เสร็จ</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoPublish}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoPublish ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                        autoPublish ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Master Control Bar */}
            <div className="bg-[#1E293B] rounded-3xl p-5 border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Scrape Trigger Button */}
                <button
                  onClick={() => handleTriggerScrape()}
                  disabled={isScraping}
                  className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-emerald-900/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                  <span>{isScraping ? 'กำลังสแกนดึงข้อมูล & รัน AI...' : 'สแกนดึงข้อมูลใหม่ทันที (Scrape Live Events)'}</span>
                </button>

                {/* Approve All Pending Button */}
                {stats.pending > 0 && (
                  <button
                    onClick={handleApproveAll}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติทั้งหมด ({stats.pending})</span>
                  </button>
                )}

                {/* Clean Reload All Events Button */}
                <button
                  onClick={handleResetAndSeed}
                  disabled={isScraping}
                  className="bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/50 font-bold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-900/30"
                  title="รีเซ็ตและโหลดข้อมูลอีเวนต์สดชุดใหญ่ 80+ รายการ"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>โหลดชุดใหญ่ 80+ รายการ</span>
                </button>

                <button
                  onClick={fetchEvents}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช</span>
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AI Scraper Ready: เชื่อมต่อ {sourcesStats.active} แหล่งข้อมูลสด</span>
              </div>
            </div>

            {/* Filter and Search Row */}
            <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {[
                  { id: 'pending', label: 'รอตรวจสอบ', count: stats.pending },
                  { id: 'approved', label: 'อนุมัติแล้ว', count: stats.approved },
                  { id: 'all', label: 'ทั้งหมด', count: stats.total },
                  { id: 'rejected', label: 'ปฏิเสธ', count: stats.rejected },
                ].map((tab) => {
                  const isSelected = selectedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center gap-2.5">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, สถานที่, หรือแหล่งที่มา..."
                    className="w-full bg-slate-900/90 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden focus:border-[#4A7C59]"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900/90 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  <option value="heal">🌱 ฮีลใจ (Heal)</option>
                  <option value="move">🏃 ขยับกาย / กีฬา (Move)</option>
                  <option value="chill">☕ ชิลล์ & คาเฟ่ (Chill)</option>
                  <option value="learn">🎨 สร้างสรรค์ (Learn)</option>
                </select>
              </div>
            </div>

            {/* Events List Grid */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-400">กำลังโหลดรายการอีเวนต์จากฐานข้อมูล...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-[#1E293B]/50 rounded-3xl p-12 text-center space-y-3 border border-slate-800">
                <p className="text-base font-bold text-slate-300">ไม่พบรายการอีเวนต์ในหมวดนี้</p>
                <p className="text-xs text-slate-500">
                  {selectedTab === 'pending'
                    ? 'ยอดเยี่ยม! ไม่มีกิจกรรมที่รอดำเนินการอนุมัติ'
                    : 'ลองปรับตัวกรองการค้นหา หรือกดปุ่ม "สแกนดึงข้อมูลใหม่" ด้านบน'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((ev) => {
                  const isApproved = ev.approvalStatus === 'approved';
                  const isPending = ev.approvalStatus === 'pending';
                  const isRejected = ev.approvalStatus === 'rejected';

                  return (
                    <div
                      key={ev.id}
                      className={`bg-[#1E293B] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between shadow-md group ${
                        isPending
                          ? 'border-amber-500/40 hover:border-amber-500/80'
                          : isApproved
                          ? 'border-slate-700/80 hover:border-emerald-500/60'
                          : 'border-rose-500/30 opacity-70'
                      }`}
                    >
                      <div>
                        {/* Event Photo & Badges */}
                        <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                          <img
                            src={ev.image}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

                          {/* Approval Status Badge */}
                          <span className={`absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-500 text-white'
                              : isPending
                              ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                              : 'bg-rose-500 text-white'
                          }`}>
                            {isApproved && <Check className="w-3 h-3" />}
                            {isPending && <Clock className="w-3 h-3" />}
                            {isRejected && <X className="w-3 h-3" />}
                            <span>
                              {isApproved ? 'อนุมัติแล้ว (Live)' : isPending ? 'รอตรวจสอบ (Pending)' : 'ปฏิเสธ (Rejected)'}
                            </span>
                          </span>

                          {/* Source Chip */}
                          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 text-sky-400" />
                            <span>{ev.source || 'Chill & Connect'}</span>
                          </span>

                          {/* Price Tag */}
                          {ev.price && (
                            <span className="absolute bottom-2 right-2.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
                              {ev.price}
                            </span>
                          )}
                        </div>

                        {/* Card Content Details */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                              {ev.tag || '#Event'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              หมวด: {ev.category.toUpperCase()}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                            {ev.title}
                          </h3>

                          <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{ev.date} • {ev.time}</span>
                            </div>

                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                              <span title={ev.location}>{ev.location}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400/90 line-clamp-2 pt-1 border-t border-slate-800 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-2">
                        
                        {/* Left Action: Quick Edit */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEvent(ev)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลอีเวนต์"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(ev.id)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="ลบอีเวนต์ออกจากระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Right Actions: Approval Buttons */}
                        <div className="flex items-center gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(ev.id, 'rejected')}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer active:scale-95"
                              >
                                ปฏิเสธ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(ev.id, 'approved')}
                                className="px-3.5 py-1 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(ev.id, 'pending')}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              ปลดลง (Unpublish)
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(ev.id, 'approved')}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            >
                              กู้คืน & อนุมัติ
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DATA SOURCES HUB VIEW */}
        {/* ======================================================== */}
        {activeMainTab === 'sources' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Sources Overview Bar */}
            <div className="bg-[#1E293B] rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-extrabold mb-2">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    <span>Multi-Platform Event Ingestion Pipeline</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    จัดการแหล่งข้อมูลที่เชื่อมต่อ (Connected Data Sources)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    ระบบรวบรวมข้อมูลอีเวนต์จาก Ticket Platform, Mega Venues, และคอมมูนิตี้ พร้อมระบบตรวจจับข้อมูลซ้ำอัตโนมัติ 100%
                  </p>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => setShowAddSourceModal(true)}
                    className="bg-[#F26430] hover:bg-[#D95322] text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-lg shadow-orange-950/40 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มแหล่งข้อมูลใหม่</span>
                  </button>

                  <button
                    onClick={() => handleTriggerScrape()}
                    disabled={isScraping}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                    <span>ดึงข้อมูลจากทุก Source</span>
                  </button>
                </div>

              </div>

              {/* Source Stats Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block">แหล่งข้อมูลทั้งหมด</span>
                  <span className="text-xl font-black text-white">{sourcesStats.total} แพลตฟอร์ม</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-emerald-400 block">สถานะ Active ปกติ</span>
                  <span className="text-xl font-black text-emerald-300">{sourcesStats.active} แหล่ง</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block">พักการดึง (Inactive)</span>
                  <span className="text-xl font-black text-slate-400">{sourcesStats.inactive} แหล่ง</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400 block">Deduplication Protection</span>
                  <span className="text-xl font-black text-amber-300">100% ป้องกันซ้ำ</span>
                </div>
              </div>

            </div>

            {/* Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((src) => {
                const isActive = src.status === 'active';
                const isCurrentScraping = isScraping && scrapingSourceId === src.id;

                return (
                  <div
                    key={src.id}
                    className={`bg-[#1E293B] rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-md ${
                      isActive
                        ? 'border-slate-700/80 hover:border-sky-500/50'
                        : 'border-slate-800 opacity-60 bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-3">
                      
                      {/* Top Row: Icon + Name + Active Switch */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-inner">
                            {src.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                              {src.name}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400 truncate block">
                              {src.categoryLabel}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleSourceStatus(src.id, src.status)}
                          className={`w-10 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                          title={isActive ? 'คลิกเพื่อพักการดึงข้อมูล' : 'คลิกเพื่อเปิดใช้งาน'}
                        >
                          <span
                            className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                              isActive ? 'right-0.5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Description */}
                      {src.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {src.description}
                        </p>
                      )}

                      {/* Target Link */}
                      <div className="flex items-center justify-between text-xs bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 truncate text-[11px] font-mono">{src.url}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold shrink-0 text-[11px] pl-2"
                        >
                          <span>เปิดเว็บ</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                    </div>

                    {/* Footer Actions & Stats */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        <span className="block font-bold text-slate-300">{src.eventsCount} อีเวนต์ที่ดึงมา</span>
                        <span className="text-[10px] text-slate-500">อัปเดต: {src.lastScraped || 'ล่าสุด'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {src.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(src.id, src.name)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="ลบแหล่งข้อมูลนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTriggerScrape(src.name, src.id)}
                          disabled={isScraping || !isActive}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
                          title="ดึงข้อมูลเฉพาะจากแหล่งนี้ทันที"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isCurrentScraping ? 'animate-spin text-amber-400' : 'text-sky-400'}`} />
                          <span>{isCurrentScraping ? 'กำลังดึง...' : 'ดึงตอนนี้'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ADD CUSTOM DATA SOURCE MODAL */}
      {/* ======================================================== */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-[#F26430] border border-orange-500/40 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">เพิ่มแหล่งข้อมูลใหม่ (Add Data Source)</h3>
                  <p className="text-xs text-slate-400">เชื่อมต่อเว็บอีเวนต์เพื่อให้อัลกอริทึม AI ดึงข้อมูล</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSourceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">ชื่อแหล่งข้อมูล / เว็บไซต์ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ZipEvent Thailand, Klook Bangkok, FA Thailand"
                  value={newSourceForm.name}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-[#4A7C59]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">URL เว็บไซต์ / หน้าปฏิทินกิจกรรม *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.zipeventapp.com"
                  value={newSourceForm.url}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-[#4A7C59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">หมวดหมู่หลัก</label>
                  <select
                    value={newSourceForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      const labels: Record<string, string> = {
                        sports: '⚽ กีฬา & แมตช์การแข่งขัน',
                        music: '🎵 คอนเสิร์ต & ดนตรีสด',
                        exhibition: '🏛️ เอ็กซ์โป & นิทรรศการ',
                        running: '🏃 งานวิ่ง & มาราธอน',
                        finance: '📈 สัมมนาการเงิน & ธุรกิจ',
                        lifestyle: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
                      };
                      setNewSourceForm({
                        ...newSourceForm,
                        category: cat,
                        categoryLabel: labels[cat] || '🌐 กิจกรรมทั่วไป',
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="lifestyle">🎟️ เวิร์กช็อป & ไลฟ์สไตล์</option>
                    <option value="sports">⚽ กีฬา & แมตช์การแข่งขัน</option>
                    <option value="music">🎵 คอนเสิร์ต & ดนตรีสด</option>
                    <option value="exhibition">🏛️ เอ็กซ์โป & นิทรรศการ</option>
                    <option value="running">🏃 งานวิ่ง & มาราธอน</option>
                    <option value="finance">📈 สัมมนาการเงิน & ธุรกิจ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ไอคอน Emoji</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="⚽, 🎟️, 🎫, 🎪"
                    value={newSourceForm.icon}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, icon: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-center focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">คำอธิบายแหล่งข้อมูลสั้นๆ</label>
                <textarea
                  rows={2}
                  placeholder="อธิบายว่าแหล่งนี้รวบรวมกิจกรรมประเภทใด..."
                  value={newSourceForm.description}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-[#4A7C59] hover:bg-[#3B6447] font-black shadow-md cursor-pointer"
                >
                  บันทึกแหล่งข้อมูล
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SCRAPE & DEDUPLICATION AUDIT REPORT MODAL */}
      {/* ======================================================== */}
      {scrapeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">รายงานผลการดึงข้อมูล & ตรวจสอบซ้ำ</h3>
                  <p className="text-xs text-slate-400">Scrape Audit & Deduplication Engine Report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScrapeResult(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audit Summary Badges */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">สแกนพบทั้งหมด</span>
                <span className="text-lg font-black text-white">{scrapeResult.totalScanned} รายการ</span>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/40">
                <span className="text-[10px] font-black text-emerald-400 block">บันทึกใหม่สำเร็จ</span>
                <span className="text-lg font-black text-emerald-300">{scrapeResult.newCount} รายการ</span>
              </div>
              <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-500/40">
                <span className="text-[10px] font-black text-amber-400 block">กรองซ้ำออก</span>
                <span className="text-lg font-black text-amber-300">{scrapeResult.duplicateCount} รายการ</span>
              </div>
            </div>

            {/* Duplicates Detail List */}
            {scrapeResult.duplicateDetails.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>รายละเอียดรายการที่ซ้ำ (ไม่บันทึกซ้ำลงฐานข้อมูล):</span>
                  <span className="text-amber-400">{scrapeResult.duplicateDetails.length} รายการ</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                  {scrapeResult.duplicateDetails.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-slate-300"
                    >
                      <span className="font-bold text-slate-200 truncate flex-1">{dup.rawTitle}</span>
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                        {dup.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setScrapeResult(null)}
                className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white font-extrabold text-xs sm:text-sm py-2.5 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                รับทราบ & ปิดหน้าต่างนี้
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDIT EVENT MODAL */}
      {/* ======================================================== */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">แก้ไขข้อมูลกิจกรรม</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">ชื่องานกิจกรรม</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-[#4A7C59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">วันที่จัด</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">เวลา</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">สถานที่จัดงาน</label>
                <input
                  type="text"
                  required
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">ราคา</label>
                  <input
                    type="text"
                    value={editingEvent.price || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">หมวดหมู่</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="heal">🌱 ฮีลใจ (Heal)</option>
                    <option value="move">🏃 ขยับกาย (Move)</option>
                    <option value="chill">☕ ชิลล์ & คาเฟ่ (Chill)</option>
                    <option value="learn">🎨 สร้างสรรค์ (Learn)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">URL ต้นทาง / ซื้อบัตร</label>
                <input
                  type="url"
                  value={editingEvent.externalUrl || editingEvent.link || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, externalUrl: e.target.value, link: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">รายละเอียดกิจกรรม</label>
                <textarea
                  rows={3}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-[#4A7C59] hover:bg-[#3B6447] font-black shadow-md cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
