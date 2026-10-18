import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CATEGORIES } from '../../../../backend/prisma/seed/catalogs';
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

describe('Categoría del objeto encontrado', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-categoria');
    URL.revokeObjectURL = jest.fn();
  });

  it('muestra un selector accesible con las categorías definidas en el proyecto', () => {
    render(<FoundItemForm />);

    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    const categorySelect = screen.getByRole('combobox', { name: 'Categoría' });
    const options = within(categorySelect)
      .getAllByRole('option')
      .filter((option) => option.getAttribute('value') !== '');

    expect(options.map((option) => option.textContent)).toEqual(CATEGORIES);
    expect(options.map((option) => option.getAttribute('value'))).toEqual(CATEGORIES);
  });

  it('permite seleccionar y cambiar la categoría y conserva la selección al renderizar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm />);

    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'Llaves');
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('Llaves');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'Otros');
    rerender(<FoundItemForm />);

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('Otros');
  });

  it('conserva la descripción y la fotografía al seleccionar una categoría', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm />);
    const description = 'Llaves con un llavero azul';
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'Llaves');

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('Llaves');
    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-con-categoria',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
  });
});
