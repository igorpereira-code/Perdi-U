import { isBlank } from './validation';

describe('Saber si el usuario dejó un dato vacío', () => {
  it('considera vacío un texto que solo tiene espacios', () => {
    expect(isBlank('   ')).toBe(true);
  });

  it('considera vacío un dato que no se llenó', () => {
    expect(isBlank(undefined)).toBe(true);
  });

  it('considera vacía una lista sin elementos, como lugares sin elegir', () => {
    expect(isBlank([])).toBe(true);
  });

  it('no considera vacío un texto escrito', () => {
    expect(isBlank('Mochila negra')).toBe(false);
  });
});
