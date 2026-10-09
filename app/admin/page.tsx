'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminSidebar, AdminModuleId, MODULE_PERMISSIONS } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { TaxonomyManagerView } from '@/components/admin/TaxonomyManagerView';
import { ProvincesManagerView } from '@/components/admin/ProvincesManagerView';
import { VenuesManagerView } from '@/components/admin/VenuesManagerView';
import { QuestsManagerView } from '@/components/admin/QuestsManagerView';
import { ScraperEngineView } from '@/components/admin/ScraperEngineView';
import { EventsModerationView } from '@/components/admin/EventsModerationView';
import { MediaManagerView } from '@/components/admin/MediaManagerView';
import { SystemCacheView } from '@/components/admin/SystemCacheView';
import { AdminAuthGate, useAdminSession } from '@/components/admin/AdminAuthGate';
import { ReviewQueueView } from '@/components/admin/ReviewQueueView';
import { StaffManagerView } from '@/components/admin/StaffManagerView';
import { AuditLogView } from '@/components/admin/AuditLogView';
import { AdminEmptyState } from '@/components/admin/AdminUI';
import { SpotsManagerView } from '@/components/admin/SpotsManagerView';

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
const ADMIN_MODULE_IDS = Object.keys(MODULE_PERMISSIONS) as AdminModuleId[];

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

  // ── Toast ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { can } = useAdminSession();

  // ── Render Active Module ──
  const renderModule = () => {
    // The API enforces permissions; this only avoids showing a screen the role cannot use
    if (!can(MODULE_PERMISSIONS[activeModule])) {
      return <AdminEmptyState>บัญชีของคุณไม่มีสิทธิ์เปิดหน้านี้</AdminEmptyState>;
    }
    switch (activeModule) {
      case 'dashboard':
        return <AdminDashboardView onNavigate={setActiveModule} />;
      case 'review':
        return <ReviewQueueView onNavigate={setActiveModule} />;
      case 'staff':
        return <StaffManagerView />;
      case 'audit':
        return <AuditLogView />;
      case 'taxonomy':
        return <TaxonomyManagerView />;
      case 'provinces':
        return <ProvincesManagerView />;
      case 'venues':
        return <VenuesManagerView />;
      case 'spots':
        return (
          <SpotsManagerView showToast={showToast} />
        );
      case 'community':
        return <EventsModerationView key="community" type="community" />;
      case 'fairs':
        return <EventsModerationView key="fairs" type="fairs" />;
      case 'quests':
        return <QuestsManagerView />;
      case 'scraper':
        return <ScraperEngineView />;
      case 'media':
        return <MediaManagerView />;
      case 'cache':
        return <SystemCacheView />;
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
