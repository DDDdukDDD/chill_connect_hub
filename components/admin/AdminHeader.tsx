'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronRight,
  Shield,
  Server,
  RefreshCw,
} from 'lucide-react';
import { AdminModuleId } from './AdminSidebar';

interface AdminHeaderProps {
  activeModule: AdminModuleId;
  currentRole: string;
  onRoleChange: (role: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearch?: boolean;
}

const MODULE_BREADCRUMBS: Record<AdminModuleId, { parent: string; label: string }> = {
  dashboard:  { parent: 'Chill & Connect Hub', label: 'แดชบอร์ด' },
  taxonomy:   { parent: 'Governance & Master', label: 'Master Taxonomy Hub' },
  provinces:  { parent: 'Governance & Master', label: '77 จังหวัด & โซน' },
  venues:     { parent: 'Governance & Master', label: 'Venue Master Hub' },
  spots:      { parent: 'Discovery & Content', label: 'Lifestyle Spots' },
  community:  { parent: 'Discovery & Content', label: 'Community Meetups' },
  fairs:      { parent: 'Discovery & Content', label: 'Fairs & Expos' },
  quests:     { parent: 'Discovery & Content', label: 'Quests & Badges Engine' },
  rbac:       { parent: 'System & Operations', label: 'Users & Permissions' },
  scraper:    { parent: 'System & Operations', label: 'Scraper & Aggregator' },
  backup:     { parent: 'System & Operations', label: 'Backup & Audit Logs' },
};

const AVAILABLE_ROLES = [
  'Super Admin',
  'Content Editor',
  'Moderator',
  'Organizer',
  'Member',
];

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Super Admin':    { bg: 'bg-[#EBF3ED]',    text: 'text-[#2D5A3C]', border: 'border-[#4A7C59]/30', dot: 'bg-[#4A7C59]' },
  'Content Editor': { bg: 'bg-sky-50',        text: 'text-sky-700',   border: 'border-sky-200',      dot: 'bg-sky-500' },
  'Moderator':      { bg: 'bg-amber-50',      text: 'text-amber-700', border: 'border-amber-200',    dot: 'bg-amber-500' },
  'Organizer':      { bg: 'bg-emerald-50',    text: 'text-emerald-700',border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Member':         { bg: 'bg-slate-100',     text: 'text-slate-500', border: 'border-slate-200',    dot: 'bg-slate-400' },
};

export function AdminHeader({
  activeModule,
  currentRole,
  onRoleChange,
  searchQuery = '',
  onSearchChange,
  showSearch = false,
}: AdminHeaderProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const crumb = MODULE_BREADCRUMBS[activeModule];
  const roleStyle = ROLE_STYLES[currentRole] || ROLE_STYLES['Member'];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70 px-6 py-3 flex items-center gap-4">
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
        <span className="text-[10px] font-bold text-[#2D5A3C] tracking-wide hidden sm:block">Production v2.1</span>
      </div>

      {/* Role Simulator */}
      <div className="relative">
        <button
          onClick={() => setRoleDropdownOpen((v) => !v)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
        >
          <Shield size={11} />
          <span className="hidden sm:block">{currentRole}</span>
          <RefreshCw size={10} className="opacity-50" />
        </button>
        {roleDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Simulator</p>
            </div>
            {AVAILABLE_ROLES.map((role) => {
              const rs = ROLE_STYLES[role];
              return (
                <button
                  key={role}
                  onClick={() => { onRoleChange(role); setRoleDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 ${
                    currentRole === role ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${rs?.dot}`} />
                  <span className={currentRole === role ? rs?.text : 'text-slate-600'}>{role}</span>
                  {currentRole === role && (
                    <span className="ml-auto text-[9px] text-slate-400 font-medium">active</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Bell */}
      <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <Bell size={15} />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#F26430] border-2 border-white" />
      </button>
    </header>
  );
}
