import { getStatusDisplay } from './status';

describe('Cómo se muestra un estado al usuario', () => {
  it('muestra un objeto en custodia como "En custodia", con tono informativo', () => {
    expect(getStatusDisplay('IN_CUSTODY')).toEqual({ label: 'En custodia', tone: 'info' });
  });

  it('muestra un reporte pendiente de recojo como "Pendiente de recojo", con tono de espera', () => {
    expect(getStatusDisplay('PENDING_PICKUP')).toEqual({
      label: 'Pendiente de recojo',
      tone: 'waiting',
    });
  });

  it('resalta los reportes que tienen coincidencias', () => {
    expect(getStatusDisplay('HAS_MATCHES')).toEqual({
      label: 'Con coincidencias',
      tone: 'highlight',
    });
  });

  it('muestra como logrados los objetos entregados y los reportes recuperados', () => {
    expect(getStatusDisplay('DELIVERED').tone).toBe('done');
    expect(getStatusDisplay('RECOVERED').tone).toBe('done');
  });
});
