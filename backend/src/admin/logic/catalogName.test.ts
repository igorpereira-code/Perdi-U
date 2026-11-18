import { cleanCatalogName, isNameTaken, validateCatalogName } from './catalogName';

describe('Limpiar el nombre', () => {
  it('quita los espacios de los extremos y los repetidos', () => {
    expect(cleanCatalogName('  Llaves   de casa ')).toBe('Llaves de casa');
  });

  it('si no es texto, queda vacío', () => {
    expect(cleanCatalogName(42)).toBe('');
  });
});

describe('Validar el nombre', () => {
  it('acepta un nombre con texto y dentro del largo permitido', () => {
    expect(validateCatalogName('Llaves', 80)).toBeNull();
  });

  it('pide escribir un nombre si está vacío', () => {
    expect(validateCatalogName('', 80)).toBe('Escribe un nombre.');
  });

  it('avisa si el nombre es demasiado largo', () => {
    expect(validateCatalogName('a'.repeat(81), 80)).toBe(
      'El nombre puede tener hasta 80 caracteres.',
    );
  });
});

describe('Nombre repetido', () => {
  it('detecta el mismo nombre aunque cambien las mayúsculas', () => {
    expect(isNameTaken('llaves', ['Celulares', 'Llaves'])).toBe(true);
  });

  it('detecta el mismo nombre aunque cambien las tildes', () => {
    expect(isNameTaken('Audifonos', ['Audífonos'])).toBe(true);
  });

  it('acepta un nombre que nadie más usa', () => {
    expect(isNameTaken('Paraguas', ['Celulares', 'Llaves'])).toBe(false);
  });
});
