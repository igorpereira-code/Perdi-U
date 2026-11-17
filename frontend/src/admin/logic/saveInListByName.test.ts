import { saveInListByName } from './saveInListByName';

const llaves = { id: 1, name: 'Llaves', active: true };
const paraguas = { id: 2, name: 'Paraguas', active: false };

describe('Guardar en la lista', () => {
  it('agrega un elemento nuevo en su lugar alfabético', () => {
    const audifonos = { id: 3, name: 'Audífonos', active: true };

    expect(saveInListByName([llaves, paraguas], audifonos)).toEqual([audifonos, llaves, paraguas]);
  });

  it('reemplaza el elemento editado y reordena si cambió el nombre', () => {
    const renamed = { ...llaves, name: 'Tarjetas' };

    expect(saveInListByName([llaves, paraguas], renamed)).toEqual([paraguas, renamed]);
  });

  it('no cambia la lista original', () => {
    const items = [llaves];

    saveInListByName(items, { ...llaves, active: false });

    expect(items).toEqual([llaves]);
  });
});
