import { readCatalogChanges } from './readCatalogChanges';

describe('Leer los cambios de una categoría o lugar', () => {
  it('lee el nuevo nombre, ya limpio', () => {
    expect(readCatalogChanges({ name: '  Llaves  ' }, 80)).toEqual({
      changes: { name: 'Llaves' },
    });
  });

  it('lee si se activa o desactiva', () => {
    expect(readCatalogChanges({ active: false }, 80)).toEqual({ changes: { active: false } });
  });

  it('rechaza un nombre vacío', () => {
    expect(readCatalogChanges({ name: '   ' }, 80)).toEqual({ error: 'Escribe un nombre.' });
  });

  it('rechaza un estado que no es sí o no', () => {
    expect(readCatalogChanges({ active: 'no' }, 80)).toEqual({
      error: 'El estado no es válido.',
    });
  });

  it('avisa si no se envió ningún cambio', () => {
    expect(readCatalogChanges({}, 80)).toEqual({ error: 'No hay cambios para guardar.' });
  });
});
