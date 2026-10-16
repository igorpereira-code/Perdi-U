import { render, screen } from '@testing-library/react';
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
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <App authService={authService} />
    </MemoryRouter>,
  );
}

describe('Navegación de la app', () => {
  it('muestra la pantalla de ingreso en /ingresar', () => {
    renderAt('/ingresar', null);

    expect(screen.getByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });

  it('muestra la pantalla principal a quien ya ingresó', async () => {
    renderAt('/', igor);

    expect(await screen.findByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
  });

  it('devuelve a la pantalla de ingreso con un aviso si la cuenta no es de la universidad', async () => {
    renderAt('/', new NotInstitutionalEmailError());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo se permiten cuentas institucionales',
    );
    expect(screen.getByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });
});
