/**
 * Staff roles and what each role may do in the admin console.
 * The matrix lives in code on purpose: it is reviewed like any other change and cannot be edited from the UI.
 * Server-side checks use these values; the admin UI only reads them to hide controls.
 */
export type StaffRole = 'owner' | 'editor' | 'moderator' | 'data_ops';

export type AdminPermission =
  | 'content.view' // read every admin screen
  | 'community.review' // approve or reject community meetups; safety reports and moments
  | 'content.edit' // create, edit, publish and delete spots, fairs, quests and campaigns; review fairs and spots
  | 'sources.run' // manage data sources and run scrapers
  | 'master.edit' // master data: categories, provinces and zones, venues, rails
  | 'system.manage' // media library, cache, reseeding events
  | 'audit.view' // read the audit log
  | 'members.manage' // member accounts: view, suspend, ban
  | 'staff.manage'; // staff accounts and roles

export const STAFF_ROLES: readonly StaffRole[] = ['owner', 'editor', 'moderator', 'data_ops'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'เจ้าของ',
  editor: 'บรรณาธิการเนื้อหา',
  moderator: 'ผู้ดูแลชุมชน',
  data_ops: 'ทีมข้อมูล',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'ทำได้ทุกอย่าง รวมถึงจัดการทีมงาน สิทธิ์ และลบบัญชีสมาชิก',
  editor: 'ดูแลเนื้อหาทุกเสา ตรวจและเผยแพร่ตี้ อีเวนต์ ที่เที่ยว ชาเลนจ์ แคมเปญ แก้ข้อมูลหลัก และรันการดึงข้อมูล',
  moderator: 'ดูแลความปลอดภัยของชุมชน ตรวจตี้ รายงาน และโมเมนต์ ระงับหรือแบนสมาชิก และอนุมัติผู้จัด',
  data_ops: 'ดูแลแหล่งข้อมูลและการดึงข้อมูล ข้อมูลหลัก คลังรูปภาพ และ cache',
};

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  'content.view': 'ดูทุกหน้า',
  'community.review': 'ตรวจตี้ รายงานความปลอดภัย และโมเมนต์',
  'content.edit': 'แก้ไข / เผยแพร่ที่เที่ยว อีเวนต์ ชาเลนจ์ แคมเปญ',
  'sources.run': 'จัดการแหล่งข้อมูล / รันการดึงข้อมูล',
  'master.edit': 'แก้ข้อมูลหลัก (หมวดหมู่ จังหวัด สถานที่จัดงาน การ์ดแนะนำ)',
  'system.manage': 'คลังรูปภาพ และ cache',
  'audit.view': 'ดูบันทึกการกระทำ',
  'members.manage': 'จัดการสมาชิก (ดูรายชื่อ ระงับ แบน)',
  'staff.manage': 'จัดการทีมงานและ role',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as AdminPermission[];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly AdminPermission[]> = {
  owner: ALL_PERMISSIONS,
  editor: ['content.view', 'community.review', 'content.edit', 'sources.run', 'master.edit', 'audit.view'],
  moderator: ['content.view', 'community.review', 'members.manage'],
  data_ops: ['content.view', 'sources.run', 'master.edit', 'system.manage'],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

export function roleHasPermission(role: StaffRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
