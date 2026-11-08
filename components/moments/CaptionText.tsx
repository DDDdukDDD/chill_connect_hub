import React from 'react';
import Link from 'next/link';
import { HASHTAG, hashtagHref } from '@/lib/moments/hashtags';
import { splitMentions, type Mention } from '@/lib/moments/mentions';

/** A caption or comment with its hashtags and @mentions as real links, so people and search engines can follow them */
export function CaptionText({ text, mentions = [], linkClassName = 'font-medium text-[#2563EB] hover:underline' }: { text: string; mentions?: Mention[]; linkClassName?: string }) {
  return (
    <>
      {splitMentions(text, mentions).map((part, i) =>
        typeof part === 'string' ? (
          <Hashtags key={i} text={part} linkClassName={linkClassName} />
        ) : (
          <Link key={i} href={`/profile?id=${encodeURIComponent(part.id)}`} className={linkClassName}>
            @{part.name}
          </Link>
        )
      )}
    </>
  );
}

function Hashtags({ text, linkClassName }: { text: string; linkClassName: string }) {
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
