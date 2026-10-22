import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CatalogItem } from '../data/catalogService';
import { CatalogItemScreen } from './CatalogItemScreen';

const backpack: CatalogItem = {
  code: 'HZ-0007',
  description: 'Mochila negra con llavero',
  category: 'Mochilas y bolsos',
  place: 'Bloque A – Aula A-12',
  placeReference: 'Debajo de una silla',
  foundAt: '2026-10-18T12:15:00.000Z',
  hasPhoto: false,
};

function renderScreen(getByCode: jest.Mock, path = '/objetos/HZ-0007') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/objetos/:code"
          element={<CatalogItemScreen catalogService={{ getByCode }} foundItemsService={{ getPhotoUrl: jest.fn() }} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Detalle de un objeto publicado', () => {
  it('muestra la foto, descripción, categoría, lugar, fecha y código', async () => {
    const getByCode = jest.fn().mockResolvedValue(backpack);
    renderScreen(getByCode);

    expect(await screen.findByRole('heading', { name: 'Detalle del objeto' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mochilas y bolsos' })).toBeInTheDocument();
    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.getByText('Mochilas y bolsos')).toBeInTheDocument();
    expect(screen.getByText('Bloque A – Aula A-12')).toBeInTheDocument();
    expect(screen.getByText('Debajo de una silla')).toBeInTheDocument();
    expect(screen.getByText('18/10/2026')).toBeInTheDocument();
    expect(screen.getByText('HZ-0007')).toBeInTheDocument();
    expect(getByCode).toHaveBeenCalledWith('HZ-0007');
  });

  it('avisa si el objeto no existe o ya fue entregado', async () => {
    renderScreen(jest.fn().mockResolvedValue(null), '/objetos/HZ-0008');

    expect(await screen.findByRole('heading', { name: 'No encontramos este objeto' })).toBeInTheDocument();
  });
});