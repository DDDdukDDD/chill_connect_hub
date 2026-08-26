'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminEventItem } from '@/lib/eventsStore';
import { EventDataSource } from '@/lib/sourcesStore';
import { BANGKOK_ZONES } from '@/data/mockData';
import { ALL_THAI_PROVINCES, SPOT_CATEGORIES, LifestyleSpotItem } from '@/data/spotsData';
import { AdminCreateEventModal } from '@/components/AdminCreateEventModal';
import { resolveSpotImage, isValidImageUrl } from '@/lib/spotImageResolver';
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
  Compass,
  Image as ImageIcon,
  CheckCheck,
  FolderTree,
  Building2,
  ChevronDown
} from 'lucide-react';

export default function AdminPage() {
  // Navigation: Master Data vs Event Aggregator
  const [activeMainTab, setActiveMainTab] = useState<'spots' | 'events' | 'sources'>('spots');

  // Events State
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

  // Spots State (ข้อมูล Master)
  const [spots, setSpots] = useState<LifestyleSpotItem[]>([]);
  const [isSpotsLoading, setIsSpotsLoading] = useState<boolean>(true);
  const [spotSearchQuery, setSpotSearchQuery] = useState<string>('');
  const [spotProvinceFilter, setSpotProvinceFilter] = useState<string>('all');
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<string>('all');
  const [spotImageFilter, setSpotImageFilter] = useState<'all' | 'missing_image'>('all');
  const [isEnrichingImages, setIsEnrichingImages] = useState<boolean>(false);

  // Spot Modals
  const [editingSpot, setEditingSpot] = useState<LifestyleSpotItem | null>(null);
  const [showAddSpotModal, setShowAddSpotModal] = useState<boolean>(false);
  const [newSpotForm, setNewSpotForm] = useState<{
    title: string;
    category: 'park' | 'cafe' | 'art' | 'oldtown' | 'workspace' | 'viewpoint' | 'nature';
    categoryLabel: string;
    province: string;
    district: string;
    image: string;
    openHours: string;
    price: string;
    description: string;
    latitude: number;
    longitude: number;
  }>({
    title: '',
    category: 'nature',
    categoryLabel: '🌲 ธรรมชาติ & แคมปิ้ง',
    province: 'กรุงเทพฯ',
    district: '',
    image: '',
    openHours: 'เปิดทุกวัน: 08:00 - 18:00 น.',
    price: 'เข้าฟรี',
    description: '',
    latitude: 13.7563,
    longitude: 100.5018,
  });

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<AdminEventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

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

  // Fetch Spots (ข้อมูล Master)
  const fetchSpots = async () => {
    try {
      setIsSpotsLoading(true);
      const res = await fetch('/api/admin/spots');
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
      }
    } catch (err) {
      console.error('Failed to fetch admin spots:', err);
    } finally {
      setIsSpotsLoading(false);
    }
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
    fetchSpots();
    fetchEvents();
    fetchSources();
  }, []);

  // -------------------------------------------------------------
  // SPOTS ACTIONS (ข้อมูล Master)
  // -------------------------------------------------------------
  const handleAutoEnrichImages = async () => {
    try {
      setIsEnrichingImages(true);
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_enrich_images' }),
      });
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
        showToast(`✨ ${data.message}`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเติมรูปภาพ');
    } finally {
      setIsEnrichingImages(false);
    }
  };

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          newSpot: newSpotForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
        setShowAddSpotModal(false);
        setNewSpotForm({
          title: '',
          category: 'nature',
          categoryLabel: '🌲 ธรรมชาติ & แคมปิ้ง',
          province: 'กรุงเทพฯ',
          district: '',
          image: '',
          openHours: 'เปิดทุกวัน: 08:00 - 18:00 น.',
          price: 'เข้าฟรี',
          description: '',
          latitude: 13.7563,
          longitude: 100.5018,
        });
        showToast('🎉 เพิ่มข้อมูลสถานที่เรียบร้อยแล้ว!');
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างสถานที่');
    }
  };

  const handleSaveEditSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          spotId: editingSpot.id,
          updatedFields: editingSpot,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
        setEditingSpot(null);
        showToast('✅ อัปเดตข้อมูลสถานที่เรียบร้อยแล้ว!');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกสถานที่');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('ยืนยันการลบสถานที่นี้ออกจากระบบ?')) return;
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', spotId }),
      });
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
        showToast('🗑️ ลบสถานที่ออกจากระบบแล้ว');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบสถานที่');
    }
  };

  // -------------------------------------------------------------
  // EVENTS ACTIONS
  // -------------------------------------------------------------
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
        fetchSources();
        setScrapeResult({
          totalScanned: data.totalScanned || (data.newCount + data.duplicateCount),
          newCount: data.newCount,
          duplicateCount: data.duplicateCount,
          duplicateDetails: data.duplicateDetails || [],
        });
        showToast(`🎉 สแกนสำเร็จ: พบงานใหม่ ${data.newCount} รายการ!`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสแกนข้อมูล');
    } finally {
      setIsScraping(false);
      setScrapingSourceId(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
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
        setSelectedTab('all');
        fetchSources();
        showToast(`🎉 ${data.message}`);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
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

  const handleToggleAutoPublish = async () => {
    const nextVal = !autoPublish;
    setAutoPublishState(nextVal);
    try {
      await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_publish', autoPublish: nextVal }),
      });
      showToast(nextVal ? '⚡ เปิดโหมด Auto-publish' : 'ปิดโหมด Auto-publish');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
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
        showToast('✅ บันทึกการแก้ไขข้อมูลเรียบร้อย!');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // -------------------------------------------------------------
  // STATS & FILTER COMPUTATIONS
  // -------------------------------------------------------------
  const eventStats = useMemo(() => {
    const pending = events.filter((e) => e.approvalStatus === 'pending').length;
    const approved = events.filter((e) => e.approvalStatus === 'approved').length;
    const rejected = events.filter((e) => e.approvalStatus === 'rejected').length;
    return { total: events.length, pending, approved, rejected };
  }, [events]);

  const sourcesStats = useMemo(() => {
    const active = sources.filter((s) => s.status === 'active').length;
    const inactive = sources.filter((s) => s.status === 'inactive').length;
    const totalIndexed = sources.reduce((acc, s) => acc + s.eventsCount, 0);
    return { total: sources.length, active, inactive, totalIndexed };
  }, [sources]);

  const spotStats = useMemo(() => {
    const missingImages = spots.filter((s) => !isValidImageUrl(s.image)).length;
    const provincesCovered = new Set(spots.map((s) => s.province)).size;
    return {
      total: spots.length,
      missingImages,
      provincesCovered,
    };
  }, [spots]);

  // Filtered Spots
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      if (spotProvinceFilter !== 'all') {
        const pLower = spotProvinceFilter.toLowerCase();
        const spotProv = spot.province.toLowerCase();
        if (!spotProv.includes(pLower) && !pLower.includes(spotProv)) return false;
      }
      if (spotCategoryFilter !== 'all' && spot.category !== spotCategoryFilter) {
        return false;
      }
      if (spotImageFilter === 'missing_image' && isValidImageUrl(spot.image)) {
        return false;
      }
      if (spotSearchQuery.trim() !== '') {
        const q = spotSearchQuery.toLowerCase().trim();
        const matchTitle = spot.title.toLowerCase().includes(q);
        const matchProv = spot.province.toLowerCase().includes(q);
        const matchDist = spot.district.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        if (!matchTitle && !matchProv && !matchDist && !matchDesc) return false;
      }
      return true;
    });
  }, [spots, spotProvinceFilter, spotCategoryFilter, spotImageFilter, spotSearchQuery]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedTab !== 'all' && ev.approvalStatus !== selectedTab) return false;
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#F26430] selection:text-white flex flex-col">
      
      {/* 🌟 Top Admin Header Bar (Pure White SaaS Styling) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E293B] to-slate-700 flex items-center justify-center shadow-md text-white">
            <Building2 className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Chill & Connect Master Hub</span>
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-100 text-[#F26430] border border-orange-200">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">ระบบศูนย์กลางข้อมูล Master & ระบบจัดการกิจกรรมอัจฉริยะ</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>ดูหน้าเว็บจริง ↗</span>
          </Link>

          <Link
            href="/myhub"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>จัดการ Quests ↗</span>
          </Link>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ======================================================== */}
        {/* 🗂️ MASTER CATEGORY NAVIGATION TABS */}
        {/* ======================================================== */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Categorized Tab Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* GROUP 1: ข้อมูล MASTER */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <span className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">
                ข้อมูล Master:
              </span>
              <button
                type="button"
                onClick={() => setActiveMainTab('spots')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeMainTab === 'spots'
                    ? 'bg-[#F26430] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>ข้อมูลสถานที่เที่ยว & จุดฮีลใจ ({spotStats.total})</span>
              </button>
            </div>

            {/* GROUP 2: EVENT AGGREGATOR & AI ENGINE */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <span className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">
                Event Engine:
              </span>
              <button
                type="button"
                onClick={() => setActiveMainTab('events')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeMainTab === 'events'
                    ? 'bg-[#4A7C59] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>จัดการอีเวนต์ & งานแฟร์ ({eventStats.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('sources')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeMainTab === 'sources'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>แหล่งดูดข้อมูล & สแกนเนอร์ ({sources.length})</span>
              </button>
            </div>

          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 self-end md:self-auto">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Image Resolver: Online</span>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: ข้อมูล MASTER - ข้อมูลสถานที่เที่ยว & จุดฮีลใจ (77 จังหวัด) */}
        {/* ======================================================== */}
        {activeMainTab === 'spots' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Spots */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">สถานที่เที่ยว & จุดฮีลใจทั้งหมด</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F26430] flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{spotStats.total}</span>
                  <span className="text-xs text-slate-500 font-medium">แห่ง</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                  <span>ครอบคลุม {spotStats.provincesCovered} / 77 จังหวัด</span>
                </div>
              </div>

              {/* Card 2: Provinces Covered */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">จังหวัดที่มีข้อมูล</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700">{spotStats.provincesCovered}</span>
                  <span className="text-xs text-emerald-600 font-medium">จังหวัด</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-600">
                  รองรับการค้นหาตามพิกัด 77 จังหวัด
                </div>
              </div>

              {/* Card 3: Missing Images */}
              <div 
                onClick={() => setSpotImageFilter(spotImageFilter === 'missing_image' ? 'all' : 'missing_image')}
                className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
                  spotImageFilter === 'missing_image'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700">ขาดรูปภาพ (Missing Images)</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-800">{spotStats.missingImages}</span>
                  <span className="text-xs text-amber-700 font-medium">แห่ง</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-600">
                  {spotStats.missingImages > 0 ? 'คลิกเพื่อกรองดูรายการที่ไม่มีรูป' : '✨ รูปภาพครบถ้วน 100%'}
                </div>
              </div>

              {/* Card 4: Quick Action: Auto Enrich Images */}
              <div className="bg-gradient-to-br from-orange-500 to-[#F26430] text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-orange-100">Smart Image Resolver</span>
                  <p className="text-xs text-white/90 font-medium mt-1">ตรวจจับและเติมภาพถ่ายความละเอียดสูงให้อัตโนมัติ</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoEnrichImages}
                  disabled={isEnrichingImages}
                  className="mt-3 w-full py-2 bg-white hover:bg-orange-50 text-[#F26430] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnrichingImages ? 'animate-spin' : ''}`} />
                  <span>{isEnrichingImages ? 'กำลังค้นหารูป...' : '✨ เติมรูปภาพที่ขาดอัตโนมัติ'}</span>
                </button>
              </div>

            </div>

            {/* Filter Toolbar & Actions */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Left Filters */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spotSearchQuery}
                    onChange={(e) => setSpotSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อสถานที่, อำเภอ, แท็ก..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#F26430]"
                  />
                  {spotSearchQuery && (
                    <button
                      onClick={() => setSpotSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 77 Provinces Dropdown */}
                <div className="relative flex items-center min-w-[140px]">
                  <MapPin className="w-3.5 h-3.5 text-[#F26430] absolute left-3 pointer-events-none" />
                  <select
                    value={spotProvinceFilter}
                    onChange={(e) => setSpotProvinceFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F26430] cursor-pointer appearance-none"
                  >
                    <option value="all">🌐 ทุกจังหวัด (77 จังหวัด)</option>
                    {ALL_THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>

                {/* Category Dropdown */}
                <div className="relative flex items-center min-w-[150px]">
                  <Compass className="w-3.5 h-3.5 text-[#F26430] absolute left-3 pointer-events-none" />
                  <select
                    value={spotCategoryFilter}
                    onChange={(e) => setSpotCategoryFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F26430] cursor-pointer appearance-none"
                  >
                    {SPOT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>

              </div>

              {/* Right Action: Add New Spot */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddSpotModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F26430] hover:bg-[#D95322] text-white shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>เพิ่มสถานที่ใหม่</span>
                </button>
              </div>

            </div>

            {/* Spots Table / List */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-600">
                  พบข้อมูลสถานที่ <strong className="text-slate-900 font-extrabold">{filteredSpots.length}</strong> แห่ง
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ระบบจะซิงค์พิกัดกับหน้าแรกและระบบใกล้ฉันอัตโนมัติ
                </span>
              </div>

              {isSpotsLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold animate-pulse">
                  กำลังโหลดข้อมูล Master สถานที่ 77 จังหวัด...
                </div>
              ) : filteredSpots.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">ไม่พบข้อมูลสถานที่ที่ตรงกับเงื่อนไข</p>
                  <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองจังหวัดหรือหมวดหมู่อื่น</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/30">
                        <th className="py-3 px-4">รูปภาพ</th>
                        <th className="py-3 px-4">ชื่อสถานที่ & หมวดหมู่</th>
                        <th className="py-3 px-4">จังหวัด / อำเภอ</th>
                        <th className="py-3 px-4">เวลาเปิด & ราคา</th>
                        <th className="py-3 px-4">พิกัด GPS</th>
                        <th className="py-3 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSpots.map((spot) => {
                        const hasImg = isValidImageUrl(spot.image);
                        const displayImg = resolveSpotImage(spot);
                        return (
                          <tr key={spot.id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Thumbnail */}
                            <td className="py-3 px-4">
                              <div className="w-14 h-11 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200 shrink-0">
                                <img
                                  src={displayImg}
                                  alt={spot.title}
                                  className="w-full h-full object-cover"
                                />
                                {!hasImg && (
                                  <span className="absolute bottom-0 right-0 bg-amber-500 text-white text-[8px] font-black px-1 rounded-tl">
                                    AI Fallback
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Title & Category */}
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-extrabold text-slate-900 text-sm truncate">{spot.title}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#F26430] font-bold text-[10px] border border-orange-100">
                                  {spot.categoryLabel || spot.category}
                                </span>
                                {spot.rating && (
                                  <span className="text-[11px] text-amber-600 font-extrabold">
                                    ★ {spot.rating}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Location */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                                <span>{spot.province}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{spot.district || 'ไม่ระบุอำเภอ'}</div>
                            </td>

                            {/* Hours & Price */}
                            <td className="py-3 px-4">
                              <div className="text-slate-700 font-medium">{spot.openHours}</div>
                              <div className="text-emerald-600 font-bold mt-0.5">{spot.price || 'เข้าฟรี'}</div>
                            </td>

                            {/* GPS */}
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              <div>{spot.latitude.toFixed(4)},</div>
                              <div>{spot.longitude.toFixed(4)}</div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingSpot(spot)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                                  title="แก้ไขข้อมูล"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSpot(spot.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all"
                                  title="ลบสถานที่"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: EVENT AGGREGATOR & AI ENGINE - EVENTS MANAGEMENT */}
        {/* ======================================================== */}
        {activeMainTab === 'events' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Events */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">อีเวนต์ทั้งหมดในระบบ</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{eventStats.total}</span>
                  <span className="text-xs text-slate-500 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  จาก {sourcesStats.active} แหล่งข้อมูลเชื่อมต่อ
                </div>
              </div>

              {/* Card 2: Pending Approval */}
              <div 
                onClick={() => setSelectedTab('pending')}
                className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
                  selectedTab === 'pending'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700">รอการตรวจสอบ (Pending)</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-800">{eventStats.pending}</span>
                  <span className="text-xs text-amber-700 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-600">
                  {eventStats.pending > 0 ? 'มีงานใหม่ที่ AI วิเคราะห์แล้ว รอคุณอนุมัติ' : 'ไม่มีงานค้างอนุมัติ'}
                </div>
              </div>

              {/* Card 3: Approved */}
              <div 
                onClick={() => setSelectedTab('approved')}
                className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
                  selectedTab === 'approved'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">อนุมัติแล้ว (Approved)</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-800">{eventStats.approved}</span>
                  <span className="text-xs text-emerald-700 font-medium">รายการ</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-600">
                  แสดงผลบนหน้าค้นหาหลักของเว็บไซต์
                </div>
              </div>

              {/* Card 4: Action Engine */}
              <div className="bg-gradient-to-br from-[#4A7C59] to-emerald-600 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-emerald-100">Scraper Control</span>
                  <p className="text-xs text-white/90 font-medium mt-1">สแกนดูดข้อมูลสดจาก Eventpop, Zipevent, BKK Art</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerScrape()}
                  disabled={isScraping}
                  className="mt-3 w-full py-2 bg-white hover:bg-emerald-50 text-[#4A7C59] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                  <span>{isScraping ? 'กำลังสแกนและจัดหมวด...' : '⚡ สแกนข้อมูลใหม่ทันที'}</span>
                </button>
              </div>

            </div>

            {/* Event Filter & Tab Controls */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่ออีเวนต์, สถานที่, แหล่งที่มา..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4A7C59]"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด ({eventStats.total})
                  </button>
                  <button
                    onClick={() => setSelectedTab('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTab === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    รอตรวจ ({eventStats.pending})
                  </button>
                  <button
                    onClick={() => setSelectedTab('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTab === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    อนุมัติแล้ว ({eventStats.approved})
                  </button>
                </div>

              </div>

              {/* Right Event Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {eventStats.pending > 0 && (
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>อนุมัติที่ค้างทั้งหมด</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#1E293B] hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>สร้างกิจกรรมใหม่</span>
                </button>
              </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-600">
                  พบอีเวนต์ <strong className="text-slate-900 font-extrabold">{filteredEvents.length}</strong> รายการ
                </span>
                <button
                  onClick={handleResetAndSeed}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  🔄 รีเซ็ตฐานข้อมูลอีเวนต์สด
                </button>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold animate-pulse">
                  กำลังโหลดข้อมูลอีเวนต์...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/30">
                        <th className="py-3 px-4">ภาพ</th>
                        <th className="py-3 px-4">ชื่องาน & หมวดหมู่</th>
                        <th className="py-3 px-4">วัน-เวลา & สถานที่</th>
                        <th className="py-3 px-4">แหล่งที่มา</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <img
                              src={ev.image}
                              alt={ev.title}
                              className="w-14 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-extrabold text-slate-900 text-sm truncate">{ev.title}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {(ev as any).categoryLabel || ev.category}
                              </span>
                              <span className="text-[11px] text-emerald-600 font-bold">{ev.price}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ev.date}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-[#F26430]" />
                              <span>{ev.location}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            <div className="font-bold text-slate-700">{ev.source}</div>
                            {ev.externalUrl && (
                              <a
                                href={ev.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                <span>เปิดต้นฉบับ</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {ev.approvalStatus === 'approved' ? (
                              <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>อนุมัติแล้ว</span>
                              </span>
                            ) : ev.approvalStatus === 'pending' ? (
                              <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>รอตรวจสอบ</span>
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>ปฏิเสธ</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {ev.approvalStatus !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(ev.id, 'approved')}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                                  title="อนุมัติ"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingEvent(ev)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: EVENT AGGREGATOR & AI ENGINE - DATA SOURCES */}
        {/* ======================================================== */}
        {activeMainTab === 'sources' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">แหล่งข้อมูลเชื่อมต่อ & สแกนเนอร์อัตโนมัติ</h2>
                <p className="text-xs text-slate-500 mt-0.5">ระบบจะดึงอีเวนต์จากแหล่งข้อมูลเหล่านี้และส่งต่อไปยัง Gemini AI เพื่อวิเคราะห์</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSourceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E293B] text-white hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มแหล่งข้อมูลใหม่</span>
              </button>
            </div>

            {/* Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((src) => (
                <div key={src.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{src.icon}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        src.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {src.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-2">{src.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{src.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">พบแล้ว: <strong className="text-slate-900">{src.eventsCount} งาน</strong></span>
                    <button
                      type="button"
                      onClick={() => handleTriggerScrape(src.name, src.id)}
                      disabled={isScraping && scrapingSourceId === src.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isScraping && scrapingSourceId === src.id ? 'animate-spin' : ''}`} />
                      <span>ดึงข้อมูล</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD SPOT (ข้อมูล Master) */}
      {/* ======================================================== */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#F26430]" />
                <span>เพิ่มข้อมูลสถานที่เที่ยว & จุดฮีลใจ</span>
              </h3>
              <button
                onClick={() => setShowAddSpotModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสถานที่ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สวนป่าเบญจกิติ, ดอยเสมอดาว"
                  value={newSpotForm.title}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จังหวัด (77 จังหวัด) *</label>
                  <select
                    value={newSpotForm.province}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  >
                    {ALL_THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">อำเภอ / ย่าน</label>
                  <input
                    type="text"
                    placeholder="เช่น คลองเตย, เมือง"
                    value={newSpotForm.district}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมวดหมู่สถานที่</label>
                <select
                  value={newSpotForm.category}
                  onChange={(e) => {
                    const catObj = SPOT_CATEGORIES.find((c) => c.id === e.target.value);
                    setNewSpotForm({
                      ...newSpotForm,
                      category: e.target.value as any,
                      categoryLabel: catObj?.label || '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                >
                  {SPOT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL รูปภาพ (หากเว้นว่าง ระบบจะดึงภาพคุณภาพสูงอัตโนมัติ)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newSpotForm.image}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ละติจูด (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSpotForm.latitude}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ลองจิจูด (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSpotForm.longitude}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียดสถานที่</label>
                <textarea
                  rows={3}
                  value={newSpotForm.description}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, description: e.target.value })}
                  placeholder="อธิบายจุดเด่น บรรยากาศ หรือไฮไลท์..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSpotModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F26430] hover:bg-[#D95322] font-black text-white shadow-sm"
                >
                  บันทึกสถานที่ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SPOT (ข้อมูล Master) */}
      {/* ======================================================== */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#F26430]" />
                <span>แก้ไขข้อมูลสถานที่: {editingSpot.title}</span>
              </h3>
              <button
                onClick={() => setEditingSpot(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSpot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสถานที่</label>
                <input
                  type="text"
                  required
                  value={editingSpot.title}
                  onChange={(e) => setEditingSpot({ ...editingSpot, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จังหวัด</label>
                  <select
                    value={editingSpot.province}
                    onChange={(e) => setEditingSpot({ ...editingSpot, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  >
                    {ALL_THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">อำเภอ / ย่าน</label>
                  <input
                    type="text"
                    value={editingSpot.district}
                    onChange={(e) => setEditingSpot({ ...editingSpot, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL รูปภาพ</label>
                <input
                  type="text"
                  value={editingSpot.image}
                  onChange={(e) => setEditingSpot({ ...editingSpot, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียด</label>
                <textarea
                  rows={3}
                  value={editingSpot.description}
                  onChange={(e) => setEditingSpot({ ...editingSpot, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#F26430]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSpot(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F26430] hover:bg-[#D95322] font-black text-white shadow-sm"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT EVENT */}
      {/* ======================================================== */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>แก้ไขข้อมูลอีเวนต์: {editingEvent.title}</span>
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่องาน</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันที่จัดงาน</label>
                  <input
                    type="text"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ราคาบัตร</label>
                  <input
                    type="text"
                    value={editingEvent.price}
                    onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานที่จัดงาน</label>
                <input
                  type="text"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL รูปภาพ</label>
                <input
                  type="text"
                  value={editingEvent.image}
                  onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-white shadow-sm"
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

      {/* Admin Create Event Modal */}
      <AdminCreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newEvent) => {
          fetchEvents();
          showToast(`🎉 สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย!`);
          setSelectedTab('all');
        }}
      />

    </div>
  );
}
