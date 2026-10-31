'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminSidebar, AdminModuleId, MODULE_PERMISSIONS, ADMIN_FILTER_PARAMS, type AdminModuleFilters } from '@/components/admin/AdminSidebar';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { TaxonomyManagerView } from '@/components/admin/TaxonomyManagerView';
import { ProvincesManagerView } from '@/components/admin/ProvincesManagerView';
import { VenuesManagerView } from '@/components/admin/VenuesManagerView';
import { QuestsManagerView } from '@/components/admin/QuestsManagerView';
import { CampaignsManagerView } from '@/components/admin/CampaignsManagerView';
import { SponsoredSlotsView } from '@/components/admin/SponsoredSlotsView';
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
import { CoverageView } from '@/components/admin/CoverageView';
import { FeaturedRailsView } from '@/components/admin/FeaturedRailsView';
import { MembersManagerView } from '@/components/admin/MembersManagerView';
import { MomentsManagerView } from '@/components/admin/MomentsManagerView';
import { ReportsManagerView } from '@/components/admin/ReportsManagerView';

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

function readFiltersFromUrl(): AdminModuleFilters {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(ADMIN_FILTER_PARAMS.flatMap((key) => (params.get(key) ? [[key, params.get(key)!]] : [])));
}

function AdminConsole() {
  // Rendered only on the client after AdminAuthGate has verified the session
  const [activeModule, setActiveModuleState] = useState<AdminModuleId>(readModuleFromUrl);
  const [moduleFilters, setModuleFilters] = useState<AdminModuleFilters>(readFiltersFromUrl);
  // Bumped on every navigation so picking a filter for the module already open still re-applies it
  const [navigationId, setNavigationId] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const setActiveModule = useCallback((module: AdminModuleId, filters: AdminModuleFilters = {}) => {
    setNavigationId((id) => id + 1);
    setActiveModuleState(module);
    setModuleFilters(filters);
    const params = new URLSearchParams(window.location.search);
    if (module === 'dashboard') params.delete('m');
    else params.set('m', module);
    for (const key of ADMIN_FILTER_PARAMS) {
      if (filters[key]) params.set(key, filters[key]!);
      else params.delete(key);
    }
    const query = params.toString();
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      setActiveModuleState(readModuleFromUrl());
      setModuleFilters(readFiltersFromUrl());
      setNavigationId((id) => id + 1);
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Ctrl/⌘ + K opens the global search from anywhere in the console
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
    // Remount on each navigation so a view starts from the filters it was handed
    const key = `${activeModule}-${navigationId}`;
    switch (activeModule) {
      case 'dashboard':
        return <AdminDashboardView onNavigate={setActiveModule} />;
      case 'review':
        return <ReviewQueueView key={key} onNavigate={setActiveModule} initialPillar={moduleFilters.pillar} />;
      case 'members':
        return <MembersManagerView key={key} initialQuery={moduleFilters.q} initialQueue={moduleFilters.queue} />;
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
      case 'rails':
        return <FeaturedRailsView />;
      case 'spots':
        return (
          <SpotsManagerView
            key={key}
            showToast={showToast}
            initialProvince={moduleFilters.province}
            initialCategory={moduleFilters.vibe}
            initialQuery={moduleFilters.q}
            initialImage={moduleFilters.image}
          />
        );
      case 'community':
        return <EventsModerationView key={key} type="community" initialQuery={moduleFilters.q} />;
      case 'fairs':
        return <EventsModerationView key={key} type="fairs" initialQuery={moduleFilters.q} />;
      case 'quests':
        return <QuestsManagerView key={key} initialQuery={moduleFilters.q} />;
      case 'campaigns':
        return <CampaignsManagerView />;
      case 'sponsored':
        return <SponsoredSlotsView />;
      case 'moments':
        return <MomentsManagerView key={key} initialFilter={moduleFilters.filter} />;
      case 'reports':
        return <ReportsManagerView onNavigate={setActiveModule} />;
      case 'scraper':
        return <ScraperEngineView key={key} initialProvince={moduleFilters.province} />;
      case 'coverage':
        return (
          <CoverageView
            onOpenSpots={(filters) => setActiveModule('spots', filters)}
            onScanProvince={(province) => setActiveModule('scraper', { province })}
          />
        );
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
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNavigation={() => setIsMobileSidebarOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">
              {renderModule()}
            </div>
          </main>
        </div>
      </div>

      {isSearchOpen && <AdminCommandPalette onClose={() => setIsSearchOpen(false)} onNavigate={setActiveModule} />}

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
