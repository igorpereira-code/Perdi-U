import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pendingPickup, renderPage, service } from './welfareTestSupport';

describe('Recojos pendientes en Bienestar', () => {
  it('muestra quien vendra, su reporte y el objeto que recogera', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([pendingPickup]) }));
    await userEvent.click(screen.getByRole('button', { name: /^Recojos pendientes/ }));
    const section = (await screen.findByRole('heading', { name: 'Recojos pendientes' })).closest('section');
    expect(await within(section!).findByText('Ana Rojas')).toBeInTheDocument();
    expect(within(section!).getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(within(section!).getByText('PR-0001')).toBeInTheDocument();
    expect(within(section!).getByText('HZ-0001')).toBeInTheDocument();
    expect(within(section!).getByText('Celular Samsung con funda azul')).toBeInTheDocument();
  });

  it('muestra un estado vacio cuando no hay recojos pendientes', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockResolvedValue([]) }));
    await userEvent.click(screen.getByRole('button', { name: 'Recojos pendientes' }));
    expect(await screen.findByRole('heading', { name: 'No hay recojos pendientes' })).toBeInTheDocument();
  });

  it('muestra un aviso cuando no puede cargar los recojos pendientes', async () => {
    renderPage(service({ listPendingPickups: jest.fn().mockRejectedValue(new Error('network')) }));
    await userEvent.click(screen.getByRole('button', { name: 'Recojos pendientes' }));
    expect(await screen.findByText('No pudimos cargar los recojos pendientes')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No hay recojos pendientes' })).not.toBeInTheDocument();
  });
});
