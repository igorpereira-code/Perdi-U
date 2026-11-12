import type { CatalogItem } from '../data/catalogRepository';

/** Only items that Bienestar published, and that are still visible, appear in the catalog. */
export function isInCatalog(item: Pick<CatalogItem, 'status' | 'visibility'>): boolean {
  return item.status === 'PUBLISHED' && item.visibility === 'VISIBLE';
}