import { formatReportDate } from './formatReportDate';

describe('Fecha del reporte para la comunidad universitaria', () => {
  it('muestra día, mes y año en Bolivia aunque el instante UTC corresponda al día siguiente', () => {
    expect(formatReportDate('2026-10-19T02:30:00.000Z')).toBe('18/10/2026');
  });
});
