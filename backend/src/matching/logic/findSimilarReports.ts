import {
  calculateSimilarityScore,
  type FoundItemForMatching,
  type LostReportForMatching,
} from './similarity';

export type SimilarReport<T> = { report: T; similarity: number };

/** The other way around from findSimilarItems: the lost reports that look like one found item. */
export function findSimilarReports<T extends LostReportForMatching>(
  item: FoundItemForMatching,
  reports: T[],
  minSimilarity: number,
): SimilarReport<T>[] {
  return reports
    .map((report) => ({ report, similarity: calculateSimilarityScore(report, item) }))
    .filter((match) => match.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
}
