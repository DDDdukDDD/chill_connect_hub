import React from 'react';
import Link from 'next/link';

const NAMES_SHOWN = 2;

/**
 * "กับ A, B และอีก 3 คน" with the author: each name goes to that person's profile. `inline`: inside the caption line,
 * right after the author's name ("TingerBell กับ Duke เจลาโต้…", feed cards since owner 2026-11-16)
 */
export function TaggedFriends({ people, className = '', inline = false }: { people?: { id: string; name: string }[]; className?: string; inline?: boolean }) {
  if (!people?.length) return null;
  const rest = people.length - NAMES_SHOWN;
  const Tag = inline ? 'span' : 'p';
  return (
    <Tag className={inline ? className : `min-w-0 truncate ${className}`}>
      กับ{' '}
      {people.slice(0, NAMES_SHOWN).map((person, index) => (
        <React.Fragment key={person.id}>
          {index > 0 && ', '}
          <Link href={`/profile?id=${encodeURIComponent(person.id)}`} className="font-semibold hover:underline pointer-events-auto">{person.name}</Link>
        </React.Fragment>
      ))}
      {rest > 0 && ` และอีก ${rest} คน`}
    </Tag>
  );
}
