'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AdminEventItem } from '@/lib/eventsStore';
import { EventDataSource } from '@/lib/sourcesStore';
import { BANGKOK_ZONES } from '@/data/mockData';
import { ALL_THAI_PROVINCES, SPOT_CATEGORIES, LifestyleSpotItem } from '@/data/spotsData';
import { AdminCreateEventModal } from '@/components/AdminCreateEventModal';
import { resolveSpotImage, isValidImageUrl } from '@/lib/spotImageResolver';
import { AdminSidebar, AdminModuleId } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { TaxonomyManagerView } from '@/components/admin/TaxonomyManagerView';
import { ProvincesManagerView } from '@/components/admin/ProvincesManagerView';
import { VenuesManagerView } from '@/components/admin/VenuesManagerView';
import { QuestsManagerView } from '@/components/admin/QuestsManagerView';
import { RbacUsersView } from '@/components/admin/RbacUsersView';
import { ScraperEngineView } from '@/components/admin/ScraperEngineView';
import { DbBackupView } from '@/components/admin/DbBackupView';
import { EventsModerationView } from '@/components/admin/EventsModerationView';
import { MediaManagerView } from '@/components/admin/MediaManagerView';
import { SystemCacheView } from '@/components/admin/SystemCacheView';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
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
  ChevronDown,
  Lock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 403 Access Guard
// ─────────────────────────────────────────────────────────────
function AccessDeniedScreen({ currentRole, onSwitchRole }: { currentRole: string; onSwitchRole: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
          <Lock size={36} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">403 — Access Denied</h2>
        <p className="text-slate-500 text-sm mb-1">
          Role ปัจจุบันของคุณ (<span className="text-rose-600 font-semibold">{currentRole}</span>) ไม่มีสิทธิ์เข้าถึงส่วนนี้
        </p>
        <p className="text-slate-400 text-xs mb-8">ต้องการสิทธิ์ระดับ Content Editor ขึ้นไป</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onSwitchRole}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <RefreshCw size={14} />
            เปลี่ยน Role (Simulator)
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-sm font-semibold transition-colors hover:bg-slate-50"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPOTS MODULE (Inline, migrated from original admin page)
// ─────────────────────────────────────────────────────────────
interface SpotsModuleProps {
  spots: LifestyleSpotItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onEnrichImages: () => void;
  isEnriching: boolean;
  onDeleteSpot: (id: string) => void;
  onEditSpot: (spot: LifestyleSpotItem) => void;
  onAddSpot: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  provinceFilter: string;
  onProvinceChange: (p: string) => void;
  categoryFilter: string;
  onCategoryChange: (c: string) => void;
  imageFilter: 'all' | 'missing_image';
  onImageFilterChange: (f: 'all' | 'missing_image') => void;
  publicationFilter: 'all' | 'draft' | 'published';
  onPublicationFilterChange: (status: 'all' | 'draft' | 'published') => void;
  onToggleSpotPublication: (spot: LifestyleSpotItem) => void;
}

function SpotsModule({
  spots, isLoading, onRefresh, onEnrichImages, isEnriching,
  onDeleteSpot, onEditSpot, onAddSpot,
  searchQuery, onSearchChange, provinceFilter, onProvinceChange,
  categoryFilter, onCategoryChange, imageFilter, onImageFilterChange,
  publicationFilter, onPublicationFilterChange, onToggleSpotPublication,
}: SpotsModuleProps) {
  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || s.title?.toLowerCase().includes(q) || s.province?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q);
      const matchesProvince = provinceFilter === 'all' || s.province === provinceFilter;
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      const matchesImage = imageFilter === 'all' || !isValidImageUrl(s.image);
      const status = s.publicationStatus === 'draft' ? 'draft' : 'published';
      const matchesPublication = publicationFilter === 'all' || status === publicationFilter;
      return matchesSearch && matchesProvince && matchesCategory && matchesImage && matchesPublication;
    });
  }, [spots, searchQuery, provinceFilter, categoryFilter, imageFilter, publicationFilter]);

  const spotStats = useMemo(() => {
    const missingImages = spots.filter((s) => !isValidImageUrl(s.image)).length;
    const drafts = spots.filter((spot) => spot.publicationStatus === 'draft').length;
    return { total: spots.length, missing: missingImages, shown: filteredSpots.length, drafts };
  }, [spots, filteredSpots]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass size={18} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">Lifestyle Spots</h1>
          </div>
          <p className="text-slate-500 text-sm">จัดการข้อมูลสถานที่เที่ยวและจุดฮีลใจทั่ว 77 จังหวัด</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onEnrichImages}
            disabled={isEnriching}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <ImageIcon size={14} />
            {isEnriching ? 'กำลังเติมรูป...' : 'AI เติมรูป'}
          </button>
          <button
            onClick={onAddSpot}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} />
            เพิ่มสถานที่
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'สถานที่ทั้งหมด', value: spotStats.total, color: 'text-slate-950 border-slate-200' },
          { label: 'รายการที่แสดง', value: spotStats.shown, color: 'text-blue-900 border-blue-100' },
          { label: 'แบบร่าง', value: spotStats.drafts, color: 'text-amber-900 border-amber-200' },
          { label: 'รูปภาพขาดหาย', value: spotStats.missing, color: 'text-rose-900 border-rose-200' },
        ].map((s) => (
          <div key={s.label} className={`border-l-2 bg-white py-1 pl-3 ${s.color}`}>
            <p className="text-xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาสถานที่..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 shadow-xs"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:border-[#4A7C59]/50 shadow-xs"
        >
          <option value="all">ทุกหมวดหมู่</option>
          {SPOT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select
          value={provinceFilter}
          onChange={(e) => onProvinceChange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:border-[#4A7C59]/50 shadow-xs"
        >
          <option value="all">ทุกจังหวัด</option>
          {ALL_THAI_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={publicationFilter}
          onChange={(e) => onPublicationFilterChange(e.target.value as 'all' | 'draft' | 'published')}
          aria-label="กรองสถานะการเผยแพร่"
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:border-[#4A7C59]/50 shadow-xs"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">แบบร่าง</option>
        </select>
        <button
          onClick={() => onImageFilterChange(imageFilter === 'all' ? 'missing_image' : 'all')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            imageFilter === 'missing_image'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          {imageFilter === 'missing_image' ? '📷 รูปขาดหาย' : '📷 ทั้งหมด'}
        </button>
      </div>

      {/* Spots Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSpots.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">ไม่พบสถานที่ที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            filteredSpots.map((spot) => {
              const hasImage = isValidImageUrl(spot.image);
              return (
                <div
                  key={spot.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-3 last:border-b-0 sm:flex sm:items-center sm:gap-4 sm:px-4"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    {hasImage ? (
                      <img src={spot.image} alt={spot.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50">
                        <ImageIcon size={16} className="text-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 font-semibold text-sm truncate">{spot.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-400 text-xs">{spot.province}</span>
                      {spot.district && <span className="text-slate-300 text-xs">· {spot.district}</span>}
                      {spot.category && (
                        <span className="px-1.5 py-0.5 bg-[#EBF3ED] text-[#4A7C59] border border-[#4A7C59]/20 rounded text-[10px] font-semibold">
                          {SPOT_CATEGORIES.find((c) => c.id === spot.category)?.label || spot.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Image Status */}
                  <div className="col-span-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:ml-auto sm:col-span-auto sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${spot.publicationStatus === 'draft' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                        {spot.publicationStatus === 'draft' ? 'แบบร่าง' : 'เผยแพร่'}
                      </span>
                      <span className="text-[11px] text-slate-500">รูป</span>
                    {hasImage ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-400" />
                    )}
                    </div>

                    <button
                      onClick={() => onToggleSpotPublication(spot)}
                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                      aria-label={spot.publicationStatus === 'draft' ? `เผยแพร่ ${spot.title}` : `ถอนเผยแพร่ ${spot.title}`}
                    >
                      {spot.publicationStatus === 'draft' ? 'เผยแพร่' : 'ถอนเผยแพร่'}
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditSpot(spot)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteSpot(spot.id)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
function AdminConsole() {
  const [activeModule, setActiveModule] = useState<AdminModuleId>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('Super Admin');
  const [headerSearch, setHeaderSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ── Spots State ──
  const [spots, setSpots] = useState<LifestyleSpotItem[]>([]);
  const [isSpotsLoading, setIsSpotsLoading] = useState<boolean>(true);
  const [spotSearchQuery, setSpotSearchQuery] = useState<string>('');
  const [spotProvinceFilter, setSpotProvinceFilter] = useState<string>('all');
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<string>('all');
  const [spotImageFilter, setSpotImageFilter] = useState<'all' | 'missing_image'>('all');
  const [spotPublicationFilter, setSpotPublicationFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [isEnrichingImages, setIsEnrichingImages] = useState<boolean>(false);
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

  // ── Toast ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Fetch Spots ──
  const fetchSpots = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/spots');
      const data = await res.json();
      if (data.success) setSpots(data.spots);
    } catch (err) {
      console.error('Failed to fetch admin spots:', err);
    } finally {
      setIsSpotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // ── Spot Actions ──
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
        body: JSON.stringify({ action: 'create', newSpot: { ...newSpotForm, publicationStatus: 'draft' } }),
      });
      const data = await res.json();
      if (data.success) {
        setSpots(data.spots);
        setShowAddSpotModal(false);
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
        body: JSON.stringify({ action: 'update', spotId: editingSpot.id, updatedFields: editingSpot }),
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

  const handleToggleSpotPublication = async (spot: LifestyleSpotItem) => {
    const publicationStatus = spot.publicationStatus === 'draft' ? 'published' : 'draft';
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', spotId: spot.id, updatedFields: { publicationStatus } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to update spot status');
      setSpots(data.spots);
      showToast(publicationStatus === 'published' ? 'เผยแพร่สถานที่แล้ว' : 'ย้ายสถานที่เป็นแบบร่างแล้ว');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // ── Access Guard — Member role blocked ──
  const isBlocked = currentRole === 'Member';

  // ── Render Active Module ──
  const renderModule = () => {
    if (isBlocked) {
      return (
        <AccessDeniedScreen
          currentRole={currentRole}
          onSwitchRole={() => setCurrentRole('Super Admin')}
        />
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <AdminDashboardView onNavigate={setActiveModule} />;
      case 'taxonomy':
        return <TaxonomyManagerView />;
      case 'provinces':
        return <ProvincesManagerView />;
      case 'venues':
        return <VenuesManagerView />;
      case 'spots':
        return (
          <SpotsModule
            spots={spots}
            isLoading={isSpotsLoading}
            onRefresh={fetchSpots}
            onEnrichImages={handleAutoEnrichImages}
            isEnriching={isEnrichingImages}
            onDeleteSpot={handleDeleteSpot}
            onEditSpot={setEditingSpot}
            onAddSpot={() => setShowAddSpotModal(true)}
            searchQuery={spotSearchQuery}
            onSearchChange={setSpotSearchQuery}
            provinceFilter={spotProvinceFilter}
            onProvinceChange={setSpotProvinceFilter}
            categoryFilter={spotCategoryFilter}
            onCategoryChange={setSpotCategoryFilter}
            imageFilter={spotImageFilter}
            onImageFilterChange={setSpotImageFilter}
            publicationFilter={spotPublicationFilter}
            onPublicationFilterChange={setSpotPublicationFilter}
            onToggleSpotPublication={handleToggleSpotPublication}
          />
        );
      case 'community':
        return <EventsModerationView type="community" />;
      case 'fairs':
        return <EventsModerationView type="fairs" />;
      case 'quests':
        return <QuestsManagerView />;
      case 'rbac':
        return currentRole === 'Super Admin'
          ? <RbacUsersView />
          : <AccessDeniedScreen currentRole={currentRole} onSwitchRole={() => setCurrentRole('Super Admin')} />;
      case 'scraper':
        return <ScraperEngineView />;
      case 'media':
        return <MediaManagerView />;
      case 'cache':
        return <SystemCacheView />;
      case 'backup':
        return currentRole === 'Super Admin'
          ? <DbBackupView />
          : <AccessDeniedScreen currentRole={currentRole} onSwitchRole={() => setCurrentRole('Super Admin')} />;
      default:
        return <AdminDashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7]" style={{ fontFamily: "'IBM Plex Sans Thai', 'Plus Jakarta Sans', sans-serif" }}>
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="ปิดเมนูผู้ดูแลระบบ"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}
      <div className="flex min-h-screen">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <AdminSidebar
            activeModule={activeModule}
            onModuleChange={(module) => {
              setActiveModule(module);
              setIsMobileSidebarOpen(false);
            }}
            currentRole={currentRole}
            onRoleChange={() => {
              const roles = ['Super Admin', 'Content Editor', 'Moderator', 'Organizer', 'Member'];
              const currentIdx = roles.indexOf(currentRole);
              setCurrentRole(roles[(currentIdx + 1) % roles.length]);
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader
            activeModule={activeModule}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            searchQuery={headerSearch}
            onSearchChange={setHeaderSearch}
            showSearch={activeModule === 'spots'}
            onOpenNavigation={() => setIsMobileSidebarOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">
              {renderModule()}
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl shadow-lg shadow-slate-200/60 text-sm font-medium animate-fade-in max-w-xs">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Edit Spot Modal ── */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-slate-800 font-bold text-base">แก้ไขสถานที่</h3>
              <button onClick={() => setEditingSpot(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditSpot} className="p-6 space-y-4">
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">ชื่อสถานที่</label>
                <input
                  type="text"
                  value={editingSpot.title}
                  onChange={(e) => setEditingSpot({ ...editingSpot, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">จังหวัด</label>
                  <select
                    value={editingSpot.province}
                    onChange={(e) => setEditingSpot({ ...editingSpot, province: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  >
                    {ALL_THAI_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">ย่าน / อำเภอ</label>
                  <input
                    type="text"
                    value={editingSpot.district || ''}
                    onChange={(e) => setEditingSpot({ ...editingSpot, district: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">URL รูปภาพ</label>
                <input
                  type="text"
                  value={editingSpot.image || ''}
                  onChange={(e) => setEditingSpot({ ...editingSpot, image: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingSpot(null)} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-100 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Spot Modal ── */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-slate-800 font-bold text-base">เพิ่มสถานที่ใหม่</h3>
              <button onClick={() => setShowAddSpotModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSpot} className="p-6 space-y-4">
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">ชื่อสถานที่ *</label>
                <input
                  type="text"
                  required
                  value={newSpotForm.title}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20"
                  placeholder="ชื่อสถานที่"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">หมวดหมู่</label>
                  <select
                    value={newSpotForm.category}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  >
                    {SPOT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">จังหวัด</label>
                  <select
                    value={newSpotForm.province}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, province: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  >
                    {ALL_THAI_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">URL รูปภาพ</label>
                <input
                  type="text"
                  value={newSpotForm.image}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, image: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#4A7C59]/50"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">เวลาทำการ</label>
                <input
                  type="text"
                  value={newSpotForm.openHours}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, openHours: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSpotModal(false)} className="flex-1 py-2.5 bg-slate-700/60 text-slate-300 rounded-xl text-sm font-semibold border border-slate-600/40 hover:bg-slate-700 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  เพิ่มสถานที่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminConsole />
    </AdminAuthGate>
  );
}
