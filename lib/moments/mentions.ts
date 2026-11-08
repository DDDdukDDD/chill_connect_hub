/**
 * @mentions in captions and comments. Names have spaces and no handles, so the text keeps a plain "@ชื่อ" and the
 * people picked from the list travel beside it as { id, name }. A mention counts only while its "@name" is still
 * in the text, so deleting the words takes the mention away too.
 */
export type Mention = { id: string; name: string };

export const MAX_COMMENT_MENTIONS = 5;

export const mentionToken = (name: string) => `@${name}`;

/** The picked people whose "@name" is still in the text, each once */
export function keepMentioned(text: string, mentions: Mention[]): Mention[] {
  const seen = new Set<string>();
  return mentions.filter((m) => m.name && !seen.has(m.id) && text.includes(mentionToken(m.name)) && seen.add(m.id));
}

/** The text cut into plain parts and mentions, longest names first so "@Ann Lee" wins over "@Ann" */
export function splitMentions(text: string, mentions: Mention[]): Array<string | Mention> {
  const sorted = [...mentions].filter((m) => m.name).sort((a, b) => b.name.length - a.name.length);
  if (!sorted.length) return [text];
  const parts: Array<string | Mention> = [];
  let plain = '';
  for (let i = 0; i < text.length; ) {
    const hit = text[i] === '@' ? sorted.find((m) => text.startsWith(mentionToken(m.name), i)) : undefined;
    if (hit) {
      if (plain) parts.push(plain);
      plain = '';
      parts.push(hit);
      i += hit.name.length + 1;
    } else {
      plain += text[i];
      i += 1;
    }
  }
  if (plain) parts.push(plain);
  return parts;
}

/** The "@query" being typed just before the cursor, or null */
export function typedMention(text: string, cursor: number): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf('@');
  if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null;
  const query = before.slice(at + 1);
  // A name may hold one space ("Ann Lee"); a line break or a long run ends the search
  if (query.length > 30 || /\n/.test(query) || (query.match(/\s/g)?.length ?? 0) > 1) return null;
  return { start: at, query };
}
