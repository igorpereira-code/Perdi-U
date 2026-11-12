import { validateFoundItemForm } from './validateFoundItemForm';

describe('Validación de campos obligatorios del hallazgo', () => {
  const validValues = {
    description: 'Llaves con llavero azul',
    category: 'Llaves',
    place: 'Biblioteca',
    foundDate: '2025-05-14',
  };

  it('identifica todos los campos obligatorios vacíos', () => {
    expect(validateFoundItemForm({ description: '', category: '', place: '', foundDate: '' })).toEqual({
      description: 'Escribe una descripción del objeto.',
      category: 'Selecciona una categoría.',
      place: 'Selecciona un bloque o espacio.',
      foundDate: 'Indica la fecha del hallazgo.',
    });
  });

  it.each([
    ['description', 'Escribe una descripción del objeto.'],
    ['category', 'Selecciona una categoría.'],
    ['place', 'Selecciona un bloque o espacio.'],
    ['foundDate', 'Indica la fecha del hallazgo.'],
  ])('identifica únicamente %s cuando los demás campos están completos', (field, message) => {
    expect(validateFoundItemForm({ ...validValues, [field]: '' })).toEqual({ [field]: message });
  });

  it('considera vacía una descripción compuesta únicamente por espacios y saltos de línea', () => {
    expect(validateFoundItemForm({ ...validValues, description: '   \n\t ' })).toEqual({
      description: 'Escribe una descripción del objeto.',
    });
  });

  it('acepta los cuatro campos requeridos sin exigir hora, aula, referencia ni fotografía', () => {
    expect(validateFoundItemForm(validValues)).toEqual({});
  });
});
