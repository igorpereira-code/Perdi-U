import type { FoundItemCatalogs } from '../../finder/data/foundItemsRepository';

export type LostReportPlace = { placeId: number; classroomId: number | null };

export type ValidLostReport = {
  description: string;
  categoryId: number;
  places: LostReportPlace[];
  placeDescription: string | null;
  dateFrom: Date;
  dateTo: Date;
};

export type LostReportErrors = Partial<
  Record<'description' | 'categoryId' | 'places' | 'placeDescription' | 'dateFrom' | 'dateTo', string>
>;

export type LostReportValidation =
  | { valid: true; data: ValidLostReport }
  | { valid: false; errors: LostReportErrors };

const MAX_PLACE_DESCRIPTION = 300;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Turns "2026-10-18" into a date, or null if it is not a real calendar day. */
function toDay(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const day = new Date(`${value}T00:00:00.000Z`);
  return day.toISOString().slice(0, 10) === value ? day : null;
}

function readPlaces(value: unknown, catalogs: FoundItemCatalogs): LostReportPlace[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const places: LostReportPlace[] = [];
  for (const item of value) {
    const placeId = item?.placeId;
    const classroomId = item?.classroomId ?? null;
    const place = catalogs.places.find((option) => option.id === placeId);
    if (!place) {
      return null;
    }
    if (classroomId !== null && !place.classrooms.some((classroom) => classroom.id === classroomId)) {
      return null;
    }
    if (places.some((saved) => saved.placeId === placeId && saved.classroomId === classroomId)) {
      return null;
    }
    places.push({ placeId, classroomId });
  }
  return places;
}

/** Checks a lost report sent by the app, using the active categories and places. */
export function validateLostReport(input: unknown, catalogs: FoundItemCatalogs): LostReportValidation {
  const report = (input && typeof input === 'object' && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const errors: LostReportErrors = {};

  const description = typeof report.description === 'string' ? report.description.trim() : '';
  if (!description) {
    errors.description = 'Escribe una descripción de tu objeto.';
  }

  const categoryId = report.categoryId;
  if (!isPositiveInteger(categoryId) || !catalogs.categories.some((category) => category.id === categoryId)) {
    errors.categoryId = 'Elige una categoría válida.';
  }

  const places = readPlaces(report.places, catalogs);
  if (!places) {
    errors.places = 'Revisa los lugares elegidos.';
  }

  const rawPlaceDescription = report.placeDescription ?? null;
  const placeDescription = typeof rawPlaceDescription === 'string' ? rawPlaceDescription.trim() || null : null;
  if (rawPlaceDescription !== null && typeof rawPlaceDescription !== 'string') {
    errors.placeDescription = 'Describe el lugar con texto.';
  } else if (placeDescription && placeDescription.length > MAX_PLACE_DESCRIPTION) {
    errors.placeDescription = 'Usa como máximo 300 caracteres.';
  }

  const dateFrom = toDay(report.dateFrom);
  const dateTo = toDay(report.dateTo);
  if (!dateFrom) {
    errors.dateFrom = 'Indica desde qué fecha pudo perderse.';
  }
  if (!dateTo) {
    errors.dateTo = 'Indica hasta qué fecha pudo perderse.';
  } else if (dateFrom && dateFrom > dateTo) {
    errors.dateTo = 'La fecha final no puede ser anterior a la inicial.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      description,
      categoryId: categoryId as number,
      places: places as LostReportPlace[],
      placeDescription,
      dateFrom: dateFrom as Date,
      dateTo: dateTo as Date,
    },
  };
}