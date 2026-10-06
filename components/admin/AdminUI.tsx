import React from 'react';

/**
 * Shared building blocks for the admin console so every module looks the same.
 *
 * Button hierarchy (AGENTS.md section 2):
 * - primary: the one main action of a screen (Royal Blue)
 * - dark:    strong secondary action (Slate Black)
 * - secondary: everyday actions such as refresh, filters, tabs (Slate 100)
 * - danger:  destructive actions only (delete, flush)
 * Section/pillar colors are never used for buttons.
 */
export const adminButton = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  dark:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Compact variants for table rows */
  primarySm:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  secondarySm:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  dangerSm:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  icon:
    'inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

interface AdminPageHeaderProps {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  /** Small status pill next to the title (e.g. read-only, sample data) */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

/** The single page-header pattern for every admin module. */
export function AdminPageHeader({ icon: Icon, title, description, badge, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Icon size={18} className="text-slate-500 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h1>
          {badge}
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/** Status pill used next to page titles. */
export function AdminBadge({ tone = 'slate', children }: { tone?: 'slate' | 'amber'; children: React.ReactNode }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-extrabold ${tones[tone]}`}>{children}</span>
  );
}

/** Pillar identity for badges only (AGENTS.md: section colors never go on buttons). */
export const PILLAR_STYLES = {
  community: { label: 'คอมมูนิตี้', className: 'bg-[#FFF4EE] text-[#D04A1B] border-[#F26430]/30' },
  fairs: { label: 'งานแฟร์', className: 'bg-[#EEF4FA] text-[#1F3D5C] border-[#2B527A]/30' },
  spots: { label: 'พิกัดเที่ยว', className: 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/30' },
  quests: { label: 'ชาเลนจ์', className: 'bg-[#F5F3FF] text-[#6D28D9] border-[#7C3AED]/30' },
} as const;

export type AdminPillar = keyof typeof PILLAR_STYLES;

export function PillarBadge({ pillar }: { pillar: AdminPillar }) {
  const style = PILLAR_STYLES[pillar];
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-extrabold whitespace-nowrap ${style.className}`}>{style.label}</span>;
}

/** One lifecycle vocabulary for every entity: draft → pending → published → ended, plus rejected. */
const STATUS_STYLES = {
  draft: { label: 'ร่าง', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending: { label: 'รอตรวจ', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  published: { label: 'เผยแพร่', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ended: { label: 'สิ้นสุด', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  rejected: { label: 'ปฏิเสธ', className: 'bg-rose-50 text-rose-700 border-rose-200' },
} as const;

export type AdminStatus = keyof typeof STATUS_STYLES;

export function AdminStatusChip({ status }: { status: AdminStatus }) {
  const style = STATUS_STYLES[status];
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-extrabold whitespace-nowrap ${style.className}`}>{style.label}</span>;
}

/** Slim inline empty state (AGENTS.md hygiene rule 5). */
export function AdminEmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 text-sm text-slate-600">
      <span>{children}</span>
      {action}
    </div>
  );
}
