import { render, screen } from '@testing-library/react';
import App from './App';

describe('Pantalla principal', () => {
  it('muestra el nombre de la app', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Perdi-U' })).toBeInTheDocument();
  });
});
