import type { CatalogItem } from '../data/catalogService';

export type CatalogFilters = {
  query: string;
  category?: string;
};

/** Lowercase and without accents, so "Mochila" and "mochila" or "electrónico" and "electronico" match. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Keeps the items that have every word typed and, if chosen, the same category. */
export function filterCatalog(items: CatalogItem[], { query, category }: CatalogFilters): CatalogItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (category && item.category !== category) {
      return false;
    }
    const text = normalize(`${item.description} ${item.category}`);
    return words.every((word) => text.includes(word));
  });
}