'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminEventItem } from '@/lib/eventsStore';
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
} from 'lucide-react';

export default function AdminPage() {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [autoPublish, setAutoPublishState] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'all' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<AdminEventItem | null>(null);

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
      }
    } catch (err) {
      console.error('Failed to fetch admin events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Trigger Scraper & AI Tagger Bot
  const handleTriggerScrape = async () => {
    try {
      setIsScraping(true);
      const res = await fetch('/api/admin/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast(`🤖 ${data.message}`);
        // If there are pending events, switch to pending tab
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

  // Reset & Fresh Seed All 50+ Events
  const handleResetAndSeed = async () => {
    if (!confirm('ต้องการรีเซ็ตและดึงข้อมูลอีเวนต์สดชุดใหญ่ (50+ รายการ) ใหม่ทั้งหมดใช่หรือไม่?')) return;
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
        setSelectedTab('pending');
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
            href="/challenge"
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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
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
              <span>แหล่งที่มา: Zipevent, Eventpop, QSNCC, BITEC, กทม.</span>
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
              {stats.pending > 0 ? '⚡ มีงานใหม่ที่ AI วิเคราะห์แล้ว รอคุณอนุมัติ' : '✔️ ไม่มีงานค้างอนุมัติ'}
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
                  {autoPublish ? '🟢 เปิดใช้งานอัตโนมัติ' : '⚪ ปิด (ต้องกดอนุมัติ)'}
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
              onClick={handleTriggerScrape}
              disabled={isScraping}
              className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-emerald-900/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
              <span>{isScraping ? 'กำลังสแกนดึงข้อมูล & รัน AI...' : '🤖 สแกนดึงข้อมูลใหม่ทันที (Scrape Live Events)'}</span>
            </button>

            {/* Approve All Pending Button */}
            {stats.pending > 0 && (
              <button
                onClick={handleApproveAll}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>⚡ อนุมัติทั้งหมด ({stats.pending})</span>
              </button>
            )}

            {/* Clean Reload All 50+ Events Button */}
            <button
              onClick={handleResetAndSeed}
              disabled={isScraping}
              className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 font-bold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="รีเซ็ตและโหลดข้อมูลอีเวนต์สดชุดใหญ่ 50+ รายการ"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>⚡ โหลดชุดใหญ่ 50+ รายการ</span>
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

          {/* AI & Deduplication Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>AI: <strong>Gemini Auto-Classifier</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/40 px-3.5 py-2 rounded-2xl border border-emerald-500/30 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deduplication: <strong>Fuzzy & Geo Matcher (Active)</strong></span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-2xl border border-slate-700/80 overflow-x-auto">
            {[
              { id: 'pending', label: '⏳ รออนุมัติ', count: stats.pending, color: 'text-amber-400' },
              { id: 'approved', label: '✅ อนุมัติแล้ว (Live)', count: stats.approved, color: 'text-emerald-400' },
              { id: 'all', label: '📋 ทั้งหมด', count: stats.total, color: 'text-slate-300' },
              { id: 'rejected', label: '🗑️ ปฏิเสธ', count: stats.rejected, color: 'text-rose-400' },
            ].map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่องาน, สถานที่, แหล่งที่มา..."
                className="w-full bg-[#1E293B] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่</option>
              <option value="heal">🌿 ฮีลใจ (Heal)</option>
              <option value="move">🏃 ออกกำลังกาย (Move)</option>
              <option value="chill">☕ นัดชิลล์ (Chill)</option>
              <option value="learn">🎨 เวิร์กช็อป (Learn)</option>
            </select>
          </div>
        </div>

        {/* Events Review Cards List */}
        {isLoading ? (
          <div className="bg-[#1E293B] rounded-3xl p-12 text-center border border-slate-700 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-400">กำลังโหลดข้อมูลกิจกรรม...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-[#1E293B] rounded-3xl p-12 text-center border border-slate-700 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">ไม่พบกิจกรรมในเงื่อนไขนี้</h3>
            <p className="text-xs text-slate-500">คุณสามารถกดปุ่ม "🤖 สแกนดึงข้อมูลใหม่ทันที" เพื่อดึงงานอีเวนต์ล่าสุดเข้ามาได้เลย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const isPending = event.approvalStatus === 'pending';
              const isApproved = event.approvalStatus === 'approved';

              return (
                <div
                  key={event.id}
                  className={`bg-[#1E293B] rounded-2xl p-4 sm:p-5 border transition-all hover:border-slate-600 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending
                      ? 'border-amber-500/40 bg-gradient-to-r from-[#1E293B] to-amber-950/10'
                      : 'border-slate-700/80'
                  }`}
                >
                  {/* Left: Thumbnail & Essential Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-800"
                    />

                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Top Badges: Source + Category + Zone */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Source Badge */}
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {event.source || 'Aggregator'}
                        </span>

                        {/* AI Category Tag */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                          event.category === 'move'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : event.category === 'heal'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : event.category === 'learn'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                        }`}>
                          {event.tag}
                        </span>

                        {/* AI Zone Badge */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-400 border border-slate-700 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>ย่าน: {BANGKOK_ZONES.find((z) => z.id === event.zone)?.label || event.zone || 'กรุงเทพฯ'}</span>
                        </span>

                        {/* Status Chip */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {isApproved ? '🟢 เผยแพร่แล้ว' : isPending ? '⏳ รออนุมัติ' : '🔴 ถูกปฏิเสธ'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-sm sm:text-base text-white truncate" title={event.title}>
                        {event.title}
                      </h4>

                      {/* Date, Location, GPS, Price */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          <span>{event.date} • {event.time}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span className="truncate">{event.location}</span>
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          (GPS: {event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)})
                        </span>
                        <span className="font-bold text-emerald-400">
                          {event.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/60">
                    
                    {/* If Pending: Approve button is primary */}
                    {isPending && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        title="อนุมัติให้แสดงบนหน้าแรกทันที"
                      >
                        <Check className="w-4 h-4" />
                        <span>อนุมัติขึ้นเว็บ</span>
                      </button>
                    )}

                    {/* If Approved: Option to unpublish */}
                    {isApproved && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'pending')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
                        title="พักการแสดงผล"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>พักไว้</span>
                      </button>
                    )}

                    {/* Quick Edit */}
                    <button
                      onClick={() => setEditingEvent({ ...event })}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs p-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 font-bold text-xs p-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      title="ลบกิจกรรม"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1E293B] rounded-3xl p-6 border border-slate-700 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>แก้ไขข้อมูลกิจกรรม</span>
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">ชื่องานกิจกรรม</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">หมวดหมู่หลัก (Category)</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="heal">🌿 ฮีลใจ (Heal)</option>
                    <option value="move">🏃 ออกกำลังกาย (Move)</option>
                    <option value="chill">☕ นัดชิลล์ (Chill)</option>
                    <option value="learn">🎨 เวิร์กช็อป (Learn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">ย่านในกรุงเทพฯ (Bangkok Zone)</label>
                  <select
                    value={editingEvent.zone || 'siam'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, zone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BANGKOK_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">วันที่จัดงาน</label>
                  <input
                    type="text"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">เวลา</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">สถานที่จัดงาน</label>
                <input
                  type="text"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ค่าเข้า / ราคาบัตร</label>
                  <input
                    type="text"
                    value={editingEvent.price || 'ฟรี!'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">ประเภทการจัดงาน</label>
                  <select
                    value={editingEvent.eventType}
                    onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="public_venue">🏛️ อีเวนต์สาธารณะ / Exhibition</option>
                    <option value="community">🏡 กิจกรรมชุมชน / กลุ่มย่อย</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">URL รูปภาพ</label>
                <input
                  type="text"
                  value={editingEvent.image}
                  onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
