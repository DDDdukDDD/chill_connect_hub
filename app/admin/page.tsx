'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ALL_THAI_PROVINCES, SPOT_CATEGORIES, LifestyleSpotItem } from '@/data/spotsData';
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
import { SpotsManagerView } from '@/components/admin/SpotsManagerView';
import { handleAdminUnauthorized } from '@/components/admin/adminAuthUtils';
import {
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
const ADMIN_MODULE_IDS: readonly AdminModuleId[] = [
  'dashboard', 'taxonomy', 'provinces', 'venues', 'spots', 'community', 'fairs',
  'quests', 'rbac', 'scraper', 'backup', 'media', 'cache',
];

// The active module lives in the URL (?m=spots) so refresh, shared links and back/forward work
function readModuleFromUrl(): AdminModuleId {
  if (typeof window === 'undefined') return 'dashboard';
  const requested = new URLSearchParams(window.location.search).get('m');
  return ADMIN_MODULE_IDS.find((id) => id === requested) ?? 'dashboard';
}

function AdminConsole() {
  // Rendered only on the client after AdminAuthGate has verified the session
  const [activeModule, setActiveModuleState] = useState<AdminModuleId>(readModuleFromUrl);

  const setActiveModule = useCallback((module: AdminModuleId) => {
    setActiveModuleState(module);
    const params = new URLSearchParams(window.location.search);
    if (module === 'dashboard') params.delete('m');
    else params.set('m', module);
    const query = params.toString();
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  useEffect(() => {
    const syncFromUrl = () => setActiveModuleState(readModuleFromUrl());
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ── Spots: list lives in SpotsManagerView; this page owns the create/edit modals ──
  const [spotsReloadToken, setSpotsReloadToken] = useState(0);
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

  // ── Spot create / edit (list refreshes via spotsReloadToken) ──
  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', newSpot: { ...newSpotForm, publicationStatus: 'draft' } }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setSpotsReloadToken((token) => token + 1);
        setShowAddSpotModal(false);
        showToast('เพิ่มสถานที่เป็นแบบร่างเรียบร้อยแล้ว');
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
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
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setSpotsReloadToken((token) => token + 1);
        setEditingSpot(null);
        showToast('อัปเดตข้อมูลสถานที่เรียบร้อยแล้ว');
      } else {
        showToast(data.error || 'บันทึกสถานที่ไม่สำเร็จ');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกสถานที่');
    }
  };

  // ── Render Active Module ──
  const renderModule = () => {
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
          <SpotsManagerView
            onEditSpot={setEditingSpot}
            onAddSpot={() => setShowAddSpotModal(true)}
            reloadToken={spotsReloadToken}
            showToast={showToast}
          />
        );
      case 'community':
        return <EventsModerationView key="community" type="community" />;
      case 'fairs':
        return <EventsModerationView key="fairs" type="fairs" />;
      case 'quests':
        return <QuestsManagerView />;
      case 'rbac':
        return <RbacUsersView />;
      case 'scraper':
        return <ScraperEngineView />;
      case 'media':
        return <MediaManagerView />;
      case 'cache':
        return <SystemCacheView />;
      case 'backup':
        return <DbBackupView />;
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
          />
        </div>

        {/* Main Content Area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader
            activeModule={activeModule}
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
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, category: e.target.value as typeof newSpotForm.category })}
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
