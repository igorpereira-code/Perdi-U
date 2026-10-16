import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Botón', () => {
  it('muestra su texto y responde al clic', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Enviar reporte</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no responde al clic cuando está deshabilitado', async () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Enviar reporte
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('no envía formularios por accidente', () => {
    render(<Button>Cancelar</Button>);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
  });
});
