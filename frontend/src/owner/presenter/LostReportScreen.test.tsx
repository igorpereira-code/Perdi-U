import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { LostReportScreen } from './LostReportScreen';

const catalogs: FoundItemCatalogs = { categories: [{ id: 47, name: 'Llaves' }], places: [] };

function renderScreen(getCatalogs: jest.Mock) {
  render(
    <MemoryRouter>
      <LostReportScreen foundItemsService={{ getCatalogs }} />
    </MemoryRouter>,
  );
}

describe('Abrir el formulario de pérdida', () => {
  it('abre el formulario para reportar la pérdida', async () => {
    renderScreen(jest.fn().mockResolvedValue(catalogs));

    expect(await screen.findByRole('form', { name: 'Reportar objeto perdido' })).toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar las categorías y los lugares, y permite reintentar', async () => {
    const getCatalogs = jest.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(catalogs);
    renderScreen(getCatalogs);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las categorías y los lugares. Intenta nuevamente.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('form', { name: 'Reportar objeto perdido' })).toBeInTheDocument();
    expect(getCatalogs).toHaveBeenCalledTimes(2);
  });
});