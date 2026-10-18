import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoundItemForm } from './FoundItemForm';

describe('Descripción del objeto encontrado', () => {
  it('muestra un campo accesible para ingresar la descripción del objeto', () => {
    render(<FoundItemForm />);

    expect(screen.queryByRole('textbox', { name: 'Descripción del objeto' })).toBeInTheDocument();
  });

  it('permite escribir y conservar la descripción al volver a renderizar el formulario', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm />);
    const description = 'Teléfono con funda azul y una marca en la esquina.';

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);

    await user.tab();
    rerender(<FoundItemForm />);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
  });
});
