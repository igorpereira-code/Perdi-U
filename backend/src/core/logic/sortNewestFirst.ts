/** Returns a copy ordered from the most recent to the oldest. */
export function sortNewestFirst<T extends { createdAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
