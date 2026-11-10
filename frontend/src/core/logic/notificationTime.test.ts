import { formatNotificationTime } from './notificationTime';

// 6 de noviembre de 2026, 15:00 en Bolivia (19:00 UTC).
const now = new Date('2026-11-06T19:00:00.000Z');

describe('Cuándo pasó cada aviso', () => {
  it('dice "Hace un momento" si pasó hace menos de un minuto', () => {
    expect(formatNotificationTime('2026-11-06T18:59:30.000Z', now)).toBe('Hace un momento');
  });

  it('dice hace cuántos minutos si pasó hace menos de una hora', () => {
    expect(formatNotificationTime('2026-11-06T18:55:00.000Z', now)).toBe('Hace 5 min');
    expect(formatNotificationTime('2026-11-06T18:01:00.000Z', now)).toBe('Hace 59 min');
  });

  it('dice hace cuántas horas si pasó más temprano el mismo día', () => {
    expect(formatNotificationTime('2026-11-06T16:00:00.000Z', now)).toBe('Hace 3 h');
    expect(formatNotificationTime('2026-11-06T04:30:00.000Z', now)).toBe('Hace 14 h');
  });

  it('dice "Ayer" si pasó el día anterior en Bolivia', () => {
    expect(formatNotificationTime('2026-11-06T03:00:00.000Z', now)).toBe('Ayer');
    expect(formatNotificationTime('2026-11-05T12:00:00.000Z', now)).toBe('Ayer');
  });

  it('muestra la fecha si pasó antes de ayer', () => {
    expect(formatNotificationTime('2026-11-04T15:00:00.000Z', now)).toBe('04/11/2026');
  });
});
