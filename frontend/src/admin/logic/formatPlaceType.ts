import type { PlaceType } from '@shared/admin';

const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  BLOCK: 'Bloque',
  SPACE: 'Espacio',
};

/** The kind of place as the user reads it. */
export function formatPlaceType(type: PlaceType): string {
  return PLACE_TYPE_LABELS[type];
}
