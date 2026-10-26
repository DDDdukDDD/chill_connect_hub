/**
 * The last answer each screen loaded, kept in this tab while the member moves between pages. A page opened again
 * shows it at once and refreshes behind it, instead of starting empty (stale-while-revalidate in the browser).
 * Memory only: a reload starts empty, so the first paint always matches the server HTML. lib/useMemberSession.ts
 * wipes it when the signed-in member changes, so one member never sees another member's answers.
 */
const memory = new Map<string, unknown>();

export function recall<T>(key: string): T | undefined {
  return memory.get(key) as T | undefined;
}

export function remember<T>(key: string, value: T): T {
  memory.set(key, value);
  return value;
}

export function forgetAll(): void {
  memory.clear();
}
