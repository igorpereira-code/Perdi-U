/** Where Bienestar Estudiantil receives and returns the items, and when. */
export type WelfareOffice = {
  place: string;
  hours: string;
};

/** From 0 to 100: how similar an item must be to be shown as a match, until the Administrator changes it. */
export const DEFAULT_MIN_SIMILARITY = 40;

/** How similar (from 0 to 100) a found item must be to a lost one to be shown as a match. */
export type MatchSettings = {
  minSimilarity: number;
};
