'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Zap,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminSessionStatus } from './AdminSessionStatus';

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
  | 'backup'
  | 'media'
  | 'cache';

interface SidebarModule {
  id: AdminModuleId;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  /** Sample-data screen with no backend yet */
  preview?: boolean;
}

interface SidebarGroup {
  groupLabel: string;
  modules: SidebarModule[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'OVERVIEW',
    modules: [
      { id: 'dashboard', label: 'ภาพรวมเนื้อหา', labelEn: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    groupLabel: 'GOVERNANCE & MASTER',
    modules: [
      { id: 'taxonomy', label: 'Master Taxonomy', labelEn: 'หมวดหมู่ & แท็ก', icon: FolderTree },
      { id: 'provinces', label: '77 จังหวัด & โซน', labelEn: 'Provinces & Zones', icon: MapPin },
      { id: 'venues', label: 'Venues', labelEn: 'ศูนย์ประชุม & ฮอลล์', icon: Building2 },
    ],
  },
  {
    groupLabel: 'DISCOVERY & CONTENT',
    modules: [
      { id: 'spots', label: 'Lifestyle Spots', labelEn: 'พิกัดเที่ยว 77 จังหวัด', icon: Leaf },
      { id: 'community', label: 'Community Meetups', labelEn: 'กิจกรรมชุมชน', icon: Users },
      { id: 'fairs', label: 'Fairs & Expos', labelEn: 'งานมหกรรม', icon: Trophy },
      { id: 'quests', label: 'Quests & Badges', labelEn: 'ชาเลนจ์ & XP', icon: Zap },
    ],
  },
  {
    groupLabel: 'SYSTEM & OPERATIONS',
    modules: [
      { id: 'media', label: 'Media & Image Hub', labelEn: 'ไฟล์รูปภาพ', icon: ImageIcon },
      { id: 'cache', label: 'Cache & Performance', labelEn: 'แคชหน่วยความจำ', icon: Zap },
      { id: 'rbac', label: 'Users & Permissions', labelEn: 'บัญชี & สิทธิ์', icon: ShieldCheck, preview: true },
      { id: 'scraper', label: 'Scraper Engine', labelEn: 'นำเข้าข้อมูลภายนอก', icon: Bot },
      { id: 'backup', label: 'Backup & Audit Logs', labelEn: 'สำรองข้อมูล & บันทึก', icon: Database, preview: true },
    ],
  },
];

interface AdminSidebarProps {
  activeModule: AdminModuleId;
  onModuleChange: (module: AdminModuleId) => void;
}

// Real pending counts for the moderation pillars (refreshed when the active module changes)
function usePendingCounts(activeModule: AdminModuleId) {
  const [pending, setPending] = useState<Partial<Record<AdminModuleId, number>>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async (type: 'community' | 'public_venue') => {
      const res = await fetch(`/api/admin/events?page=1&limit=1&type=${type}`, { cache: 'no-store' });
      if (!res.ok) return 0;
      const data = await res.json();
      return Number(data.counts?.pending) || 0;
    };
    Promise.all([load('community'), load('public_venue')])
      .then(([community, fairs]) => {
        if (!cancelled) setPending({ community, fairs });
      })
      .catch(() => {
        // Counts are a hint only; the moderation view shows the authoritative numbers
      });
    return () => {
      cancelled = true;
    };
  }, [activeModule]);

  return pending;
}

export function AdminSidebar({ activeModule, onModuleChange }: AdminSidebarProps) {
  const pendingCounts = usePendingCounts(activeModule);

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
                      {(pendingCounts[mod.id] ?? 0) > 0 && (
                        <span
                          title="รายการรอตรวจ"
                          className="min-w-[20px] text-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0 tabular-nums"
                        >
                          {pendingCounts[mod.id]}
                        </span>
                      )}
                      {mod.preview && (
                        <span
                          title="ข้อมูลตัวอย่าง ยังไม่เชื่อมต่อระบบจริง"
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 bg-amber-50 text-amber-700 border-amber-200"
                        >
                          ตัวอย่าง
                        </span>
                      )}
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
        <AdminSessionStatus variant="sidebar" />
        <div className="mt-1">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-[#4A7C59] hover:bg-[#EBF3ED] transition-colors text-[12px] font-medium"
          >
            <Home size={12} />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
