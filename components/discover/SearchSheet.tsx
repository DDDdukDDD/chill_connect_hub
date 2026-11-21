'use client';

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useDialogBehavior } from '@/components/auth/DialogShell';
import { SearchResults } from '@/components/discover/SearchResults';
import { SearchField } from '@/components/discover/SearchField';
import { addRecent, searchHref } from '@/components/discover/searchClient';
import { MOMENT_TARGETS } from '@/components/moments/momentTargets';
import { useAuth } from '@/lib/useAuth';

/**
 * Phones (below md, where the top bar has no search box): the search icon opens this full screen (TR-012, BE-440/441).
 * Before typing: recent searches, the three กิจกรรม pages, then people, this weekend, challenges and tags; while
 * typing: every kind of result (SearchResults). Enter opens all results (/search), or the tag's page for "#tag".
 */
const PILLARS = [
  { href: '/community', label: 'ตี้', look: MOMENT_TARGETS.community },
  { href: '/events', label: 'อีเวนต์', look: MOMENT_TARGETS.fair },
  { href: '/spots', label: 'ที่เที่ยว', look: MOMENT_TARGETS.spot },
];

export function SearchSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose);
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      data-dialog-shell
      role="dialog"
      aria-modal="true"
      aria-label="ค้นหา"
      tabIndex={-1}
      className="fixed inset-0 z-[100002] flex flex-col bg-white pt-[env(safe-area-inset-top)] focus:outline-hidden"
    >
      <div className="flex items-center gap-2 px-3 h-16 border-b border-slate-100 shrink-0">
        <button type="button" onClick={onClose} aria-label="ปิดการค้นหา" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 cursor-pointer">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <SearchField
          id="sheet-search-q"
          autoFocus
          value={query}
          onChange={setQuery}
          onSubmit={() => {
            if (!query.trim()) return;
            addRecent(query);
            onClose();
            router.push(searchHref(query));
          }}
          className="flex-1"
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SearchResults
          key={String(isLoggedIn)}
          query={query}
          province={member?.province}
          onNavigate={onClose}
          before={
            <nav aria-label="กิจกรรม" className="grid grid-cols-3 gap-2 px-4 pt-4">
              {PILLARS.map(({ href, label, look }) => (
                <Link key={href} href={href} onClick={onClose} className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl text-sm font-bold ${look.box}`}>
                  <look.Icon className={`w-5 h-5 ${look.icon}`} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          }
        />
      </div>
    </div>,
    document.body
  );
}
