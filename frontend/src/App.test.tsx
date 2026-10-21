import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import App from './App';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import type { MatchView } from '@shared/matching';
import type { MatchesService } from './matching/data/matchesService';
import type { GuideService } from './finder/data/guideService';
import type { FoundItemsService, MyFoundItem } from './finder/data/foundItemsService';
import type { WelfareService } from './welfare/data/welfareService';
import type { LostReportsService } from './owner/data/lostReportsService';
import type { CatalogService } from './owner/data/catalogService';

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
  hasSeenGuide: true,
};
const foundReport: MyFoundItem = {
  code: 'HZ-7325',
  description: 'Llaves azules',
  category: 'Llaves',
  foundAt: '2026-10-18T12:15:00.000Z',
  hasPhoto: false,
  status: 'PENDING_DROP_OFF',
  receivedAt: null,
};
const welfareUser: AppUser = { ...igor, id: 'google-2', role: 'WELFARE', name: 'Chiqui' };

function renderAt(
  path: string,
  user: AppUser | null | Error | Promise<AppUser | null>,
  matches: MatchView[] | null = [],
  guideService: GuideService = { markSeen: jest.fn().mockResolvedValue(undefined) },
  foundItemsOverrides: Partial<FoundItemsService> = {},
) {
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
  const foundItemsService: FoundItemsService = {
    listMine: jest.fn().mockResolvedValue([]),
    getMineByCode: jest.fn().mockResolvedValue(null),
    getCatalogs: jest.fn().mockResolvedValue({ categories: [], places: [] }),
    create: jest.fn(),
    getPhotoUrl: jest.fn(),
    ...foundItemsOverrides,
  };
  const welfareService: WelfareService = {
    listActiveLostReports: jest.fn().mockResolvedValue([]),
    findLostReportByCode: jest.fn(),
    listPendingPickups: jest.fn().mockResolvedValue([]),
    listPending: jest.fn().mockResolvedValue([]),
    listInOffice: jest.fn().mockResolvedValue([]),
    findByCode: jest.fn(),
    receive: jest.fn(),
    deliver: jest.fn(),
  };
  const lostReportsService: LostReportsService = { create: jest.fn() };
  const catalogService = { list: jest.fn().mockResolvedValue([]), getByCode: jest.fn().mockResolvedValue(null) } as CatalogService;
  const rendered = render(
    <MemoryRouter initialEntries={[path]}>
      <App
        authService={authService}
        matchesService={matchesService}
        guideService={guideService}
        foundItemsService={foundItemsService}
        welfareService={welfareService}
        lostReportsService={lostReportsService}
        catalogService={catalogService}
      />
    </MemoryRouter>,
  );
  return { ...rendered, ...authService, ...matchesService, ...guideService, ...foundItemsService };
}

describe('Navegación de la app', () => {
  it('abre un reporte propio desde Mis reportes', async () => {
    const service = renderAt('/mis-reportes', igor, [], undefined, {
      listMine: jest.fn().mockResolvedValue([foundReport]),
      getMineByCode: jest.fn().mockResolvedValue(foundReport),
    });

    await userEvent.click(await screen.findByRole('link', { name: 'Ver reporte HZ-7325' }));

    expect(await screen.findByRole('heading', { name: 'Detalle del reporte' })).toBeInTheDocument();
    expect(screen.getByText(foundReport.code)).toBeInTheDocument();
    expect(service.getMineByCode).toHaveBeenCalledWith(foundReport.code);
  });

  it('recupera el código desde una URL directa y después de volver a cargar la app', async () => {
    for (let visit = 0; visit < 2; visit++) {
      const service = renderAt('/mis-reportes/encontrados/HZ-7325', igor, [], undefined, {
        getMineByCode: jest.fn().mockResolvedValue(foundReport),
      });

      expect(await screen.findByText(foundReport.code)).toBeInTheDocument();
      expect(service.getMineByCode).toHaveBeenCalledWith(foundReport.code);
      expect(service.listMine).not.toHaveBeenCalled();
      service.unmount();
    }
  });

  it('protege el detalle de un reporte encontrado cuando no hay sesión', async () => {
    const service = renderAt('/mis-reportes/encontrados/HZ-7325', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
    expect(service.getMineByCode).not.toHaveBeenCalled();
  });

  it('muestra el aviso de reporte inexistente o ajeno al abrir un detalle no autorizado', async () => {
    renderAt('/mis-reportes/encontrados/HZ-9999', igor);

    expect(
      await screen.findByRole('heading', { name: 'No encontramos este reporte' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(foundReport.description)).not.toBeInTheDocument();
  });

  it('abre Mis reportes desde Inicio para el hallador autenticado', async () => {
    const service = renderAt('/', igor);

    await userEvent.click(await screen.findByRole('link', { name: 'Mis reportes' }));

    expect(await screen.findByRole('heading', { name: 'Mis reportes' })).toBeInTheDocument();
    expect(service.listMine).toHaveBeenCalledTimes(1);
  });

  it('protege Mis reportes cuando no hay sesión', async () => {
    const service = renderAt('/mis-reportes', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
    expect(service.listMine).not.toHaveBeenCalled();
  });

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
      await screen.findByRole('heading', {
        name: 'Todavía no hay objetos parecidos',
      }),
    ).toBeInTheDocument();
  });

  it('vuelve al inicio cuando el usuario salta la guía rápida', async () => {
    renderAt('/guia-rapida', igor);

    const boton = await screen.findByRole('button', {
      name: 'Saltar guía',
    });

    await userEvent.click(boton);

    expect(
      await screen.findByRole('heading', {
        name: 'Hola, Igor Pereira',
      }),
    ).toBeInTheDocument();
  });
  it('muestra Encontré un objeto en la pantalla principal', async () => {
    renderAt('/', igor);

    expect(
      await screen.findByRole('button', {
        name: 'Encontré un objeto',
      }),
    ).toBeInTheDocument();
  });

  it('abre el formulario para reportar el objeto al elegir Encontré un objeto desde Inicio', async () => {
    const user = userEvent.setup();
    renderAt('/', igor);

    await user.click(await screen.findByRole('button', { name: 'Encontré un objeto' }));

    expect(
      await screen.findByRole('form', { name: 'Reportar objeto encontrado' }),
    ).toBeInTheDocument();
  });

  it('redirige al ingreso a quien abre /reportar-objeto sin sesión', async () => {
    renderAt('/reportar-objeto', null);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('form', { name: 'Reportar objeto encontrado' }),
    ).not.toBeInTheDocument();
  });
});

describe('Salir de la guía rápida con la decisión guardada', () => {
  it.each(['Saltar guía', 'Empezar a usar Perdi-U'])(
    'guarda la decisión antes de continuar con «%s»',
    async (action) => {
      const service = renderAt('/guia-rapida', igor);

      await userEvent.click(await screen.findByRole('button', { name: action }));

      expect(service.markSeen).toHaveBeenCalledTimes(1);
      expect(
        await screen.findByRole('heading', { name: 'Hola, Igor Pereira' }),
      ).toBeInTheDocument();
    },
  );

  it('espera la confirmación del servidor y evita solicitudes duplicadas', async () => {
    let resolveSave!: () => void;
    const guideService = {
      markSeen: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          }),
      ),
    };
    renderAt('/guia-rapida', igor, [], guideService);

    await userEvent.click(await screen.findByRole('button', { name: 'Saltar guía' }));

    expect(screen.getByRole('heading', { name: 'Bienvenido a Perdi-U' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saltar guía' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Empezar a usar Perdi-U' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Saltar guía' }));
    expect(guideService.markSeen).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
    });
    expect(await screen.findByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
  });

  it.each(['Saltar guía', 'Empezar a usar Perdi-U'])(
    'muestra el error, mantiene la guía y permite reintentar «%s»',
    async (action) => {
      const guideService = {
        markSeen: jest
          .fn()
          .mockRejectedValueOnce(new Error('Sin conexión'))
          .mockResolvedValue(undefined),
      };
      renderAt('/guia-rapida', igor, [], guideService);

      await userEvent.click(await screen.findByRole('button', { name: action }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos guardar tu decisión. Inténtalo de nuevo.',
      );
      expect(screen.getByRole('heading', { name: 'Bienvenido a Perdi-U' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Hola, Igor Pereira' })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: action }));

      await waitFor(() => expect(guideService.markSeen).toHaveBeenCalledTimes(2));
      expect(
        await screen.findByRole('heading', { name: 'Hola, Igor Pereira' }),
      ).toBeInTheDocument();
    },
  );

  it('protege la guía cuando no hay una sesión iniciada', async () => {
    const service = renderAt('/guia-rapida', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
    expect(service.markSeen).not.toHaveBeenCalled();
  });
});

describe('Guía automática durante el primer ingreso', () => {
  const firstVisit: AppUser = { ...igor, hasSeenGuide: false };

  it.each(['/', '/perfil', '/mis-reportes/PR-0001/coincidencias', '/guia-rapida', '/ingresar'])(
    'muestra los cuatro pasos y la advertencia al ingresar por %s con la guía pendiente',
    async (path) => {
      const service = renderAt(path, firstVisit);

      expect(
        await screen.findByRole('heading', { name: 'Bienvenido a Perdi-U' }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(screen.getByText('Encuentra el objeto')).toBeInTheDocument();
      expect(screen.getByText('Reporta el hallazgo')).toBeInTheDocument();
      expect(screen.getByText('Lleva el objeto a Bienestar Estudiantil')).toBeInTheDocument();
      expect(screen.getByText('El dueño lo recoge en Bienestar')).toBeInTheDocument();
      expect(screen.getByRole('note')).toHaveTextContent(
        'No debes entregarlo directamente a su dueño.',
      );
      expect(service.markSeen).not.toHaveBeenCalled();
      expect(service.getMatches).not.toHaveBeenCalled();
    },
  );

  it('espera a conocer el perfil antes de decidir si muestra la guía', async () => {
    let resolveUser!: (user: AppUser) => void;
    const pendingUser = new Promise<AppUser>((resolve) => {
      resolveUser = resolve;
    });
    renderAt('/', pendingUser);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    await act(async () => {
      resolveUser(firstVisit);
    });

    expect(
      await screen.findByRole('heading', { name: 'Bienvenido a Perdi-U' }),
    ).toBeInTheDocument();
  });

  it.each(['Saltar guía', 'Empezar a usar Perdi-U'])(
    'permite navegar y no repite la guía en el siguiente ingreso después de «%s»',
    async (action) => {
      let persistedUser = { ...firstVisit };
      const guideService = {
        markSeen: jest.fn(async () => {
          persistedUser = { ...persistedUser, hasSeenGuide: true };
        }),
      };
      const firstLogin = renderAt('/', persistedUser, [], guideService);

      await userEvent.click(await screen.findByRole('button', { name: action }));

      expect(
        await screen.findByRole('heading', { name: 'Hola, Igor Pereira' }),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole('link', { name: 'Mi perfil' }));
      expect(await screen.findByRole('heading', { name: 'Igor Pereira' })).toBeInTheDocument();
      expect(firstLogin.getCurrentUser).toHaveBeenCalledTimes(1);

      firstLogin.unmount();
      const nextLogin = renderAt('/', persistedUser, [], guideService);

      expect(
        await screen.findByRole('heading', { name: 'Hola, Igor Pereira' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Bienvenido a Perdi-U' }),
      ).not.toBeInTheDocument();
      expect(guideService.markSeen).toHaveBeenCalledTimes(1);
      expect(nextLogin.getCurrentUser).toHaveBeenCalledTimes(1);
    },
  );

  it('mantiene pendiente la guía tras un error y permite continuar al reintentar', async () => {
    const guideService = {
      markSeen: jest
        .fn()
        .mockRejectedValueOnce(new Error('Sin conexión'))
        .mockResolvedValue(undefined),
    };
    renderAt('/', firstVisit, [], guideService);

    await userEvent.click(await screen.findByRole('button', { name: 'Saltar guía' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar tu decisión.');
    await userEvent.click(screen.getByRole('link', { name: 'Inicio' }));

    expect(
      await screen.findByRole('heading', { name: 'Bienvenido a Perdi-U' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hola, Igor Pereira' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Saltar guía' }));

    expect(await screen.findByRole('heading', { name: 'Hola, Igor Pereira' })).toBeInTheDocument();
    expect(guideService.markSeen).toHaveBeenCalledTimes(2);
  });

  it('vuelve a mostrar la guía si se cierra la app sin completarla ni omitirla', async () => {
    const firstLogin = renderAt('/', firstVisit);
    expect(
      await screen.findByRole('heading', { name: 'Bienvenido a Perdi-U' }),
    ).toBeInTheDocument();
    firstLogin.unmount();

    const nextLogin = renderAt('/', firstVisit);

    expect(
      await screen.findByRole('heading', { name: 'Bienvenido a Perdi-U' }),
    ).toBeInTheDocument();
    expect(firstLogin.markSeen).not.toHaveBeenCalled();
    expect(nextLogin.markSeen).not.toHaveBeenCalled();
  });
});

describe('Opción Perdí un objeto en el inicio', () => {
  it('muestra Perdí un objeto en la pantalla principal', async () => {
    renderAt('/', igor);

    expect(await screen.findByRole('button', { name: 'Perdí un objeto' })).toBeInTheDocument();
  });
});

describe('Abrir el formulario de pérdida desde el inicio', () => {
  it('abre el formulario al elegir Perdí un objeto', async () => {
    renderAt('/', igor);

    await userEvent.click(await screen.findByRole('button', { name: 'Perdí un objeto' }));

    expect(await screen.findByRole('form', { name: 'Reportar objeto perdido' })).toBeInTheDocument();
  });

  it('pide iniciar sesión a quien abre /reportar-perdida sin sesión', async () => {
    renderAt('/reportar-perdida', null);

    expect(await screen.findByRole('button', { name: 'Ingresar con Google' })).toBeInTheDocument();
  });
});

describe('Objetos encontrados en el inicio', () => {
  it('muestra la sección de objetos encontrados en la pantalla principal', async () => {
    renderAt('/', igor);

    expect(await screen.findByRole('heading', { name: 'Objetos encontrados' })).toBeInTheDocument();
  });
});