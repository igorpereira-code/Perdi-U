import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import type { WelfareFoundItemView, WelfarePendingPickupView } from '@shared/welfare';
import type { MatchesService } from '../../matching/data/matchesService';
import type { WelfareResult, WelfareService } from '../data/welfareService';
import { WelfarePage } from './WelfarePage';

const item: WelfareFoundItemView = {
  code: 'HZ-0005', description: 'Mochila negra con cuadernos', photoUrl: null,
  category: 'Mochilas', place: 'Bloque A', classroom: 'Aula 3',
  placeReference: 'Debajo de una mesa', foundAt: '2026-10-15T14:00:00.000Z',
  status: 'PENDING_DROP_OFF', finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

const inCustodyItem: WelfareFoundItemView = {
  ...item,
  code: 'HZ-0004',
  description: 'Calculadora gris',
  status: 'IN_CUSTODY',
};

const publishedItem: WelfareFoundItemView = {
  ...item,
  code: 'HZ-0003',
  description: 'Chamarra azul',
  status: 'PUBLISHED',
};

const pendingPickup: WelfarePendingPickupView = {
  matchId: 'match-1',
  owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
  report: { code: 'PR-0001' },
  foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul' },
};

function service(overrides: Partial<WelfareService> = {}): WelfareService {
  return {
    listActiveLostReports: jest.fn().mockResolvedValue([]),
    listPendingPickups: jest.fn().mockResolvedValue([]),
    listPending: jest.fn().mockResolvedValue([item]),
    listInOffice: jest.fn().mockResolvedValue([inCustodyItem, publishedItem]),
    findByCode: jest.fn().mockResolvedValue({ status: 'FOUND', item }),
    receive: jest.fn(),
    deliver: jest.fn(),
    ...overrides,
  };
}

function publishingService(): MatchesService {
  return {
    getMatches: jest.fn(),
    pickUp: jest.fn(),
    dismiss: jest.fn(),
    publish: jest.fn().mockResolvedValue({ status: 'PUBLISHED', matchCount: 2 }),
  };
}

function renderPage(welfareService: WelfareService = service()) {
  return render(
    <WelfarePage welfareService={welfareService} matchesService={publishingService()} />,
  );
}

describe('Panel de Bienestar', () => {
  it('mantiene el formulario y explica si el reporte no corresponde', async () => {
    renderPage(
      service({
        listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]),
        deliver: jest.fn().mockResolvedValue({ status: 'REPORT_NOT_ELIGIBLE' }),
      }),
    );
    const pickupCard = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(
      within(pickupCard!).getByRole('button', { name: 'Registrar entrega' }),
    );
    await userEvent.type(screen.getByLabelText('Código universitario'), '20205678');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));

    expect(
      await screen.findByText('El reporte no corresponde a este objeto o propietario'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Código universitario')).toHaveValue('20205678');
    expect(screen.getByText('PR-0001')).toBeInTheDocument();
  });

  it('confirma la entrega y retira el recojo y el objeto de la oficina', async () => {
    const pickupItem = {
      ...publishedItem,
      code: pendingPickup.foundItem.code,
      description: pendingPickup.foundItem.description,
    };
    const deliver = jest.fn().mockResolvedValue({
      status: 'DELIVERED',
      foundItemCode: pickupItem.code,
    });
    const welfareService = service({
      listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]),
      listInOffice: jest.fn().mockResolvedValue([pickupItem]),
      deliver,
    });
    renderPage(welfareService);
    const pickupCard = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(
      within(pickupCard!).getByRole('button', { name: 'Registrar entrega' }),
    );
    await userEvent.type(screen.getByLabelText('Código universitario'), '20205678');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));

    expect(deliver).toHaveBeenCalledWith({
      foundItemCode: 'HZ-0001',
      lostReportCode: 'PR-0001',
      recipientName: 'Ana Rojas',
      recipientEmail: 'ana.rojas@ucb.edu.bo',
      recipientUniversityCode: '20205678',
    });
    expect(await screen.findByText('Entrega registrada correctamente')).toBeInTheDocument();
    expect(screen.queryByLabelText('Código universitario')).not.toBeInTheDocument();
    expect(screen.queryByText('HZ-0001')).not.toBeInTheDocument();
  });

  it('permite elegir un objeto de la oficina y llenar una entrega sin reporte', async () => {
    renderPage();
    const itemCard = (await screen.findByText('HZ-0003')).closest('article');

    await userEvent.click(
      within(itemCard!).getByRole('button', { name: 'Registrar entrega' }),
    );

    expect(screen.getByLabelText('Código del objeto a entregar')).toHaveValue('HZ-0003');
    expect(screen.getByLabelText('Código del reporte (opcional)')).toHaveValue('');
    expect(screen.getByLabelText('Nombre de quien recibe')).toHaveValue('');
    expect(screen.getByLabelText('Correo institucional')).toHaveValue('');
  });

  it('inicia una entrega desde un recojo y precarga objeto reporte y propietario', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]) }));
    const pickupCard = (await screen.findByText('PR-0001')).closest('article');

    await userEvent.click(
      within(pickupCard!).getByRole('button', { name: 'Registrar entrega' }),
    );

    expect(screen.getByLabelText('Código del objeto a entregar')).toHaveValue('HZ-0001');
    expect(screen.getByLabelText('Código del reporte (opcional)')).toHaveValue('PR-0001');
    expect(screen.getByLabelText('Nombre de quien recibe')).toHaveValue('Ana Rojas');
    expect(screen.getByLabelText('Correo institucional')).toHaveValue(
      'ana.rojas@ucb.edu.bo',
    );
    expect(screen.getByLabelText('Código universitario')).toHaveValue('');
  });

  it('muestra quien vendra, su reporte y el objeto que recogera', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]) }));

    const section = (await screen.findByRole('heading', { name: 'Recojos pendientes' })).closest(
      'section',
    );
    expect(section).not.toBeNull();
    expect(await within(section!).findByText('Ana Rojas')).toBeInTheDocument();
    expect(within(section!).getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(within(section!).getByText('PR-0001')).toBeInTheDocument();
    expect(within(section!).getByText('HZ-0001')).toBeInTheDocument();
    expect(within(section!).getByText('Celular Samsung con funda azul')).toBeInTheDocument();
  });

  it('muestra un estado vacio cuando no hay recojos pendientes', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([]) }));

    expect(
      await screen.findByRole('heading', { name: 'No hay recojos pendientes' }),
    ).toBeInTheDocument();
  });

  it('muestra un aviso cuando no puede cargar los recojos pendientes', async () => {
    renderPage(
      service({ listPendingPickups: jest.fn().mockRejectedValue(new Error('network')) }),
    );

    expect(
      await screen.findByText('No pudimos cargar los recojos pendientes'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'No hay recojos pendientes' }),
    ).not.toBeInTheDocument();
  });

  it('publica un objeto en custodia y muestra cuantos reportes se parecen', async () => {
    const matchesService = publishingService();
    const PageWithPublishing = WelfarePage as unknown as ComponentType<{
      welfareService: WelfareService;
      matchesService: MatchesService;
    }>;
    render(<PageWithPublishing welfareService={service()} matchesService={matchesService} />);

    const custodyCard = (await screen.findByText('HZ-0004')).closest('article');
    expect(custodyCard).not.toBeNull();
    await userEvent.click(within(custodyCard!).getByRole('button', { name: 'Publicar' }));

    expect(await within(custodyCard!).findByText('Publicado: la comunidad ya puede ver este objeto.')).toBeInTheDocument();
    expect(within(custodyCard!).getByText('2 reportes de pérdida se parecen a este objeto.')).toBeInTheDocument();
    expect(within(custodyCard!).queryByText('En custodia')).not.toBeInTheDocument();
    expect(within(custodyCard!).queryByText('No publicado')).not.toBeInTheDocument();
    expect(within(custodyCard!).getAllByText('Publicado')).toHaveLength(2);
  });

  it('muestra codigo, estado y publicacion de los objetos que estan en la oficina', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Objetos en la oficina' })).toBeInTheDocument();
    const custodyCard = (await screen.findByText('HZ-0004')).closest('article');
    const publishedCard = screen.getByText('HZ-0003').closest('article');

    expect(custodyCard).not.toBeNull();
    expect(within(custodyCard!).getByText('En custodia')).toBeInTheDocument();
    expect(within(custodyCard!).getByText('No publicado')).toBeInTheDocument();
    expect(publishedCard).not.toBeNull();
    expect(within(publishedCard!).getAllByText('Publicado')).toHaveLength(2);
  });

  it('muestra la carga y luego los objetos pendientes', async () => {
    renderPage();
    expect(screen.getByText('Cargando objetos pendientes...')).toBeInTheDocument();
    expect(await screen.findByText('Mochila negra con cuadernos')).toBeInTheDocument();
  });

  it('muestra un estado vacio cuando no hay pendientes', async () => {
    renderPage(service({ listPending: jest.fn().mockResolvedValue([]) }));
    expect(await screen.findByRole('heading', { name: 'No hay objetos pendientes' })).toBeInTheDocument();
  });

  it('busca por codigo y muestra los datos del objeto y del Hallador', async () => {
    const welfareService = service();
    renderPage(welfareService);
    await userEvent.type(screen.getByLabelText('Código del objeto'), ' hz-0005 ');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(welfareService.findByCode).toHaveBeenCalledWith(' hz-0005 ');
    expect(await screen.findByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(screen.getByText('Aula 3')).toBeInTheDocument();
  });

  it.each([
    ['NOT_FOUND', 'No encontramos un objeto con ese código'],
    ['ALREADY_RECEIVED', 'Este objeto ya fue recibido'],
  ] as const)('muestra el resultado %s', async (status, message) => {
    renderPage(service({ findByCode: jest.fn().mockResolvedValue({ status }) }));
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-9999');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('muestra un error sin perder la pantalla', async () => {
    renderPage(service({ listPending: jest.fn().mockRejectedValue(new Error('network')) }));
    expect(await screen.findByText('No pudimos cargar los objetos pendientes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Panel de Bienestar' })).toBeInTheDocument();
  });

  it('confirma la recepcion, muestra exito y quita el objeto pendiente', async () => {
    let resolveInOffice!: (items: WelfareFoundItemView[]) => void;
    const listInOffice = jest.fn(
      () => new Promise<WelfareFoundItemView[]>((resolve) => (resolveInOffice = resolve)),
    );
    const welfareService = service({
      listInOffice,
      receive: jest.fn().mockResolvedValue({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } }),
    });
    renderPage(welfareService);
    await screen.findByText('Mochila negra con cuadernos');
    const pendingSection = screen
      .getByRole('heading', { name: 'Objetos pendientes de recepción' })
      .closest('section');
    const officeSection = screen.getByRole('heading', { name: 'Objetos en la oficina' }).closest('section');
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));

    expect(welfareService.receive).toHaveBeenCalledWith('HZ-0005');
    expect(await screen.findByText('Objeto recibido y puesto en custodia')).toBeInTheDocument();
    expect(within(pendingSection!).queryByText('HZ-0005')).not.toBeInTheDocument();
    expect(await within(officeSection!).findByText('HZ-0005')).toBeInTheDocument();

    await act(async () => resolveInOffice([inCustodyItem, publishedItem]));
    expect(within(officeSection!).getByText('HZ-0005')).toBeInTheDocument();
  });

  it('conserva el objeto recibido si falla la carga inicial de la oficina', async () => {
    let rejectInOffice!: (error: Error) => void;
    const listInOffice = jest.fn(
      () => new Promise<WelfareFoundItemView[]>((_, reject) => (rejectInOffice = reject)),
    );
    const welfareService = service({
      listInOffice,
      receive: jest.fn().mockResolvedValue({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } }),
    });
    renderPage(welfareService);
    const officeSection = screen.getByRole('heading', { name: 'Objetos en la oficina' }).closest('section');
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    expect(await within(officeSection!).findByText('HZ-0005')).toBeInTheDocument();

    await act(async () => rejectInOffice(new Error('network')));
    expect(within(officeSection!).getByText('HZ-0005')).toBeInTheDocument();
  });

  it('evita confirmar dos veces mientras guarda', async () => {
    let resolveReceive!: (result: WelfareResult) => void;
    const receive = jest.fn<Promise<WelfareResult>, [string]>(
      () => new Promise<WelfareResult>((resolve) => (resolveReceive = resolve)),
    );
    renderPage(service({ receive }));
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    const button = await screen.findByRole('button', { name: 'Confirmar recepción' });
    await userEvent.click(button);
    expect(button).toBeDisabled();
    resolveReceive({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } });
    expect(await screen.findByText('Objeto recibido y puesto en custodia')).toBeInTheDocument();
  });

  it('conserva el objeto cuando falla la confirmacion', async () => {
    renderPage(service({ receive: jest.fn().mockRejectedValue(new Error('network')) }));
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    expect(await screen.findByText('No pudimos confirmar la recepción')).toBeInTheDocument();
    expect(screen.getAllByText('Mochila negra con cuadernos').length).toBeGreaterThan(0);
  });
});
