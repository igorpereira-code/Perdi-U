import { sortNewestFirst } from './sortNewestFirst';

const at = (id: string, iso: string) => ({ id, createdAt: new Date(iso) });

describe('Orden de los avisos', () => {
  it('ordena los avisos del más reciente al más antiguo', () => {
    const notifications = [
      at('lunes', '2026-11-02T10:00:00.000Z'),
      at('miercoles', '2026-11-04T10:00:00.000Z'),
      at('martes', '2026-11-03T10:00:00.000Z'),
    ];

    expect(sortNewestFirst(notifications).map(({ id }) => id)).toEqual([
      'miercoles',
      'martes',
      'lunes',
    ]);
  });

  it('no cambia la lista original', () => {
    const notifications = [
      at('antiguo', '2026-11-02T10:00:00.000Z'),
      at('nuevo', '2026-11-04T10:00:00.000Z'),
    ];

    sortNewestFirst(notifications);

    expect(notifications.map(({ id }) => id)).toEqual(['antiguo', 'nuevo']);
  });
});
