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

/** "Cálculo" → "calculo". */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Words of 4 letters or more, in lowercase and without accents. */
function extractKeywords(text: string): Set<string> {
  const allWords = normalizeText(text).split(/[^a-z0-9]+/);
  return new Set(allWords.filter((word) => word.length >= MIN_WORD_LENGTH));
}

function isFoundInDateRange(report: LostReportForMatching, item: FoundItemForMatching): boolean {
  const foundTime = item.foundAt.getTime();
  return foundTime >= report.dateFrom.getTime() && foundTime < report.dateTo.getTime() + ONE_DAY;
}

function countSharedKeywords(report: LostReportForMatching, item: FoundItemForMatching): number {
  const itemKeywords = extractKeywords(item.description);
  return [...extractKeywords(report.description)].filter((word) => itemKeywords.has(word)).length;
}

function calculateDatePoints(report: LostReportForMatching, item: FoundItemForMatching): number {
  return isFoundInDateRange(report, item) ? DATE_POINTS : 0;
}

function calculatePlacePoints(report: LostReportForMatching, item: FoundItemForMatching): number {
  return report.placeIds.includes(item.placeId) ? PLACE_POINTS : 0;
}

function calculateWordPoints(report: LostReportForMatching, item: FoundItemForMatching): number {
  return Math.min(countSharedKeywords(report, item) * POINTS_PER_WORD, MAX_WORD_POINTS);
}

/** From 0 to 100: how much a found item looks like the lost one. Different category = 0. */
export function calculateSimilarityScore(
  report: LostReportForMatching,
  item: FoundItemForMatching,
): number {
  if (report.categoryId !== item.categoryId) {
    return 0;
  }
  return (
    calculateDatePoints(report, item) +
    calculatePlacePoints(report, item) +
    calculateWordPoints(report, item)
  );
}
