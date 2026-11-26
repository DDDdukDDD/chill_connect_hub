import { Lock } from 'lucide-react';

/**
 * Tells the author what they turned off on their own post (owner 2026-11-26): others no longer see those buttons, but
 * the author still sees their own share button, so without this line the setting looked as if it had not taken.
 * Only on the author's own post; nothing when everything is on.
 */
export function ClosedOptionsLine({ moment, className = '' }: { moment: { isMine?: boolean; commentsOff?: boolean; likesOff?: boolean; sharesOff?: boolean }; className?: string }) {
  if (!moment.isMine) return null;
  const off = [moment.commentsOff && 'ปิดความคิดเห็น', moment.likesOff && 'ปิดการกดถูกใจ', moment.sharesOff && 'ปิดการแชร์'].filter(Boolean);
  if (!off.length) return null;
  return (
    <p className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      <Lock className="size-3.5 shrink-0" aria-hidden />
      <span>
        {off.join(' · ')} <span className="text-slate-400">· เห็นเฉพาะคุณ</span>
      </span>
    </p>
  );
}
