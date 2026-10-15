import { render, screen } from '@testing-library/react';
import { Thumb } from './Thumb';

describe('Miniatura del objeto', () => {
  it('muestra la foto del objeto cuando tiene una', () => {
    render(<Thumb photoUrl="https://example.com/llaves.jpg" category="Llaves" />);

    expect(screen.getByRole('img', { name: 'Foto del objeto' })).toHaveAttribute(
      'src',
      'https://example.com/llaves.jpg',
    );
  });

  it('muestra el ícono de la categoría cuando no tiene foto', () => {
    render(<Thumb category="Llaves" />);

    expect(screen.getByRole('img', { name: 'Llaves' })).toBeInTheDocument();
  });
});
