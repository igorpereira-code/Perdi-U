import { isBlank } from '../../core/logic/validation';

export type LostReportFormValues = {
  description: string;
  category: string;
  dateFrom: string;
  dateTo: string;
};

export type LostReportFormErrors = Partial<Record<keyof LostReportFormValues, string>>;

/** Required fields of the lost report form. Dates come as "YYYY-MM-DD", so they compare as text. */
export function validateLostReportForm(values: LostReportFormValues): LostReportFormErrors {
  const errors: LostReportFormErrors = {};
  if (isBlank(values.description)) {
    errors.description = 'Escribe una descripción de tu objeto.';
  }
  if (isBlank(values.category)) {
    errors.category = 'Elige una categoría.';
  }
  if (isBlank(values.dateFrom)) {
    errors.dateFrom = 'Indica desde qué fecha pudo perderse.';
  }
  if (isBlank(values.dateTo)) {
    errors.dateTo = 'Indica hasta qué fecha pudo perderse.';
  } else if (!isBlank(values.dateFrom) && values.dateFrom > values.dateTo) {
    errors.dateTo = 'La fecha final no puede ser anterior a la inicial.';
  }
  return errors;
}