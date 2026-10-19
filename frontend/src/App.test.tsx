import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import App from './App';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import type { MatchView } from '@shared/matching';
import type { MatchesService } from './matching/data/matchesService';
import type { WelfareService } from './welfare/data/welfareService';

const phone: MatchView = {
  id: 'match-1',
  status: 'SUGGESTED',
  similarity: 100,
  foundItem: {
    code: 'HZ-0001',
    description: 'Celular Samsung con funda azul',
    photoUrl: null,
    category: 'Electrónicos',
  },
};
const igor: AppUser = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  role: 'COMMUNITY',
};
const welfareUser: AppUser = { ...igor, id: 'google-2', role: 'WELFARE', name: 'Chiqui' };

function renderAt(path: string, user: AppUser | null | Error, matches: MatchView[] | null = []) {
  const authService: AuthService = {
    getCurrentUser:
      user instanceof Error ? jest.fn().mockRejectedValue(user) : jest.fn().mockResolvedValue(user),
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
  const matchesService: MatchesService = {
    getMatches: jest.fn().mockResolvedValue(matches),
    pickUp: jest.fn(),
    dismiss: jest.fn(),
    publish: jest.fn(),
  };
  const welfareService: WelfareService = {
    listActiveLostReports: jest.fn().mockResolvedValue([]),
    listPendingPickups: jest.fn().mockResolvedValue([]),
    listPending: jest.fn().mockResolvedValue([]),
    listInOffice: jest.fn().mockResolvedValue([]),
    findByCode: jest.fn(),
    receive: jest.fn(),
    deliver: jest.fn(),
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <App authService={authService} matchesService={matchesService} welfareService={welfareService} />
    </MemoryRouter>,
  );
  return { ...authService, ...matchesService };
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

  it('muestra los objetos parecidos a su reporte en /mis-reportes/<código>/coincidencias', async () => {
    renderAt('/mis-reportes/PR-0001/coincidencias', igor, [phone]);

    expect(await screen.findByText('Celular Samsung con funda azul')).toBeInTheDocument();
  });

  it('avisa cuando el reporte no existe o no es suyo', async () => {
    renderAt('/mis-reportes/PR-0002/coincidencias', igor, null);

    expect(
      await screen.findByRole('heading', { name: 'No encontramos este reporte' }),
    ).toBeInTheDocument();
  });

  it('muestra el panel de Bienestar al personal autorizado', async () => {
    renderAt('/bienestar', welfareUser);
    expect(await screen.findByRole('heading', { name: 'Panel de Bienestar' })).toBeInTheDocument();
  });

  it('impide que la comunidad abra el panel de Bienestar', async () => {
    renderAt('/bienestar', igor);
    expect(await screen.findByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
  });

  it('avisa a Bienestar al elegir "Pasaré a recoger" y lo muestra elegido', async () => {
    const services = renderAt('/mis-reportes/PR-0001/coincidencias', igor, [phone]);

    await userEvent.click(await screen.findByRole('button', { name: 'Pasaré a recoger' }));

    expect(services.pickUp).toHaveBeenCalledWith('match-1');
    expect(await screen.findByText('Pasarás a recoger este objeto')).toBeInTheDocument();
  });

  it('quita el objeto de la lista al elegir "No es mío"', async () => {
    const services = renderAt('/mis-reportes/PR-0001/coincidencias', igor, [phone]);

    await userEvent.click(await screen.findByRole('button', { name: 'No es mío' }));

    expect(services.dismiss).toHaveBeenCalledWith('match-1');
    expect(
      await screen.findByRole('heading', { name: 'Todavía no hay objetos parecidos' }),
    ).toBeInTheDocument();
  });
});
