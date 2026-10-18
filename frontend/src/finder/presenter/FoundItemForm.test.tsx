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

describe('Fotografía opcional del objeto encontrado', () => {
  const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-del-objeto');
    URL.revokeObjectURL = jest.fn();
  });

  it('permite seleccionar una fotografía desde el formulario y ver su vista previa', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm />);

    expect(screen.queryByLabelText('Foto del objeto')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Foto del objeto'), photo);

    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-del-objeto',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
  });

  it('indica que la fotografía es opcional y permite escribir la descripción sin seleccionarla', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm />);

    expect(screen.queryByRole('group', { name: 'Fotografía (opcional)' })).toBeInTheDocument();

    const photoInput = screen.getByLabelText('Foto del objeto');
    expect(photoInput).not.toBeRequired();
    expect(photoInput).toHaveAttribute('accept', 'image/*');
    expect(photoInput).not.toHaveAttribute('capture');

    const description = 'Llaves con un llavero azul';
    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
    expect(screen.queryByRole('img', { name: 'Vista previa de la foto' })).not.toBeInTheDocument();
  });

  it('permite quitar la fotografía seleccionada sin perder la descripción', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm />);
    const description = 'Llaves con un llavero azul';

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    expect(screen.queryByLabelText('Foto del objeto')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    await user.click(screen.getByRole('button', { name: 'Quitar foto' }));

    expect(screen.queryByRole('img', { name: 'Vista previa de la foto' })).not.toBeInTheDocument();
    expect(screen.queryByText(photo.name)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Foto del objeto')).not.toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
  });
});
