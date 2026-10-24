/** A reward waiting to be claimed keeps its stamp card visibly complete. */
export function visibleStampCount(
  progress: {
    totalSlots: number;
    stampedCount: number;
    availableRewards: number;
  } | null,
): number {
  if (!progress || progress.totalSlots <= 0) return 0;
  return progress.availableRewards > 0
    ? progress.totalSlots
    : progress.stampedCount;
}
