import type { FoundItemStatus } from '@shared/statuses';

export type FoundItemCatalogs = {
  categories: { id: number; name: string }[];
  places: {
    id: number;
    name: string;
    type: 'BLOCK' | 'SPACE';
    classrooms: { id: number; name: string }[];
  }[];
};

export type NewFoundItem = {
  description: string;
  categoryId: number;
  placeId: number;
  classroomId: number | null;
  placeReference: string | null;
  foundAt: Date;
  finderId: string;
  // Solo para rutas verificadas por la futura integración con Storage.
  photoUrl?: string | null;
};

export type CreatedFoundItem = {
  code: string;
  status: FoundItemStatus;
};

export type FoundItemPhotoAccess = {
  finderId: string | null;
  photoUrl: string | null;
  status: FoundItemStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
};

export type MyFoundItem = {
  code: string;
  description: string;
  category: string;
  foundAt: Date;
  hasPhoto: boolean;
  status: FoundItemStatus;
  receivedAt: Date | null;
};

export type FoundItemsRepository = {
  listMine: (finderId: string) => Promise<MyFoundItem[]>;
  getMineByCode: (finderId: string, code: string) => Promise<MyFoundItem | null>;
  getCatalogs: () => Promise<FoundItemCatalogs>;
  create: (item: NewFoundItem) => Promise<CreatedFoundItem>;
  getPhotoByCode: (code: string) => Promise<FoundItemPhotoAccess | null>;
};
