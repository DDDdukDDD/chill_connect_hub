import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';

const LINKS = [
  { href: '/about', label: 'เกี่ยวกับเรา' },
  { href: '/safety', label: 'คู่มือความปลอดภัย' },
  { href: '/legal', label: 'ข้อตกลงการใช้งาน' },
  { href: '/legal?tab=privacy', label: 'นโยบายความเป็นส่วนตัว' },
];

/**
 * The one footer of public pages: name, tagline and the four links. `className` places it on the page
 * (spacing, the room above the phone bottom bar); `children` adds a line such as the landing's sign-up nudge.
 */
export function SiteFooter({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <footer className={`border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-2 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
        <BrandLogo size="xs" />
        <BrandWordmark sizeClass="text-sm" />
      </div>
      <p className="font-medium text-slate-600">ทำให้ทุกการออกไปใช้ชีวิตมีความหมาย</p>
      <nav aria-label="เกี่ยวกับเว็บไซต์" className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-500 pt-1 flex-wrap">
        {LINKS.map((link, i) => (
          <React.Fragment key={link.href}>
            {i > 0 && <span className="text-slate-300" aria-hidden="true">•</span>}
            <Link href={link.href} className="hover:text-slate-800 hover:underline">{link.label}</Link>
          </React.Fragment>
        ))}
      </nav>
      {children}
      <p className="text-[11px] text-slate-400">© 2026 Chillwaa. All rights reserved.</p>
    </footer>
  );
}
