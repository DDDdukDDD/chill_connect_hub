import React from 'react';
import Link from 'next/link';
import { HASHTAG, hashtagHref } from '@/lib/moments/hashtags';

/** A caption with its hashtags as real links, so people and search engines can follow them */
export function CaptionText({ text, linkClassName = 'font-medium text-[#2563EB] hover:underline' }: { text: string; linkClassName?: string }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(HASHTAG)) {
    parts.push(text.slice(at, match.index));
    parts.push(
      <Link key={match.index} href={hashtagHref(match[0])} className={linkClassName}>
        {match[0]}
      </Link>
    );
    at = match.index + match[0].length;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}
