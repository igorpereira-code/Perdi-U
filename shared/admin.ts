import type { Role } from './user';

/** A user as the Administrator sees it in GET /admin/users. */
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** BLOCK has classrooms; SPACE does not (library, terrace, restaurants). */
export type PlaceType = 'BLOCK' | 'SPACE';

/** A category as the Administrator sees it. Inactive ones no longer show up when reporting. */
export type ManagedCategory = {
  id: number;
  name: string;
  active: boolean;
};

export type ManagedClassroom = {
  id: number;
  name: string;
  active: boolean;
};

export type ManagedPlace = {
  id: number;
  name: string;
  type: PlaceType;
  active: boolean;
  classrooms: ManagedClassroom[];
};

/** Everything the Administrator manages in GET /admin/catalogs, active and inactive. */
export type ManagedCatalogs = {
  categories: ManagedCategory[];
  places: ManagedPlace[];
};
