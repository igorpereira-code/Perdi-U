import { isBlank } from '../../core/logic/validation';

export type FoundItemRequiredValues = {
  description: string;
  category: string;
  place: string;
  foundDate: string;
};

export type FoundItemFormErrors = Partial<Record<keyof FoundItemRequiredValues, string>>;

export function validateFoundItemForm(values: FoundItemRequiredValues): FoundItemFormErrors {
  const errors: FoundItemFormErrors = {};

  if (isBlank(values.description)) {
    errors.description = 'Escribe una descripción del objeto.';
  }
  if (isBlank(values.category)) {
    errors.category = 'Selecciona una categoría.';
  }
  if (isBlank(values.place)) {
    errors.place = 'Selecciona un bloque o espacio.';
  }
  if (isBlank(values.foundDate)) {
    errors.foundDate = 'Indica la fecha del hallazgo.';
  }

  return errors;
}
