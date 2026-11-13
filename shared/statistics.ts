/** How Perdi-U is being used: how many items were reported and returned. */
export type UsageStatistics = {
  /** Found items that someone reported. */
  foundItems: number;
  /** Lost items that someone reported. */
  lostReports: number;
  /** Items that Bienestar returned to their owner. */
  deliveredItems: number;
  /** Items in Bienestar right now that nobody has come for. It does not depend on the dates. */
  unclaimedItems: number;
};

/** Days chosen by the Administrator, both included, as "YYYY-MM-DD". */
export type DateRange = {
  from: string;
  to: string;
};
