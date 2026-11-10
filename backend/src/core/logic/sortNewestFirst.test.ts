import { sortNewestFirst } from './sortNewestFirst';

const createNotificationAt = (id: string, isoDate: string) => ({
  id,
  createdAt: new Date(isoDate),
});

describe('Orden de los avisos', () => {
  it('ordena los avisos del más reciente al más antiguo', () => {
    const notifications = [
      createNotificationAt('lunes', '2026-11-02T10:00:00.000Z'),
      createNotificationAt('miercoles', '2026-11-04T10:00:00.000Z'),
      createNotificationAt('martes', '2026-11-03T10:00:00.000Z'),
    ];

    expect(sortNewestFirst(notifications).map(({ id }) => id)).toEqual([
      'miercoles',
      'martes',
      'lunes',
    ]);
  });

  it('no cambia la lista original', () => {
    const notifications = [
      createNotificationAt('antiguo', '2026-11-02T10:00:00.000Z'),
      createNotificationAt('nuevo', '2026-11-04T10:00:00.000Z'),
    ];

    sortNewestFirst(notifications);

    expect(notifications.map(({ id }) => id)).toEqual(['antiguo', 'nuevo']);
  });
});
