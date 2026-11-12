import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { MyFoundItemScreen } from './MyFoundItemScreen';

const report: MyFoundItem = { code: 'HZ-7325', description: 'Llaves azules', category: 'Llaves',
  foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false, status: 'PENDING_DROP_OFF', receivedAt: null };

function fakeService(): jest.Mocked<FoundItemsService> {
  return { listMine: jest.fn(), getMineByCode: jest.fn().mockResolvedValue(report),
    getCatalogs: jest.fn(), create: jest.fn(), getPhotoUrl: jest.fn() };
}

function renderReport(service: FoundItemsService) {
  return render(
    <MemoryRouter initialEntries={['/mis-reportes/encontrados/HZ-7325']}>
      <Link to="/mis-reportes/encontrados/HZ-7326">Abrir otro reporte</Link>
      <Routes>
        <Route path="/mis-reportes/encontrados/:code" element={<MyFoundItemScreen foundItemsService={service} />} />
        <Route path="/mis-reportes" element={<h1>Mis reportes</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Detalle de un reporte propio del hallador', () => {
  it.each(['PENDING_DROP_OFF', 'DELIVERED'] as const)(
    'mantiene junto al código la instrucción de Bienestar al consultar un reporte en estado %s',
    async (status) => {
      const service = fakeService();
      service.getMineByCode.mockResolvedValue({ ...report, status });
      renderReport(service);

      await screen.findByText(report.code);
      const group = screen.getByRole('group', { name: 'Código para entregar el objeto' });
      expect(within(group).getByText(report.code)).toBeInTheDocument();
      expect(within(group).getByText('Muestra este código en Bienestar Estudiantil cuando entregues el objeto')).toBeInTheDocument();
    },
  );

  it('espera la consulta del backend y muestra el código sin depender de la lista', async () => {
    const service = fakeService();
    let resolve!: (item: MyFoundItem) => void;
    service.getMineByCode.mockReturnValue(new Promise((done) => { resolve = done; }));
    renderReport(service);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando el reporte');
    await act(async () => { resolve(report); });

    expect(screen.getByRole('heading', { name: 'Detalle del reporte' })).toBeInTheDocument();
    expect(screen.getByText(report.code)).toBeInTheDocument();
    expect(service.getMineByCode).toHaveBeenCalledWith(report.code);
    expect(service.listMine).not.toHaveBeenCalled();
  });

  it('informa que el reporte no existe o no es suyo sin mostrar su código privado', async () => {
    const service = fakeService();
    service.getMineByCode.mockResolvedValue(null);
    renderReport(service);

    expect(await screen.findByRole('heading', { name: 'No encontramos este reporte' })).toBeInTheDocument();
    expect(screen.queryByText(report.code)).not.toBeInTheDocument();
  });

  it('permite reintentar un error de carga del detalle', async () => {
    const service = fakeService();
    service.getMineByCode.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(report);
    renderReport(service);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el reporte. Intenta nuevamente.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText(report.code)).toBeInTheDocument();
    expect(service.getMineByCode).toHaveBeenCalledTimes(2);
  });

  it('vuelve a Mis reportes incluso cuando se ingresó por una URL directa', async () => {
    renderReport(fakeService());

    await screen.findByText(report.code);
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(await screen.findByRole('heading', { name: 'Mis reportes' })).toBeInTheDocument();
  });

  it('no reemplaza el reporte actual con una respuesta tardía del código anterior', async () => {
    const service = fakeService();
    let resolveFirst!: (item: MyFoundItem) => void;
    service.getMineByCode.mockReturnValueOnce(new Promise((done) => { resolveFirst = done; }))
      .mockResolvedValue({ ...report, code: 'HZ-7326', description: 'Mochila azul' });
    renderReport(service);
    await waitFor(() => expect(service.getMineByCode).toHaveBeenCalledWith(report.code));

    await userEvent.click(screen.getByRole('link', { name: 'Abrir otro reporte' }));
    expect(await screen.findByText('HZ-7326')).toBeInTheDocument();
    await act(async () => { resolveFirst(report); });

    expect(screen.getByText('HZ-7326')).toBeInTheDocument();
    expect(screen.queryByText(report.code)).not.toBeInTheDocument();
  });
});
