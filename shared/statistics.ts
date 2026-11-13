/** How Perdi-U is being used: how many items were reported and returned. */
export type UsageStatistics = {
  /** Found items that someone reported. */
  foundItems: number;
  /** Lost items that someone reported. */
  lostReports: number;
  /** Items that Bienestar returned to their owner. */
  deliveredItems: number;
};
