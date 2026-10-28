/**
 * Opening hours as people read them. The Tourism Directory import lists every day (or day pair) on its own:
 * "จ. 16:30-23:00 น. · จ.-อ. 16:30-23:00 น. · … · อา. 16:30-23:00 น.". When every part has the same times and the
 * week runs from จ. to อา., that is "ทุกวัน 16:30-23:00 น."; anything else is returned as it came.
 */
export function tidyOpenHours(text?: string): string {
  const clean = (text || '').trim();
  const parts = clean.split(/\s*[·;]\s*/).filter(Boolean);
  if (parts.length < 2) return clean;
  const times = parts.map((part) => part.match(/\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}(\s*น\.)?/)?.[0]);
  if (times.some((time) => !time) || new Set(times.map((time) => time!.replace(/\s/g, ''))).size > 1) return clean;
  const days = parts.join(' ');
  if (!/(^|\s)จ\./.test(days) || !/อา\./.test(days)) return clean;
  return `ทุกวัน ${times[0]}`;
}
