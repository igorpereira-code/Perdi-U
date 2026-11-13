import { getNotificationDestination } from './getNotificationDestination';

describe('Pantalla que se abre al tocar un aviso', () => {
  it.each([
    '/mis-perdidas/PR-0001',
    '/mis-reportes/encontrados/HZ-0001',
    '/objetos/HZ-0003',
    '/bienestar',
  ])('abre la pantalla relacionada (%s)', (link) => {
    expect(getNotificationDestination(link)).toBe(link);
  });

  it('no abre ninguna pantalla si el aviso no tiene una relacionada', () => {
    expect(getNotificationDestination(null)).toBeNull();
  });

  it.each([
    'https://sitio-externo.com',
    '//sitio-externo.com',
    '/\\sitio-externo.com',
    'mis-perdidas',
    '',
  ])('no abre direcciones fuera de Perdi-U (%s)', (link) => {
    expect(getNotificationDestination(link)).toBeNull();
  });
});
