import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./core/data/supabase', () => ({ supabase: { auth: {} } }));

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Pantalla principal', () => {
  it('muestra el nombre de la app', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Perdi-U' })).toBeInTheDocument();
  });

  it('muestra la pantalla de ingreso en /ingresar', () => {
    renderAt('/ingresar');

    expect(screen.getByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });
});
