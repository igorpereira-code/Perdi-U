import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { MyFoundItemsScreen } from './MyFoundItemsScreen';

function renderScreen(service: FoundItemsService) {
  return render(<MemoryRouter><MyFoundItemsScreen foundItemsService={service} /></MemoryRouter>);
}

function fakeService(): jest.Mocked<FoundItemsService> {
  return { listMine: jest.fn().mockResolvedValue([]), getMineByCode: jest.fn().mockResolvedValue(null), getCatalogs: jest.fn(),
    create: jest.fn(), getPhotoUrl: jest.fn() };
}

const keys = { code: 'HZ-7325', description: 'Llaves pendientes de entrega', category: 'Llaves',
  foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false, status: 'PENDING_DROP_OFF' as const, receivedAt: null };
const backpack = { code: 'HZ-7324', description: 'Mochila recibida', category: 'Mochilas y bolsos',
  foundAt: '2026-10-17T12:15:00.000Z', hasPhoto: false,
  status: 'PUBLISHED' as const, receivedAt: '2026-10-19T14:30:00.000Z' };

describe('Mis reportes del hallador', () => {
  it('explica junto a cada código que debe mostrarlo al entregar el objeto en Bienestar', async () => {
    const service = fakeService();
    service.listMine.mockResolvedValue([keys, backpack]);
    renderScreen(service);

    const list = await screen.findByRole('list', { name: 'Objetos reportados' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      const group = within(row).getByRole('group', { name: 'Código para entregar el objeto' });
      expect(within(group).getByText(/^HZ-\d+$/)).toBeInTheDocument();
      expect(within(group).getByText('Muestra este código en Bienestar Estudiantil cuando entregues el objeto')).toBeInTheDocument();
    }
  });

  it('muestra carga mientras espera y luego todos los objetos reportados', async () => {
    const service = fakeService();
    let resolve!: (reports: MyFoundItem[]) => void;
    service.listMine.mockReturnValue(new Promise((done) => { resolve = done; }));
    renderScreen(service);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tus reportes');
    await act(async () => { resolve([keys, backpack]); });

    expect(screen.getByText('Llaves pendientes de entrega')).toBeInTheDocument();
    expect(screen.getByText('Mochila recibida')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explica la lista vacía sin confundirla con una carga', async () => {
    renderScreen(fakeService());

    expect(await screen.findByRole('heading', { name: 'Todavía no reportaste objetos' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra un error y permite reintentar sin mostrar una lista vacía', async () => {
    const service = fakeService();
    service.listMine.mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValue([{ ...keys, description: 'Llaves azules' }]);
    renderScreen(service);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus reportes.');
    expect(screen.queryByText('Todavía no reportaste objetos')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Llaves azules')).toBeInTheDocument();
    expect(service.listMine).toHaveBeenCalledTimes(2);
  });

  it('muestra en cada reporte su código, categoría y fecha del hallazgo', async () => {
    const service = fakeService();
    service.listMine.mockResolvedValue([keys, backpack]);
    renderScreen(service);

    expect(await screen.findByText('HZ-7325')).toBeInTheDocument();
    expect(screen.getByText('HZ-7324')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Llaves' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mochilas y bolsos' })).toBeInTheDocument();
    expect(screen.getByText('18/10/2026')).toHaveAttribute('datetime', keys.foundAt);
    expect(screen.getByText('17/10/2026')).toHaveAttribute('datetime', backpack.foundAt);
    expect(service.getPhotoUrl).not.toHaveBeenCalled();
  });

  it('consulta la foto autorizada por código y la muestra junto a los datos del reporte', async () => {
    const service = fakeService();
    service.listMine.mockResolvedValue([{ ...keys, hasPhoto: true }]);
    service.getPhotoUrl.mockResolvedValue({ url: 'https://storage.example/foto-firmada', expiresIn: 60 });
    renderScreen(service);

    expect(await screen.findByRole('img', { name: 'Foto del objeto' }))
      .toHaveAttribute('src', 'https://storage.example/foto-firmada');
    expect(service.getPhotoUrl).toHaveBeenCalledWith(keys.code);
    expect(screen.getByText(keys.code)).toBeInTheDocument();
  });

  it('distingue el objeto pendiente del recibido y muestra la fecha de recepción real', async () => {
    const service = fakeService();
    service.listMine.mockResolvedValue([keys, backpack]);
    renderScreen(service);

    expect(await screen.findByText('Bienestar Estudiantil aún no recibió el objeto.')).toBeInTheDocument();
    expect(screen.getByText('Recibido por Bienestar Estudiantil')).toBeInTheDocument();
    expect(screen.getByText('19/10/2026')).toHaveAttribute('datetime', backpack.receivedAt);
  });
});
