/**
 * Descriptions are written in the rich text editor (components/RichTextEditor.tsx) and shown as HTML, so whatever a
 * member sends must be cut down to plain formatting before it reaches a page. An allowlist, not a blocklist:
 * only the tags below survive, every attribute is dropped (a link keeps an http(s) href and gets safe rel/target),
 * and all other text is escaped. Runs the same in the browser and on the server, with no parser to load.
 */
const ALLOWED = new Set(['p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a']);
const VOID = new Set(['br']);
/** Their content is code or markup, never text to show */
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|noscript|textarea|title|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi;
const ENTITY = /^&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/i;

const escapeText = (text: string) =>
  text.replace(/[&<>"']/g, (ch, at: number) => {
    if (ch === '&' && ENTITY.test(text.slice(at))) return '&'; // keep &nbsp; &amp; and friends as they are
    return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;';
  });

function safeHref(tag: string): string | null {
  const match = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const raw = (match?.[2] ?? match?.[3] ?? match?.[4] ?? '').trim();
  // Entities and control characters are how "javascript:" hides; only a plain http(s) address passes
  if (!/^https?:\/\/[^\s"'<>`]+$/i.test(raw) || /&#|[\u0000-\u001f]/.test(raw)) return null;
  return raw.replace(/&amp;/g, '&');
}

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  const openLinks: boolean[] = [];
  return html
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(DROP_WITH_CONTENT, '')
    .split(/(<\/?[a-z][a-z0-9]*\b[^<>]*>)/i)
    .map((part) => {
      const tag = /^<(\/?)([a-z][a-z0-9]*)\b/i.exec(part);
      if (!tag) return escapeText(part);
      const closing = tag[1] === '/';
      const name = tag[2].toLowerCase();
      if (!ALLOWED.has(name)) return '';
      if (name === 'a') {
        if (closing) return openLinks.pop() ? '</a>' : '';
        const href = safeHref(part);
        openLinks.push(Boolean(href));
        return href ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer nofollow">` : '';
      }
      if (VOID.has(name)) return closing ? '' : `<${name}>`;
      return closing ? `</${name}>` : `<${name}>`;
    })
    .join('');
}
