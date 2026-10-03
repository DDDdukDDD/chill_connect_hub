'use client';

import React from 'react';
import { Search, ChevronRight, Server, Menu } from 'lucide-react';
import { AdminModuleId } from './AdminSidebar';
import { AdminSessionStatus } from './AdminSessionStatus';

interface AdminHeaderProps {
  activeModule: AdminModuleId;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearch?: boolean;
  onOpenNavigation?: () => void;
}

const MODULE_BREADCRUMBS: Record<AdminModuleId, { parent: string; label: string }> = {
  dashboard:  { parent: 'Overview', label: 'ภาพรวมเนื้อหา' },
  taxonomy:   { parent: 'Governance & Master', label: 'Master Taxonomy' },
  provinces:  { parent: 'Governance & Master', label: '77 จังหวัด & โซน' },
  venues:     { parent: 'Governance & Master', label: 'Venues' },
  spots:      { parent: 'Discovery & Content', label: 'Lifestyle Spots' },
  community:  { parent: 'Discovery & Content', label: 'Community Meetups' },
  fairs:      { parent: 'Discovery & Content', label: 'Fairs & Expos' },
  quests:     { parent: 'Discovery & Content', label: 'Quests & Badges' },
  rbac:       { parent: 'System & Operations', label: 'Users & Permissions' },
  scraper:    { parent: 'System & Operations', label: 'Scraper Engine' },
  media:      { parent: 'System & Operations', label: 'Media & Image Hub' },
  cache:      { parent: 'System & Operations', label: 'Cache & Performance' },
  backup:     { parent: 'System & Operations', label: 'Backup & Audit Logs' },
};

export function AdminHeader({
  activeModule,
  searchQuery = '',
  onSearchChange,
  showSearch = false,
  onOpenNavigation,
}: AdminHeaderProps) {
  const crumb = MODULE_BREADCRUMBS[activeModule];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/70 bg-white/95 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenNavigation}
        aria-label="เปิดเมนูผู้ดูแลระบบ"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        <Menu size={16} />
      </button>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-slate-400 text-xs font-medium hidden sm:block truncate">{crumb.parent}</span>
        <ChevronRight size={12} className="text-slate-300 shrink-0 hidden sm:block" />
        <span className="text-slate-700 text-sm font-semibold truncate">{crumb.label}</span>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative hidden md:flex items-center">
          <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 w-52 transition-all"
          />
        </div>
      )}

      {/* Environment Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EBF3ED] border border-[#4A7C59]/20 rounded-lg">
        <Server size={11} className="text-[#4A7C59]" />
        <span className="text-[10px] font-bold text-[#2D5A3C] tracking-wide hidden sm:block">
          {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
        </span>
      </div>

      {/* Real, server-verified admin session */}
      <AdminSessionStatus variant="header" />
    </header>
  );
}
