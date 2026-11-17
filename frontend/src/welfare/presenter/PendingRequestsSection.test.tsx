import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WelfareFoundItemView } from '@shared/welfare';
import type { WelfareResult } from '../data/welfareService';
import { item, openRequests, renderPage, service } from './welfareTestSupport';

describe('Solicitudes de hallazgo en Bienestar', () => {
  it('muestra la carga y luego los objetos pendientes', async () => {
    let resolvePending!: (items: WelfareFoundItemView[]) => void;
    renderPage(service({ listPending: jest.fn(() => new Promise<WelfareFoundItemView[]>((resolve) => { resolvePending = resolve; })) }));
    await openRequests();
    expect(screen.getByText('Cargando objetos pendientes...')).toBeInTheDocument();
    await act(async () => resolvePending([item]));
    expect(await screen.findByText('Mochila negra con cuadernos')).toBeInTheDocument();
  });

  it('muestra un estado vacio cuando no hay pendientes', async () => {
    renderPage(service({ listPending: jest.fn().mockResolvedValue([]) }));
    await openRequests();
    expect(await screen.findByRole('heading', { name: 'No hay objetos pendientes' })).toBeInTheDocument();
  });

  it('busca por codigo y muestra los datos del objeto y del Hallador', async () => {
    const welfareService = service();
    renderPage(welfareService);
    await openRequests();
    await userEvent.type(screen.getByLabelText('Código del objeto'), ' hz-0005 ');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(welfareService.findFoundItemByCode).toHaveBeenCalledWith(' hz-0005 ');
    const detail = (await screen.findByRole('heading', { name: 'HZ-0005' })).closest('section')!;
    expect(within(detail).getByText('Ana Rojas')).toBeInTheDocument();
    expect(within(detail).getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(within(detail).getByText('Aula 3')).toBeInTheDocument();
  });

  it.each([
    ['NOT_FOUND', 'No encontramos un objeto con ese código'],
    ['ALREADY_RECEIVED', 'Este objeto ya fue recibido'],
  ] as const)('muestra el resultado %s', async (status, message) => {
    renderPage(service({ findFoundItemByCode: jest.fn().mockResolvedValue({ status }) }));
    await openRequests();
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-9999');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('muestra un error sin perder la pantalla', async () => {
    renderPage(service({ listPending: jest.fn().mockRejectedValue(new Error('network')) }));
    expect(await screen.findByText('No pudimos cargar los objetos pendientes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Panel de Bienestar' })).toBeInTheDocument();
  });

  it('permite corregir los datos antes de confirmar la recepcion', async () => {
    const confirmReception = jest.fn().mockResolvedValue({ status: 'FOUND', item: { ...item, description: 'Mochila con tres cuadernos', status: 'IN_CUSTODY' } });
    renderPage(service({ confirmReception }));
    await openRequests();
    await userEvent.click(await screen.findByRole('button', { name: /HZ-0005/ }));
    await userEvent.clear(screen.getByLabelText('Descripción del objeto'));
    await userEvent.type(screen.getByLabelText('Descripción del objeto'), 'Mochila con tres cuadernos');
    await userEvent.selectOptions(screen.getByLabelText('Categoría del objeto'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Lugar del hallazgo'), '4');
    await userEvent.clear(screen.getByLabelText('Fecha del hallazgo'));
    await userEvent.type(screen.getByLabelText('Fecha del hallazgo'), '2026-10-16T09:30');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar recepción' }));
    expect(confirmReception).toHaveBeenCalledWith('HZ-0005', { description: 'Mochila con tres cuadernos', categoryId: 2, placeId: 4, classroomId: null, placeReference: 'Debajo de una mesa', foundAt: new Date('2026-10-16T09:30').toISOString() });
  }, 10_000);

  it('pide confirmar antes de eliminar y quita la solicitud eliminada', async () => {
    const deletePending = jest.fn().mockResolvedValue(true);
    renderPage(service({ deletePending }));
    await openRequests();
    await userEvent.click(await screen.findByRole('button', { name: /HZ-0005/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar solicitud' }));
    expect(deletePending).not.toHaveBeenCalled();
    expect(screen.getByText('¿Confirmas que el objeto nunca llegó a la oficina?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(deletePending).toHaveBeenCalledWith('HZ-0005');
    expect(await screen.findByText('Solicitud eliminada')).toBeInTheDocument();
    expect(screen.queryByText('HZ-0005')).not.toBeInTheDocument();
  });

  it('muestra que esta confirmando y evita confirmar dos veces mientras guarda', async () => {
    let resolveReceive!: (result: WelfareResult) => void;
    const confirmReception = jest.fn<Promise<WelfareResult>, [string]>(() => new Promise<WelfareResult>((resolve) => { resolveReceive = resolve; }));
    renderPage(service({ confirmReception }));
    await openRequests();
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    const loadingButton = screen.getByRole('button', { name: 'Confirmando recepción…' });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    resolveReceive({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } });
    expect(await screen.findByText('Objeto recibido y puesto en custodia')).toBeInTheDocument();
  });

  it('conserva el objeto cuando falla la confirmacion', async () => {
    renderPage(service({ confirmReception: jest.fn().mockRejectedValue(new Error('network')) }));
    await openRequests();
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    expect(await screen.findByText('No pudimos confirmar la recepción')).toBeInTheDocument();
    expect(screen.getAllByText('Mochila negra con cuadernos').length).toBeGreaterThan(0);
  });
});
