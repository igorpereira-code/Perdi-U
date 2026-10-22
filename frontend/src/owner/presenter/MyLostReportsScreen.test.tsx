import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MyLostReport } from '../data/myLostReportsService';
import { MyLostReportsScreen } from './MyLostReportsScreen';

const base = { places: [], placeDescription: null, dateFrom: '2026-10-17', dateTo: '2026-10-18' };
const keys: MyLostReport = { ...base, code: 'PR-0007', description: 'Llaves con llavero azul', category: 'Llaves', status: 'HAS_MATCHES' };
const phone: MyLostReport = { ...base, code: 'PR-0008', description: 'Celular con funda negra', category: 'Electrónicos', status: 'SEARCHING' };

function renderList(listMine: jest.Mock) {
  render(
    <MemoryRouter>
      <MyLostReportsScreen myLostReportsService={{ listMine }} />
    </MemoryRouter>,
  );
}

describe('Ver todos mis reportes de pérdida', () => {
  it('muestra todos mis reportes de pérdida', async () => {
    renderList(jest.fn().mockResolvedValue([keys, phone]));

    expect(await screen.findByRole('heading', { name: 'Mis reportes de pérdida' })).toBeInTheDocument();
    expect(await screen.findByText('Llaves con llavero azul')).toBeInTheDocument();
    expect(screen.getByText('Celular con funda negra')).toBeInTheDocument();
  });

  it('avisa cuando todavía no reportó objetos perdidos', async () => {
    renderList(jest.fn().mockResolvedValue([]));

    expect(await screen.findByRole('heading', { name: 'Todavía no reportaste objetos perdidos' })).toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar y permite reintentar', async () => {
    const listMine = jest.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue([keys]);
    renderList(listMine);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus reportes. Intenta nuevamente.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Llaves con llavero azul')).toBeInTheDocument();
  });
});