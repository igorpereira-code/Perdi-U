import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

const igor = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  role: 'COMMUNITY' as const,
};

describe('Pantalla principal', () => {
  it('da la bienvenida al usuario que ingresó', () => {
    render(<HomePage user={igor} />);

    expect(screen.getByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
  });
});
