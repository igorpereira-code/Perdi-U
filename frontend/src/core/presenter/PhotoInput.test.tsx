import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoInput } from './PhotoInput';

const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:vista-previa');
  URL.revokeObjectURL = jest.fn();
});

describe('Selector de foto', () => {
  it('solo deja elegir imágenes desde la galería, sin abrir la cámara', () => {
    render(<PhotoInput onChange={jest.fn()} />);

    const input = screen.getByLabelText('Foto del objeto');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).not.toHaveAttribute('capture');
  });

  it('muestra la vista previa de la foto elegida', async () => {
    const onChange = jest.fn();
    render(<PhotoInput onChange={onChange} />);

    await userEvent.upload(screen.getByLabelText('Foto del objeto'), photo);

    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:vista-previa',
    );
    expect(onChange).toHaveBeenCalledWith(photo);
  });

  it('permite quitar la foto elegida', async () => {
    const onChange = jest.fn();
    render(<PhotoInput onChange={onChange} />);
    await userEvent.upload(screen.getByLabelText('Foto del objeto'), photo);

    await userEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));

    expect(screen.queryByRole('img', { name: 'Vista previa de la foto' })).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
