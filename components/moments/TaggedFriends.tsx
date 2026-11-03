import React from 'react';
import Link from 'next/link';

const NAMES_SHOWN = 2;

/** "กับ A, B และอีก 3 คน" beside the author: each name goes to that person's profile */
export function TaggedFriends({ people, className = '' }: { people?: { id: string; name: string }[]; className?: string }) {
  if (!people?.length) return null;
  const rest = people.length - NAMES_SHOWN;
  return (
    <p className={`min-w-0 truncate ${className}`}>
      กับ{' '}
      {people.slice(0, NAMES_SHOWN).map((person, index) => (
        <React.Fragment key={person.id}>
          {index > 0 && ', '}
          <Link href={`/profile?id=${encodeURIComponent(person.id)}`} className="font-semibold hover:underline pointer-events-auto">{person.name}</Link>
        </React.Fragment>
      ))}
      {rest > 0 && ` และอีก ${rest} คน`}
    </p>
  );
}
