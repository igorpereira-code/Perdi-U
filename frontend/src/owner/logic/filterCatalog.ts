import type { CatalogItem } from '../data/catalogService';

export type CatalogFilters = {
  query: string;
};

/** Lowercase and without accents, so "Mochila" and "mochila" or "electrónico" and "electronico" match. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Keeps the items that have every word typed. */
export function filterCatalog(items: CatalogItem[], { query }: CatalogFilters): CatalogItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const text = normalize(`${item.description} ${item.category}`);
    return words.every((word) => text.includes(word));
  });
}