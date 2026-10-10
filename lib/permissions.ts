/**
 * Staff roles and what each role may do in the admin console.
 * The matrix lives in code on purpose: it is reviewed like any other change and cannot be edited from the UI.
 * Server-side checks use these values; the admin UI only reads them to hide controls.
 */
export type StaffRole = 'owner' | 'editor' | 'moderator' | 'data_ops';

export type AdminPermission =
  | 'content.view' // read every admin screen
  | 'community.review' // approve or reject community meetups
  | 'content.edit' // create, edit, publish and delete spots, fairs and quests; review fairs and spots
  | 'sources.run' // manage data sources and run scrapers
  | 'system.manage' // master data, media, cache
  | 'audit.view' // read the audit log
  | 'members.manage' // member accounts: view, suspend, ban
  | 'staff.manage'; // staff accounts and roles

export const STAFF_ROLES: readonly StaffRole[] = ['owner', 'editor', 'moderator', 'data_ops'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  moderator: 'Moderator',
  data_ops: 'Data Ops',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'ทำได้ทุกอย่าง รวมถึงจัดการทีมงานและสิทธิ์',
  editor: 'ตรวจ แก้ไข และเผยแพร่เนื้อหาทุกเสา รันการดึงข้อมูลได้',
  moderator: 'ตรวจและอนุมัติกิจกรรมคอมมูนิตี้ และดูแลสมาชิก',
  data_ops: 'ดูแลแหล่งข้อมูล การดึงข้อมูล ข้อมูลหลัก รูปภาพ และ cache',
};

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  'content.view': 'ดูทุกหน้า',
  'community.review': 'ตรวจ / อนุมัติกิจกรรมคอมมูนิตี้',
  'content.edit': 'แก้ไข / เผยแพร่สถานที่ งานแฟร์ ชาเลนจ์',
  'sources.run': 'จัดการแหล่งข้อมูล / รันการดึงข้อมูล',
  'system.manage': 'ข้อมูลหลัก รูปภาพ cache',
  'audit.view': 'ดูบันทึกการกระทำ',
  'members.manage': 'จัดการสมาชิก (ดูรายชื่อ ระงับ แบน)',
  'staff.manage': 'จัดการทีมงานและ role',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as AdminPermission[];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly AdminPermission[]> = {
  owner: ALL_PERMISSIONS,
  editor: ['content.view', 'community.review', 'content.edit', 'sources.run', 'audit.view'],
  moderator: ['content.view', 'community.review', 'members.manage'],
  data_ops: ['content.view', 'sources.run', 'system.manage'],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

export function roleHasPermission(role: StaffRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
