import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackHeader } from './BackHeader';

describe('Encabezado con volver', () => {
  it('muestra el título de la pantalla y deja volver atrás', async () => {
    const onBack = jest.fn();
    render(<BackHeader title="Reportar hallazgo" onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByRole('heading', { name: 'Reportar hallazgo' })).toBeInTheDocument();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
