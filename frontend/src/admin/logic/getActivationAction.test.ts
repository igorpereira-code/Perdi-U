import { getActivationAction } from './getActivationAction';

describe('Botón para activar o desactivar', () => {
  it('a lo que está activo le ofrece desactivarlo', () => {
    expect(getActivationAction(true)).toEqual({
      label: 'Desactivar',
      loadingText: 'Desactivando…',
      newActive: false,
    });
  });

  it('a lo que está desactivado le ofrece volver a activarlo', () => {
    expect(getActivationAction(false)).toEqual({
      label: 'Activar',
      loadingText: 'Activando…',
      newActive: true,
    });
  });
});
