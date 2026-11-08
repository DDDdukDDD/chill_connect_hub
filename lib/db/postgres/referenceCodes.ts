/**
 * The Postgres adapter keeps province and venue codes in memory to check content before saving. Master data edits
 * call this, so a venue staff just added is accepted at once instead of after the 5-minute refresh.
 */
const stamp = globalThis as unknown as { _cchReferenceCodesChangedAt?: number };

export function markReferenceCodesChanged() {
  stamp._cchReferenceCodesChangedAt = Date.now();
}

export function referenceCodesChangedAt() {
  return stamp._cchReferenceCodesChangedAt ?? 0;
}
