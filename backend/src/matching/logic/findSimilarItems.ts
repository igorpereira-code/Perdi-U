import {
  calculateSimilarityScore,
  type FoundItemForMatching,
  type LostReportForMatching,
} from './similarity';

export type SimilarItem<T> = { item: T; similarity: number };

/** Below this, an item is not shown as similar. */
export const MIN_SIMILARITY = 40;

export function findSimilarItems<T extends FoundItemForMatching>(
  report: LostReportForMatching,
  items: T[],
): SimilarItem<T>[] {
  return items
    .map((item) => ({ item, similarity: calculateSimilarityScore(report, item) }))
    .filter((match) => match.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity);
}
