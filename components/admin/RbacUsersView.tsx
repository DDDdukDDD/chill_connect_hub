'use client';

import React, { useState } from 'react';
import { ShieldCheck, Crown, Edit3, Search, Check } from 'lucide-react';

export type UserRole = 'Super Admin' | 'Content Editor' | 'Moderator' | 'Organizer' | 'Member';

const ROLES_CONFIG: {
  role: UserRole;
  desc: string;
  tagStyle: string;
  dotColor: string;
  checkColor: string;
  permissions: string[];
}[] = [
  {
    role: 'Super Admin',
    desc: 'Full access to all modules, system settings, RBAC management',
    tagStyle: 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/25',
    dotColor: 'bg-[#4A7C59]',
    checkColor: 'text-[#4A7C59]',
    permissions: ['จัดการ Master Data ทั้งหมด','จัดการ Users & Permissions','อนุมัติ / ปฏิเสธ Content ทุกประเภท','ดู Audit Logs และ Backup ฐานข้อมูล','เข้าถึง Scraper Engine','แก้ไข System Settings'],
  },
  {
    role: 'Content Editor',
    desc: 'Create and edit Spots, Events, Fairs — no user management',
    tagStyle: 'bg-sky-50 text-[#2B527A] border-sky-200',
    dotColor: 'bg-sky-500',
    checkColor: 'text-sky-600',
    permissions: ['เพิ่ม / แก้ไข Lifestyle Spots','เพิ่ม / แก้ไข Events & Fairs','ดู Taxonomy (อ่านอย่างเดียว)','อัปโหลดรูปภาพ'],
  },
  {
    role: 'Moderator',
    desc: 'Review and approve user-submitted community content',
    tagStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    checkColor: 'text-amber-600',
    permissions: ['อนุมัติ / ปฏิเสธ Community Meetups','Moderation Queue','รายงานผู้ใช้ที่ละเมิดกฎ','ดูสถิติการรายงาน Safety'],
  },
  {
    role: 'Organizer',
    desc: 'Create and manage own Fairs & Events listings',
    tagStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
    checkColor: 'text-purple-600',
    permissions: ['สร้าง Fairs & Expos ของตนเอง','จัดการ Ticket URL และ Floorplan','ดูสถิติผู้เข้าชมงานของตน'],
  },
  {
    role: 'Member',
    desc: 'Regular user — no admin access',
    tagStyle: 'bg-slate-100 text-slate-500 border-slate-200',
    dotColor: 'bg-slate-400',
    checkColor: 'text-slate-400',
    permissions: ['เข้าร่วมกิจกรรม Community','สะสม EXP และ Badge','สร้าง Community Meetups (ต้องผ่าน Moderation)'],
  },
];

const SAMPLE_USERS = [
  { id: 'u001', name: 'Siam Wongkham', email: 'siam@example.com', role: 'Super Admin' as UserRole, joinDate: '2025-01-12', status: 'active' },
  { id: 'u002', name: 'Praew Chaichai', email: 'praew@example.com', role: 'Content Editor' as UserRole, joinDate: '2025-03-05', status: 'active' },
  { id: 'u003', name: 'Arm Jirat', email: 'arm@example.com', role: 'Moderator' as UserRole, joinDate: '2025-04-20', status: 'active' },
  { id: 'u004', name: 'BKK Events Co.', email: 'events@bkk.co.th', role: 'Organizer' as UserRole, joinDate: '2025-06-01', status: 'active' },
  { id: 'u005', name: 'Nook Naphat', email: 'nook@email.com', role: 'Member' as UserRole, joinDate: '2026-01-18', status: 'inactive' },
];

export function RbacUsersView() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  const filteredUsers = SAMPLE_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleStyle = (role: string) => ROLES_CONFIG.find((r) => r.role === role);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={17} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">Users & Permissions</h1>
          </div>
          <p className="text-slate-500 text-sm">จัดการระดับสิทธิ์ผู้ใช้ 5 ขั้น (RBAC) ตามมาตรฐาน Enterprise</p>
        </div>
        <div className="flex gap-2">
          {(['users', 'roles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-[#4A7C59] text-white shadow-sm shadow-[#4A7C59]/20'
                  : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {{ users: '👥 Users', roles: '🛡️ Role Matrix' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ROLES_CONFIG.map((rc) => {
          const count = SAMPLE_USERS.filter((u) => u.role === rc.role).length;
          return (
            <div key={rc.role} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold mb-2 ${rc.tagStyle}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${rc.dotColor}`} />
                {rc.role}
              </div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
            </div>
          );
        })}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, หรือ Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 shadow-xs"
            />
          </div>

          <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              {['User', 'Role', 'สมัครเมื่อ', 'สถานะ', ''].map((h, i) => (
                <p key={i} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-1'}`}>
                  {h}
                </p>
              ))}
            </div>
            {filteredUsers.map((user) => {
              const rc = getRoleStyle(user.role);
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                >
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF3ED] flex items-center justify-center text-xs font-bold text-[#4A7C59] shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-700 text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    {rc && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${rc.tagStyle}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${rc.dotColor}`} />
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-slate-400 text-xs">{user.joinDate}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.status === 'active' ? 'bg-[#EBF3ED] text-[#4A7C59]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {user.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-3">
          {ROLES_CONFIG.map((rc) => (
            <div key={rc.role} className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold mb-2 ${rc.tagStyle}`}>
                    <Crown size={11} />
                    {rc.role}
                  </div>
                  <p className="text-slate-500 text-sm">{rc.desc}</p>
                </div>
                <span className="text-2xl font-bold text-slate-800 shrink-0">
                  {SAMPLE_USERS.filter((u) => u.role === rc.role).length}
                  <span className="text-slate-400 text-sm font-normal ml-1">users</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {rc.permissions.map((perm) => (
                  <div key={perm} className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <Check size={11} className={`mt-0.5 shrink-0 ${rc.checkColor}`} />
                    <p className="text-slate-600 text-xs leading-tight">{perm}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
