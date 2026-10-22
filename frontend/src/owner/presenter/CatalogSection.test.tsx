import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { CatalogItem } from '../data/catalogService';
import { CatalogSection } from './CatalogSection';

const base = { place: 'Biblioteca', placeReference: null, foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false };
const backpack: CatalogItem = { ...base, code: 'HZ-0007', description: 'Mochila negra con llavero', category: 'Mochilas y bolsos' };
const thermos: CatalogItem = { ...base, code: 'HZ-0008', description: 'Termo metálico azul', category: 'Botellas y termos' };

function renderSection(list: jest.Mock) {
  render(
    <MemoryRouter>
      <CatalogSection catalogService={{ list }} foundItemsService={{ getPhotoUrl: jest.fn() }} />
    </MemoryRouter>,
  );
}

describe('Últimos objetos publicados en el inicio', () => {
  it('muestra los objetos publicados con su descripción, categoría, lugar y código', async () => {
    renderSection(jest.fn().mockResolvedValue([backpack, thermos]));

    expect(await screen.findByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.getByText('Termo metálico azul')).toBeInTheDocument();
    expect(screen.getByText('Mochilas y bolsos · Biblioteca')).toBeInTheDocument();
    expect(screen.getByText(/HZ-0007/)).toBeInTheDocument();
  });

  it('avisa cuando todavía no hay objetos publicados', async () => {
    renderSection(jest.fn().mockResolvedValue([]));

    expect(await screen.findByRole('heading', { name: 'Todavía no hay objetos publicados' })).toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar y permite reintentar', async () => {
    const list = jest.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue([backpack]);
    renderSection(list);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los objetos encontrados. Intenta nuevamente.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Mochila negra con llavero')).toBeInTheDocument();
  });
});

describe('Buscar en los objetos publicados', () => {
  it('muestra solo los objetos que coinciden con lo escrito', async () => {
    renderSection(jest.fn().mockResolvedValue([backpack, thermos]));

    await userEvent.type(await screen.findByLabelText('Buscar objetos'), 'mochila negra');

    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.queryByText('Termo metálico azul')).not.toBeInTheDocument();
  });

  it('avisa cuando ningún objeto coincide con la búsqueda', async () => {
    renderSection(jest.fn().mockResolvedValue([backpack, thermos]));

    await userEvent.type(await screen.findByLabelText('Buscar objetos'), 'paraguas');

    expect(screen.getByRole('heading', { name: 'No encontramos objetos con esa búsqueda' })).toBeInTheDocument();
  });
});

describe('Filtrar los objetos publicados por categoría', () => {
  it('muestra solo los objetos de la categoría elegida', async () => {
    renderSection(jest.fn().mockResolvedValue([backpack, thermos]));

    await userEvent.selectOptions(await screen.findByLabelText('Categoría'), 'Botellas y termos');

    expect(screen.getByText('Termo metálico azul')).toBeInTheDocument();
    expect(screen.queryByText('Mochila negra con llavero')).not.toBeInTheDocument();
  });
});

describe('Abrir un objeto publicado', () => {
  it('cada objeto lleva a su detalle', async () => {
    renderSection(jest.fn().mockResolvedValue([backpack]));

    expect(await screen.findByRole('link', { name: 'Ver objeto HZ-0007' })).toHaveAttribute('href', '/objetos/HZ-0007');
  });
});