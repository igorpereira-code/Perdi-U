import { toTimeFilter } from './toTimeFilter';

describe('Rango de fechas en hora de Bolivia', () => {
  it('va desde el inicio del primer día hasta el final del último', () => {
    expect(toTimeFilter({ from: '2026-11-01', to: '2026-11-30' })).toEqual({
      gte: new Date('2026-11-01T04:00:00.000Z'),
      lt: new Date('2026-12-01T04:00:00.000Z'),
    });
  });

  it('un rango de un solo día dura 24 horas', () => {
    expect(toTimeFilter({ from: '2026-11-12', to: '2026-11-12' })).toEqual({
      gte: new Date('2026-11-12T04:00:00.000Z'),
      lt: new Date('2026-11-13T04:00:00.000Z'),
    });
  });
});
