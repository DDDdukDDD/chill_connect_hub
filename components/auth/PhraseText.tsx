import React from 'react';

/**
 * Thai has no spaces between words, so browsers break lines inside words (badly for slang and mixed
 * Thai/English like "ชิลล์" or "Co-working"). Thai writing puts spaces between phrases instead, so this
 * renders each space-separated phrase unbreakable: lines wrap only at those spaces.
 * Keep phrases short; a phrase wider than its container would overflow.
 */
export function PhraseText({ text }: { text: string }) {
  // "&" stays with the phrase before it, so a line never starts with "&" or holds it alone
  const phrases = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((acc, token) => {
      if (token === '&' && acc.length) acc[acc.length - 1] += ' &';
      else acc.push(token);
      return acc;
    }, []);
  return (
    <>
      {phrases.map((phrase, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <span className="whitespace-nowrap">{phrase}</span>
        </React.Fragment>
      ))}
    </>
  );
}
