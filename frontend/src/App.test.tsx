import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import App from './App';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';

const igor: AppUser = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  role: 'COMMUNITY',
};

function renderAt(path: string, user: AppUser | null | Error) {
  const authService: AuthService = {
    getCurrentUser:
      user instanceof Error ? jest.fn().mockRejectedValue(user) : jest.fn().mockResolvedValue(user),
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <App authService={authService} />
    </MemoryRouter>,
  );
  return authService;
}

describe('Navegación de la app', () => {
  it('muestra la pantalla de ingreso en /ingresar', async () => {
    renderAt('/ingresar', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });

  it('manda a la pantalla de ingreso a quien no inició sesión', async () => {
    renderAt('/', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });

  it('muestra la pantalla principal a quien ya ingresó', async () => {
    renderAt('/', igor);

    expect(await screen.findByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
  });

  it('muestra su perfil en /perfil', async () => {
    renderAt('/perfil', igor);

    expect(await screen.findByRole('heading', { name: 'Igor Pereira' })).toBeInTheDocument();
    expect(screen.getByText('igor.pereira@ucb.edu.bo')).toBeInTheDocument();
  });

  it('cierra la sesión desde Mi perfil y vuelve a la pantalla de ingreso', async () => {
    const authService = renderAt('/perfil', igor);

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(authService.signOut).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });

  it('devuelve a la pantalla de ingreso con un aviso si la cuenta no es de la universidad', async () => {
    renderAt('/', new NotInstitutionalEmailError());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo se permiten cuentas institucionales',
    );
    expect(screen.getByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });
});
