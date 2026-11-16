import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CatalogItem } from '../data/catalogService';
import type { MyLostReport } from '../data/myLostReportsService';
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

const phoneReport: MyLostReport = {
  code: 'PR-0001',
  description: 'Celular Samsung con funda azul',
  category: 'Electrónicos',
  status: 'SEARCHING',
  places: ['Bloque A'],
  placeDescription: null,
  dateFrom: '2026-10-10',
  dateTo: '2026-10-11',
};

const keysReport: MyLostReport = {
  ...phoneReport,
  code: 'PR-0002',
  description: 'Llaves con llavero azul',
  category: 'Llaves',
  status: 'HAS_MATCHES',
};

type Services = { listMine?: jest.Mock; claim?: jest.Mock };

function renderScreen(getByCode: jest.Mock, path = '/objetos/HZ-0007', services: Services = {}) {
  const { listMine = jest.fn().mockResolvedValue([]), claim = jest.fn().mockResolvedValue(undefined) } = services;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/objetos/:code"
          element={
            <CatalogItemScreen
              catalogService={{ getByCode }}
              foundItemsService={{ getPhotoUrl: jest.fn() }}
              myLostReportsService={{ listMine }}
              matchesService={{ claim }}
            />
          }
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

describe('Dónde preguntar por el objeto', () => {
  it('muestra dónde está Bienestar y su horario para ir a preguntar', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack));

    expect(await screen.findByRole('heading', { name: '¿Es tuyo?' })).toBeInTheDocument();
    expect(
      screen.getByText('Acércate a Bienestar Estudiantil con el código HZ-0007 para preguntar por él.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Bienestar Estudiantil – Bloque C')).toBeInTheDocument();
    expect(screen.getByText('Lunes a viernes, de 08:30 a 16:00')).toBeInTheDocument();
  });
});

describe('Reclamar el objeto: la opción "Es mío, pasaré a recoger"', () => {
  it('ofrece "Es mío, pasaré a recoger" a quien tiene un reporte de pérdida activo', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
    });

    expect(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' })).toBeInTheDocument();
  });

  it('sin reportes de pérdida activos, invita a reportar la pérdida en vez de ofrecer la opción', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack));

    const link = await screen.findByRole('link', { name: 'Reportar mi pérdida' });
    expect(link).toHaveAttribute('href', '/reportar-perdida');
    expect(screen.queryByRole('button', { name: 'Es mío, pasaré a recoger' })).not.toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar sus reportes y permite reintentar', async () => {
    const listMine = jest.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue([phoneReport]);
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', { listMine });

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus reportes. Intenta nuevamente.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' })).toBeInTheDocument();
  });
});

describe('Reclamar el objeto: elegir con qué reporte relacionarlo', () => {
  it('con varios reportes activos, deja elegir con cuál relacionar el objeto', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport, keysReport]),
    });

    const select = await screen.findByRole('combobox', { name: '¿Con cuál de tus reportes lo relacionas?' });
    expect(select).toHaveValue('PR-0001');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'PR-0001 – Celular Samsung con funda azul',
      'PR-0002 – Llaves con llavero azul',
    ]);

    await userEvent.selectOptions(select, 'PR-0002');

    expect(select).toHaveValue('PR-0002');
  });

  it('con un solo reporte activo no pide elegir: lo relaciona con ese reporte', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
    });

    expect(await screen.findByText('Lo relacionaremos con tu reporte PR-0001.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('no ofrece los reportes que ya fueron recuperados', async () => {
    const recovered: MyLostReport = { ...keysReport, status: 'RECOVERED' };
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport, recovered]),
    });

    expect(await screen.findByText('Lo relacionaremos con tu reporte PR-0001.')).toBeInTheDocument();
    expect(screen.queryByText(/PR-0002/)).not.toBeInTheDocument();
  });

  it('si todos sus reportes ya fueron recuperados, lo invita a reportar su pérdida', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([{ ...phoneReport, status: 'RECOVERED' }]),
    });

    expect(await screen.findByRole('link', { name: 'Reportar mi pérdida' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Es mío, pasaré a recoger' })).not.toBeInTheDocument();
  });
});

describe('Reclamar el objeto: avisar a Bienestar', () => {
  it('al confirmar, avisa que pasará a recoger ese objeto con el reporte elegido', async () => {
    const claim = jest.fn().mockResolvedValue(undefined);
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport, keysReport]),
      claim,
    });

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: '¿Con cuál de tus reportes lo relacionas?' }),
      'PR-0002',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(claim).toHaveBeenCalledWith('HZ-0007', 'PR-0002');
    expect(await screen.findByText('Pasarás a recoger este objeto')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Es mío, pasaré a recoger' })).not.toBeInTheDocument();
  });

  it('con un solo reporte activo lo usa sin pedir que lo elija', async () => {
    const claim = jest.fn().mockResolvedValue(undefined);
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
      claim,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(claim).toHaveBeenCalledWith('HZ-0007', 'PR-0001');
  });

  it('mientras guarda, muestra que está guardando y no deja tocar dos veces', async () => {
    const claim = jest.fn().mockReturnValue(new Promise(() => {}));
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
      claim,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled();
    expect(claim).toHaveBeenCalledTimes(1);
  });

  it('si no se pudo avisar a Bienestar, lo dice y permite intentarlo de nuevo', async () => {
    const claim = jest.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(undefined);
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
      claim,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo avisar a Bienestar. Intenta nuevamente.');

    await userEvent.click(screen.getByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(await screen.findByText('Pasarás a recoger este objeto')).toBeInTheDocument();
    expect(claim).toHaveBeenCalledTimes(2);
  });
});

describe('Después de reclamar: dónde y cuándo ir a Bienestar', () => {
  it('después de confirmar, muestra la ubicación y el horario de Bienestar en lugar de preguntar', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport]),
    });
    expect(
      await screen.findByText('Acércate a Bienestar Estudiantil con el código HZ-0007 para preguntar por él.'),
    ).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(await screen.findByText('Pasarás a recoger este objeto')).toBeInTheDocument();
    expect(
      screen.queryByText('Acércate a Bienestar Estudiantil con el código HZ-0007 para preguntar por él.'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Bienestar Estudiantil – Bloque C')).toHaveLength(1);
    expect(screen.getAllByText('Lunes a viernes, de 08:30 a 16:00')).toHaveLength(1);
  });
});

describe('Después de reclamar: el código que debe mostrar en Bienestar', () => {
  it('muestra el código del reporte con el que reclamó el objeto', async () => {
    renderScreen(jest.fn().mockResolvedValue(backpack), '/objetos/HZ-0007', {
      listMine: jest.fn().mockResolvedValue([phoneReport, keysReport]),
    });

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: '¿Con cuál de tus reportes lo relacionas?' }),
      'PR-0002',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Es mío, pasaré a recoger' }));

    expect(await screen.findByText('Lleva el código de tu reporte PR-0002 para recogerlo.')).toBeInTheDocument();
  });
});