import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pendingPickup, publishedItem, renderPage, service } from './welfareTestSupport';

describe('Registro de entregas en Bienestar', () => {
  it('mantiene el formulario y explica si el reporte no corresponde', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]), deliver: jest.fn().mockResolvedValue({ status: 'REPORT_NOT_ELIGIBLE' }) }));
    await userEvent.click(screen.getByRole('button', { name: /^Recojos pendientes/ }));
    const card = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(within(card!).getByRole('button', { name: 'Registrar entrega' }));
    await userEvent.type(screen.getByLabelText('Código universitario'), '20205678');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    expect(await screen.findByText('El reporte no corresponde a este objeto o propietario')).toBeInTheDocument();
    expect(screen.getByLabelText('Código universitario')).toHaveValue('20205678');
    expect(screen.getByText('PR-0001')).toBeInTheDocument();
  });

  it('confirma la entrega y retira el recojo y el objeto de la oficina', async () => {
    const pickupItem = { ...publishedItem, code: pendingPickup.foundItem.code, description: pendingPickup.foundItem.description };
    const deliver = jest.fn().mockResolvedValue({ status: 'DELIVERED', foundItemCode: pickupItem.code });
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]), listInOffice: jest.fn().mockResolvedValue([pickupItem]), deliver }));
    await userEvent.click(screen.getByRole('button', { name: /^Recojos pendientes/ }));
    const card = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(within(card!).getByRole('button', { name: 'Registrar entrega' }));
    await userEvent.type(screen.getByLabelText('Código universitario'), '20205678');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    expect(deliver).toHaveBeenCalledWith({ foundItemCode: 'HZ-0001', lostReportCode: 'PR-0001', recipientName: 'Ana Rojas', recipientEmail: 'ana.rojas@ucb.edu.bo', recipientUniversityCode: '20205678' });
    expect(await screen.findByText('Entrega registrada correctamente')).toBeInTheDocument();
    expect(screen.queryByLabelText('Código universitario')).not.toBeInTheDocument();
    expect(screen.queryByText('HZ-0001')).not.toBeInTheDocument();
  });

  it('permite elegir un objeto de la oficina y llenar una entrega sin reporte', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const card = (await screen.findByText('HZ-0003')).closest('article');
    await userEvent.click(within(card!).getByRole('button', { name: 'Registrar entrega' }));
    expect(screen.getByLabelText('Código del objeto a entregar')).toHaveValue('HZ-0003');
    expect(screen.getByLabelText('Código del reporte (opcional)')).toHaveValue('');
    expect(screen.getByLabelText('Nombre de quien recibe')).toHaveValue('');
    expect(screen.getByLabelText('Correo institucional')).toHaveValue('');
  });

  it('inicia una entrega desde un recojo y precarga objeto reporte y propietario', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]) }));
    await userEvent.click(screen.getByRole('button', { name: /^Recojos pendientes/ }));
    const card = (await screen.findByText('PR-0001')).closest('article');
    await userEvent.click(within(card!).getByRole('button', { name: 'Registrar entrega' }));
    expect(screen.getByLabelText('Código del objeto a entregar')).toHaveValue('HZ-0001');
    expect(screen.getByLabelText('Código del reporte (opcional)')).toHaveValue('PR-0001');
    expect(screen.getByLabelText('Nombre de quien recibe')).toHaveValue('Ana Rojas');
    expect(screen.getByLabelText('Correo institucional')).toHaveValue('ana.rojas@ucb.edu.bo');
    expect(screen.getByLabelText('Código universitario')).toHaveValue('');
  });
});
