import type { FoundItemCatalogs, NewFoundItem } from '../data/foundItemsRepository';

type ValidatedReport = Omit<NewFoundItem, 'finderId' | 'photoUrl'>;
type ReportErrors = Partial<Record<keyof ValidatedReport | 'photoUrl', string>>;
type ValidationResult =
  | { valid: true; data: ValidatedReport }
  | { valid: false; errors: ReportErrors };

function parseCatalogId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647
    ? value
    : null;
}

/** Solo instantes explícitos: nunca completa una hora o zona ausente. */
function parseFoundAt(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
  if (!match || Number(match[1]) < 1 || Number(match[4]) >= 24
    || Number(match[5]) >= 60 || Number(match[6]) >= 60) {
    return null;
  }

  // Validar el calendario por separado evita normalizar, por ejemplo, el 30 de febrero.
  const datePart = value.slice(0, 10);
  const calendarDate = new Date(`${datePart}T00:00:00Z`);
  const instant = new Date(value);
  if (!Number.isFinite(calendarDate.getTime()) || !Number.isFinite(instant.getTime())
    || calendarDate.toISOString().slice(0, 10) !== datePart) {
    return null;
  }
  return instant;
}

export function validateFoundItemReport(input: unknown, catalogs: FoundItemCatalogs): ValidationResult {
  const values: Record<string, unknown> = input !== null && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const errors: ReportErrors = {};
  const description = typeof values.description === 'string' ? values.description.trim() : '';
  const categoryId = parseCatalogId(values.categoryId);
  const placeId = parseCatalogId(values.placeId);
  const classroomId = parseCatalogId(values.classroomId);
  const placeReference = typeof values.placeReference === 'string'
    ? values.placeReference.trim() || null
    : null;
  const place = catalogs.places.find((candidate) => candidate.id === placeId);
  const foundAt = parseFoundAt(values.foundAt);

  if (!description) {
    errors.description = 'Escribe una descripción del objeto.';
  }
  if (!categoryId || !catalogs.categories.some((category) => category.id === categoryId)) {
    errors.categoryId = 'Selecciona una categoría activa y válida.';
  }
  if (!place) {
    errors.placeId = 'Selecciona un bloque o espacio activo y válido.';
  }
  if (values.classroomId != null && (!classroomId || place?.type !== 'BLOCK'
    || !place.classrooms.some((classroom) => classroom.id === classroomId))) {
    errors.classroomId = 'Selecciona un aula activa que pertenezca al bloque elegido.';
  }
  if (values.placeReference != null && (typeof values.placeReference !== 'string'
    || (placeReference?.length ?? 0) > 200)) {
    errors.placeReference = 'La referencia debe ser un texto de hasta 200 caracteres.';
  }
  if (!foundAt) {
    errors.foundAt = 'Indica una fecha y hora válidas en ISO 8601 con zona explícita.';
  }
  if (values.photoUrl != null) {
    errors.photoUrl = 'La fotografía requiere una subida verificada a Storage.';
  }

  if (!categoryId || !placeId || !foundAt || Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: { description, categoryId, placeId, classroomId, placeReference, foundAt },
  };
}
