import type { FoundItemStatus } from '@shared/statuses';

/** A found item as the community sees it in the catalog. */
export type CatalogItem = {
  code: string;
  description: string;
  category: string;
  place: string;
  placeReference: string | null;
  foundAt: Date;
  hasPhoto: boolean;
  status: FoundItemStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
};

export type CatalogRepository = {
  listPublished: () => Promise<CatalogItem[]>;
  findByCode: (code: string) => Promise<CatalogItem | null>;
};