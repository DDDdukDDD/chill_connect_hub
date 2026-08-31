'use client';

import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  MapPin,
  Building2,
  Leaf,
  Users,
  Trophy,
  ShieldCheck,
  Bot,
  Database,
  ChevronRight,
  Zap,
  Crown,
  LogOut,
  Settings,
  Home,
} from 'lucide-react';

export type AdminModuleId =
  | 'dashboard'
  | 'taxonomy'
  | 'provinces'
  | 'venues'
  | 'spots'
  | 'community'
  | 'fairs'
  | 'quests'
  | 'rbac'
  | 'scraper'
  | 'backup';

interface SidebarModule {
  id: AdminModuleId;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface SidebarGroup {
  groupLabel: string;
  modules: SidebarModule[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'OVERVIEW',
    modules: [
      { id: 'dashboard', label: 'แดชบอร์ด', labelEn: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    groupLabel: 'GOVERNANCE & MASTER',
    modules: [
      { id: 'taxonomy', label: 'Master Taxonomy Hub', labelEn: 'Categories & Tags', icon: FolderTree },
      { id: 'provinces', label: '77 จังหวัด & โซน', labelEn: 'Provinces & Zones', icon: MapPin },
      { id: 'venues', label: 'Venue Master Hub', labelEn: 'Convention Centers', icon: Building2 },
    ],
  },
  {
    groupLabel: 'DISCOVERY & CONTENT',
    modules: [
      { id: 'spots', label: 'Lifestyle Spots', labelEn: '77 Provinces', icon: Leaf, badge: 'Content' },
      { id: 'community', label: 'Community Meetups', labelEn: 'กิจกรรมชุมชน', icon: Users, badge: 'Moderation' },
      { id: 'fairs', label: 'Fairs & Expos', labelEn: 'งานมหกรรม', icon: Trophy },
      { id: 'quests', label: 'Quests & Badges', labelEn: 'ชาเลนจ์ & EXP', icon: Zap },
    ],
  },
  {
    groupLabel: 'SYSTEM & OPERATIONS',
    modules: [
      { id: 'rbac', label: 'Users & Permissions', labelEn: 'Role Management', icon: ShieldCheck },
      { id: 'scraper', label: 'Scraper Engine', labelEn: 'Aggregator & Bots', icon: Bot },
      { id: 'backup', label: 'Backup & Audit Logs', labelEn: 'Database & Logs', icon: Database },
    ],
  },
];

interface AdminSidebarProps {
  activeModule: AdminModuleId;
  onModuleChange: (module: AdminModuleId) => void;
  currentRole: string;
  onRoleChange?: () => void;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Super Admin':    { bg: 'bg-sage/10',           text: 'text-[#2D5A3C]',  dot: 'bg-[#4A7C59]' },
  'Content Editor': { bg: 'bg-sky-50',             text: 'text-sky-700',    dot: 'bg-sky-500' },
  'Moderator':      { bg: 'bg-amber-50',           text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Organizer':      { bg: 'bg-emerald-50',         text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Member':         { bg: 'bg-slate-100',          text: 'text-slate-500',  dot: 'bg-slate-400' },
};

export function AdminSidebar({ activeModule, onModuleChange, currentRole, onRoleChange }: AdminSidebarProps) {
  const roleStyle = ROLE_COLORS[currentRole] || ROLE_COLORS['Member'];

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 h-screen sticky top-0 overflow-y-auto shadow-sm">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A7C59] to-[#3B6347] flex items-center justify-center shadow-md shadow-[#4A7C59]/20">
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Chill & Connect</p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <p className="px-2 mb-1.5 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
              {group.groupLabel}
            </p>
            <ul className="space-y-0.5">
              {group.modules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <li key={mod.id}>
                    <button
                      onClick={() => onModuleChange(mod.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#EBF3ED] text-[#2D5A3C]'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={`shrink-0 ${
                          isActive
                            ? 'text-[#4A7C59]'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate leading-tight ${
                          isActive ? 'text-[#2D5A3C]' : ''
                        }`}>
                          {mod.label}
                        </p>
                        <p className={`text-[10px] truncate ${
                          isActive ? 'text-[#4A7C59]/70' : 'text-slate-400'
                        }`}>
                          {mod.labelEn}
                        </p>
                      </div>
                      {mod.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                          isActive
                            ? 'bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {mod.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="w-1 h-5 rounded-full bg-[#4A7C59] shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile / Role Badge */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={onRoleChange}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
          title="Switch Role"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200">
            <Crown size={13} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-slate-700 truncate">Admin User</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
              <p className={`text-[10px] font-semibold ${roleStyle.text}`}>{currentRole}</p>
            </div>
          </div>
          <Settings size={13} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
        </button>
        <div className="mt-1">
          <a
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-[#4A7C59] hover:bg-[#EBF3ED] transition-colors text-[12px] font-medium"
          >
            <Home size={12} />
            <span>กลับหน้าหลัก</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
