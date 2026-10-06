'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  FolderTree,
  MapPin,
  Building2,
  Users,
  Trophy,
  Leaf,
  Zap,
  Bot,
  Gauge,
  Home,
  Image as ImageIcon,
  ShieldCheck,
  History,
} from 'lucide-react';
import type { AdminPermission } from '@/lib/permissions';
import { AdminSessionStatus } from './AdminSessionStatus';
import { useAdminSession } from './AdminAuthGate';

export type AdminModuleId =
  | 'dashboard'
  | 'review'
  | 'community'
  | 'fairs'
  | 'spots'
  | 'quests'
  | 'scraper'
  | 'taxonomy'
  | 'provinces'
  | 'venues'
  | 'staff'
  | 'audit'
  | 'media'
  | 'cache';

interface SidebarModule {
  id: AdminModuleId;
  label: string;
  icon: React.ElementType;
  /** Pillar identity dot (colors belong on badges, never on buttons) */
  pillarColor?: string;
}

interface SidebarGroup {
  groupLabel: string | null;
  modules: SidebarModule[];
}

// Grouped by the admin's workflow: overview → review → content per pillar → sources → master data → people → system
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: null,
    modules: [
      { id: 'dashboard', label: 'ภาพรวมวันนี้', icon: LayoutDashboard },
      { id: 'review', label: 'คิวตรวจ', icon: Inbox },
    ],
  },
  {
    groupLabel: 'เนื้อหา',
    modules: [
      { id: 'community', label: 'กิจกรรมคอมมูนิตี้', icon: Users, pillarColor: '#F26430' },
      { id: 'fairs', label: 'งานมหกรรม & เอ็กซ์โป', icon: Trophy, pillarColor: '#2B527A' },
      { id: 'spots', label: 'พิกัดเที่ยว 77 จังหวัด', icon: Leaf, pillarColor: '#4A7C59' },
      { id: 'quests', label: 'ชาเลนจ์ & ภารกิจ', icon: Zap, pillarColor: '#7C3AED' },
    ],
  },
  {
    groupLabel: 'แหล่งข้อมูล',
    modules: [{ id: 'scraper', label: 'การดึงข้อมูล', icon: Bot }],
  },
  {
    groupLabel: 'ข้อมูลหลัก',
    modules: [
      { id: 'taxonomy', label: 'หมวดหมู่ & แท็ก', icon: FolderTree },
      { id: 'provinces', label: '77 จังหวัด & โซน', icon: MapPin },
      { id: 'venues', label: 'สถานที่จัดงาน', icon: Building2 },
    ],
  },
  {
    groupLabel: 'ผู้ใช้',
    modules: [
      { id: 'staff', label: 'ทีมงาน & สิทธิ์', icon: ShieldCheck },
      { id: 'audit', label: 'บันทึกการกระทำ', icon: History },
    ],
  },
  {
    groupLabel: 'ระบบ',
    modules: [
      { id: 'media', label: 'คลังรูปภาพ', icon: ImageIcon },
      { id: 'cache', label: 'Cache & ประสิทธิภาพ', icon: Gauge },
    ],
  },
];

/** Permission needed to open each module; the API enforces the same rules on every action */
export const MODULE_PERMISSIONS: Record<AdminModuleId, AdminPermission> = {
  dashboard: 'content.view',
  review: 'content.view',
  community: 'content.view',
  fairs: 'content.view',
  spots: 'content.view',
  quests: 'content.view',
  scraper: 'content.view',
  taxonomy: 'content.view',
  provinces: 'content.view',
  venues: 'content.view',
  staff: 'staff.manage',
  audit: 'audit.view',
  media: 'content.view',
  cache: 'content.view',
};

interface AdminSidebarProps {
  activeModule: AdminModuleId;
  onModuleChange: (module: AdminModuleId) => void;
}

// Real review-queue counts (refreshed when the active module changes)
function useQueueCounts(activeModule: AdminModuleId) {
  const [counts, setCounts] = useState<Partial<Record<AdminModuleId, number>>>({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/review?limit=1', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.counts) return;
        setCounts({ review: data.counts.all, community: data.counts.community, fairs: data.counts.fairs, spots: data.counts.spots });
      })
      .catch(() => {
        // Counts are a hint only; the review queue shows the authoritative numbers
      });
    return () => {
      cancelled = true;
    };
  }, [activeModule]);

  return counts;
}

export function AdminSidebar({ activeModule, onModuleChange }: AdminSidebarProps) {
  const counts = useQueueCounts(activeModule);
  const { can } = useAdminSession();

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 h-screen sticky top-0 overflow-y-auto shadow-sm">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-2xs">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Chill & Connect</p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {SIDEBAR_GROUPS.map((group) => {
          const modules = group.modules.filter((mod) => can(MODULE_PERMISSIONS[mod.id]));
          if (modules.length === 0) return null;
          return (
            <div key={group.groupLabel ?? 'main'}>
              {group.groupLabel && (
                <p className="px-2 mb-1.5 text-[11px] font-semibold text-slate-400">{group.groupLabel}</p>
              )}
              <ul className="space-y-0.5">
                {modules.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  const count = counts[mod.id] ?? 0;
                  return (
                    <li key={mod.id}>
                      <button
                        type="button"
                        onClick={() => onModuleChange(mod.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors group ${
                          isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={15} className={`shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`flex-1 min-w-0 truncate text-[13px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{mod.label}</span>
                        {mod.pillarColor && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: mod.pillarColor }} />}
                        {count > 0 && (
                          <span
                            title="รายการรอตรวจ"
                            className="min-w-[20px] text-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0 tabular-nums"
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <AdminSessionStatus variant="sidebar" />
        <div className="mt-1">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-[12px] font-medium"
          >
            <Home size={12} />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
