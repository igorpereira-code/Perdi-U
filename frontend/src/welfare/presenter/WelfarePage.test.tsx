import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WelfareFoundItemView } from '@shared/welfare';
import {
  inCustodyItem,
  item,
  openRequests,
  pendingPickup,
  publishedItem,
  renderPage,
  service,
} from './welfareTestSupport';

describe('Coordinación del panel de Bienestar', () => {
  it('conserva una entrega en curso al cambiar de seccion', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]) }));
    await userEvent.click(screen.getByRole('button', { name: /^Recojos pendientes/ }));
    const pickupCard = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(within(pickupCard!).getByRole('button', { name: 'Registrar entrega' }));
    await userEvent.type(screen.getByLabelText('Código universitario'), '20205678');

    await openRequests();
    const navigation = screen.getByRole('navigation', { name: 'Secciones de Bienestar' });
    await userEvent.click(within(navigation).getByRole('button', { name: 'Registrar entrega' }));

    expect(screen.getByLabelText('Código del objeto a entregar')).toHaveValue('HZ-0001');
    expect(screen.getByLabelText('Código del reporte (opcional)')).toHaveValue('PR-0001');
    expect(screen.getByLabelText('Código universitario')).toHaveValue('20205678');
  });

  it('mueve el objeto recibido desde solicitudes hasta custodia', async () => {
    let resolveInOffice!: (items: WelfareFoundItemView[]) => void;
    const listInOffice = jest.fn(() => new Promise<WelfareFoundItemView[]>((resolve) => { resolveInOffice = resolve; }));
    const welfareService = service({
      listInOffice,
      confirmReception: jest.fn().mockResolvedValue({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } }),
    });
    renderPage(welfareService);
    await openRequests();
    const requestsSection = screen
      .getByRole('heading', { name: 'Objetos pendientes de recepción' })
      .closest('section')!;
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));

    expect(welfareService.confirmReception).toHaveBeenCalledWith('HZ-0005', expect.objectContaining({
      description: item.description,
      categoryId: 1,
      placeId: 1,
      foundAt: item.foundAt,
    }));
    expect(await screen.findByText('Objeto recibido y puesto en custodia')).toBeInTheDocument();
    expect(within(requestsSection).queryByText('HZ-0005')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const officeSection = screen.getByRole('heading', { name: 'Objetos en custodia' }).closest('section')!;
    expect(await within(officeSection).findByText('HZ-0005')).toBeInTheDocument();

    await act(async () => resolveInOffice([inCustodyItem, publishedItem]));
    expect(within(officeSection).getByText('HZ-0005')).toBeInTheDocument();
  });

  it('conserva el objeto recibido si falla la carga inicial de la oficina', async () => {
    let rejectInOffice!: (error: Error) => void;
    const listInOffice = jest.fn(() => new Promise<WelfareFoundItemView[]>((_, reject) => { rejectInOffice = reject; }));
    renderPage(service({
      listInOffice,
      confirmReception: jest.fn().mockResolvedValue({ status: 'FOUND', item: { ...item, status: 'IN_CUSTODY' } }),
    }));
    await openRequests();
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-0005');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const officeSection = screen.getByRole('heading', { name: 'Objetos en custodia' }).closest('section')!;
    expect(await within(officeSection).findByText('HZ-0005')).toBeInTheDocument();

    await act(async () => rejectInOffice(new Error('network')));
    expect(within(officeSection).getByText('HZ-0005')).toBeInTheDocument();
  });
});
