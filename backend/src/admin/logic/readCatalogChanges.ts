import type { CatalogChanges } from '@shared/admin';
import { cleanCatalogName, validateCatalogName } from './catalogName';

export type CatalogChangesResult = { changes: CatalogChanges } | { error: string };

/** Reads the new name and/or active state sent by the Administrator. */
export function readCatalogChanges(body: unknown, maxNameLength: number): CatalogChangesResult {
  const { name, active } = (body ?? {}) as { name?: unknown; active?: unknown };
  const changes: CatalogChanges = {};

  if (name !== undefined) {
    changes.name = cleanCatalogName(name);
    const nameError = validateCatalogName(changes.name, maxNameLength);
    if (nameError) {
      return { error: nameError };
    }
  }
  if (active !== undefined) {
    if (typeof active !== 'boolean') {
      return { error: 'El estado no es válido.' };
    }
    changes.active = active;
  }
  if (Object.keys(changes).length === 0) {
    return { error: 'No hay cambios para guardar.' };
  }
  return { changes };
}
