import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';

describe('Diseño general de la app', () => {
  it('muestra la pantalla y deja ir a Inicio y a Mi perfil', () => {
    render(
      <MemoryRouter>
        <AppLayout role="COMMUNITY">
          <p>Contenido de la pantalla</p>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Contenido de la pantalla')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil');
  });

  it('muestra el acceso a Bienestar cuando la cuenta tiene rol WELFARE', () => {
    render(
      <MemoryRouter>
        <AppLayout role="WELFARE">
          <p>Contenido de la pantalla</p>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Bienestar' })).toHaveAttribute(
      'href',
      '/bienestar',
    );
  });

  it.each(['COMMUNITY', 'ADMIN'] as const)(
    'oculta el acceso a Bienestar para una cuenta %s',
    (role) => {
    render(
      <MemoryRouter>
          <AppLayout role={role}>
          <p>Contenido de la pantalla</p>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Bienestar' })).not.toBeInTheDocument();
    },
  );
});
