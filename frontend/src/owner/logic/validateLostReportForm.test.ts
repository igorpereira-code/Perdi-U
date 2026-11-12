import { validateLostReportForm } from './validateLostReportForm';

const complete = {
  description: 'Llaves con llavero azul',
  category: '47',
  dateFrom: '2026-10-17',
  dateTo: '2026-10-18',
};

describe('Datos obligatorios del reporte de pérdida', () => {
  it('no marca errores cuando están todos los datos obligatorios', () => {
    expect(validateLostReportForm(complete)).toEqual({});
  });

  it('pide la descripción, la categoría y el rango de fechas', () => {
    expect(validateLostReportForm({ description: '  ', category: '', dateFrom: '', dateTo: '' })).toEqual({
      description: 'Escribe una descripción de tu objeto.',
      category: 'Elige una categoría.',
      dateFrom: 'Indica desde qué fecha pudo perderse.',
      dateTo: 'Indica hasta qué fecha pudo perderse.',
    });
  });

  it('no acepta que la fecha final sea anterior a la inicial', () => {
    expect(validateLostReportForm({ ...complete, dateFrom: '2026-10-18', dateTo: '2026-10-17' })).toEqual({
      dateTo: 'La fecha final no puede ser anterior a la inicial.',
    });
  });

  it('acepta que el rango sea de un solo día', () => {
    expect(validateLostReportForm({ ...complete, dateFrom: '2026-10-18', dateTo: '2026-10-18' })).toEqual({});
  });
});