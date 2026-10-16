import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';

describe('Diseño general de la app', () => {
  it('muestra la pantalla y deja ir a Inicio y a Mi perfil', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <p>Contenido de la pantalla</p>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Contenido de la pantalla')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil');
  });
});
