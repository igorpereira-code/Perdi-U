import { MIN_SIMILARITY } from './findSimilarItems';
import {
  similarityScore,
  type FoundItemForMatching,
  type LostReportForMatching,
} from './similarity';

export type SimilarReport<T> = { report: T; similarity: number };

/** The other way around from findSimilarItems: the lost reports that look like one found item. */
export function findSimilarReports<T extends LostReportForMatching>(
  item: FoundItemForMatching,
  reports: T[],
): SimilarReport<T>[] {
  return reports
    .map((report) => ({ report, similarity: similarityScore(report, item) }))
    .filter((match) => match.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity);
}
