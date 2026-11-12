import {
  calculateSimilarityScore,
  type FoundItemForMatching,
  type LostReportForMatching,
} from './similarity';

export type SimilarItem<T> = { item: T; similarity: number };

/** The items at least as similar as minSimilarity (from 0 to 100) to the report, most similar first. */
export function findSimilarItems<T extends FoundItemForMatching>(
  report: LostReportForMatching,
  items: T[],
  minSimilarity: number,
): SimilarItem<T>[] {
  return items
    .map((item) => ({ item, similarity: calculateSimilarityScore(report, item) }))
    .filter((match) => match.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
}
