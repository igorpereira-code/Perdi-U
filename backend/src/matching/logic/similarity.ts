export type LostReportForMatching = {
  categoryId: number;
  dateFrom: Date;
  dateTo: Date;
  placeIds: number[];
  description: string;
};

export type FoundItemForMatching = {
  categoryId: number;
  foundAt: Date;
  placeId: number;
  description: string;
};

const ONE_DAY = 24 * 60 * 60 * 1000;
const DATE_POINTS = 40;
const PLACE_POINTS = 30;
const POINTS_PER_WORD = 10;
const MAX_WORD_POINTS = 30;
const MIN_WORD_LENGTH = 4;

/** Words of 4 letters or more, in lowercase and without accents ("Cálculo" → "calculo"). */
function words(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= MIN_WORD_LENGTH));
}

function foundInDateRange(report: LostReportForMatching, item: FoundItemForMatching): boolean {
  const foundTime = item.foundAt.getTime();
  return foundTime >= report.dateFrom.getTime() && foundTime < report.dateTo.getTime() + ONE_DAY;
}

function sharedWordCount(report: LostReportForMatching, item: FoundItemForMatching): number {
  const itemWords = words(item.description);
  return [...words(report.description)].filter((word) => itemWords.has(word)).length;
}

/** From 0 to 100: how much a found item looks like the lost one. Different category = 0. */
export function similarityScore(report: LostReportForMatching, item: FoundItemForMatching): number {
  if (report.categoryId !== item.categoryId) {
    return 0;
  }

  const datePoints = foundInDateRange(report, item) ? DATE_POINTS : 0;
  const placePoints = report.placeIds.includes(item.placeId) ? PLACE_POINTS : 0;
  const wordPoints = Math.min(sharedWordCount(report, item) * POINTS_PER_WORD, MAX_WORD_POINTS);
  return datePoints + placePoints + wordPoints;
}
