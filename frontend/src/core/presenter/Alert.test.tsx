import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alerta', () => {
  it('muestra un aviso importante para el usuario', () => {
    render(<Alert>El objeto no se entrega directamente al dueño.</Alert>);

    expect(screen.getByRole('note')).toHaveTextContent(
      'El objeto no se entrega directamente al dueño.',
    );
  });
});
