'use client';

import React from 'react';
import { Search, ChevronRight, Server, Menu } from 'lucide-react';
import { AdminModuleId, SIDEBAR_GROUPS } from './AdminSidebar';
import { AdminSessionStatus } from './AdminSessionStatus';

interface AdminHeaderProps {
  activeModule: AdminModuleId;
  onOpenSearch?: () => void;
  onOpenNavigation?: () => void;
}

// Breadcrumbs come from the sidebar groups so labels live in one place
const MODULE_BREADCRUMBS = Object.fromEntries(
  SIDEBAR_GROUPS.flatMap((group) => group.modules.map((mod) => [mod.id, { parent: group.groupLabel ?? 'Admin', label: mod.label }]))
) as Record<AdminModuleId, { parent: string; label: string }>;

export function AdminHeader({ activeModule, onOpenSearch, onOpenNavigation }: AdminHeaderProps) {
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

      {/* Global search (also Ctrl/⌘ + K) */}
      {onOpenSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="ค้นหาในระบบผู้ดูแล"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:w-64"
        >
          <Search size={14} className="shrink-0" />
          <span className="hidden flex-1 text-left md:block">ค้นหา...</span>
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold md:block">Ctrl K</kbd>
        </button>
      )}

      {/* Environment Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
        <Server size={11} className="text-slate-500" />
        <span className="text-[10px] font-bold text-slate-600 tracking-wide hidden sm:block">
          {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
        </span>
      </div>

      {/* Real, server-verified admin session */}
      <AdminSessionStatus variant="header" />
    </header>
  );
}
