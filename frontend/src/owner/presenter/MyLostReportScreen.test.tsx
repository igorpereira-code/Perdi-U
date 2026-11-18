import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import type { MyLostReport } from '../data/myLostReportsService';
import { MyLostReportScreen } from './MyLostReportScreen';

const keys: MyLostReport = {
  code: 'PR-0007',
  description: 'Llaves con llavero azul',
  category: 'Llaves',
  status: 'HAS_MATCHES',
  places: ['Bloque A – Aula A-12', 'Biblioteca'],
  placeDescription: 'Fui de la biblioteca al bloque A',
  dateFrom: '2026-10-17',
  dateTo: '2026-10-18',
};

function renderDetail(getMine: jest.Mock, path = '/mis-perdidas/PR-0007') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/mis-perdidas/:code"
          element={
            <MyLostReportScreen
              myLostReportsService={{ getMine, getEditable: jest.fn(), update: jest.fn(), close: jest.fn() }}
              foundItemsService={{ getCatalogs: jest.fn() }}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Detalle de mi reporte de pérdida', () => {
  it('muestra los detalles del reporte y su estado', async () => {
    const getMine = jest.fn().mockResolvedValue(keys);
    renderDetail(getMine);

    expect(await screen.findByRole('heading', { name: 'Detalle de mi reporte' })).toBeInTheDocument();
    expect(screen.getByText('Con coincidencias')).toBeInTheDocument();
    expect(screen.getByText('Llaves con llavero azul')).toBeInTheDocument();
    expect(screen.getByText('Llaves')).toBeInTheDocument();
    expect(screen.getByText('Bloque A – Aula A-12, Biblioteca')).toBeInTheDocument();
    expect(screen.getByText('Fui de la biblioteca al bloque A')).toBeInTheDocument();
    expect(screen.getByText('Del 17/10/2026 al 18/10/2026')).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledWith('PR-0007');
  });

  it('permite ver los objetos parecidos a su reporte', async () => {
    renderDetail(jest.fn().mockResolvedValue(keys));

    expect(await screen.findByRole('link', { name: 'Ver objetos parecidos' })).toHaveAttribute(
      'href',
      '/mis-reportes/PR-0007/coincidencias',
    );
  });

  it('avisa si el reporte no existe o no es suyo', async () => {
    renderDetail(jest.fn().mockResolvedValue(null), '/mis-perdidas/PR-0001');

    expect(await screen.findByRole('heading', { name: 'No encontramos este reporte' })).toBeInTheDocument();
  });
});

describe('Mostrar el código en Bienestar', () => {
  it('muestra el código del reporte para presentarlo en Bienestar', async () => {
    renderDetail(jest.fn().mockResolvedValue(keys));

    expect(await screen.findByText('PR-0007')).toBeInTheDocument();
    expect(
      screen.getByText('Muestra este código en Bienestar Estudiantil para recoger tu objeto.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Bienestar Estudiantil – Bloque C')).toBeInTheDocument();
  });
});

describe('Estado de un reporte cerrado', () => {
  it('muestra que el reporte está cerrado porque ya encontró su objeto', async () => {
    renderDetail(jest.fn().mockResolvedValue({ ...keys, status: 'CLOSED' }));

    expect(await screen.findByText('Cerrado')).toBeInTheDocument();
    expect(screen.getByText('Cerraste este reporte porque ya encontraste tu objeto.')).toBeInTheDocument();
    expect(screen.getByText('PR-0007')).toBeInTheDocument();
  });

  it('ya no pide pasar por Bienestar a recoger el objeto', async () => {
    renderDetail(jest.fn().mockResolvedValue({ ...keys, status: 'CLOSED' }));

    expect(await screen.findByText('Cerrado')).toBeInTheDocument();
    expect(
      screen.queryByText('Muestra este código en Bienestar Estudiantil para recoger tu objeto.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Bienestar Estudiantil – Bloque C')).not.toBeInTheDocument();
  });
});

describe('Carga del detalle de mi reporte', () => {
  it('muestra los datos en gris mientras carga el reporte', () => {
    renderDetail(jest.fn().mockReturnValue(new Promise(() => {})));

    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveTextContent('Cargando tu reporte…');
    expect(loading.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(3);
  });
});

describe('Editar mi reporte de pérdida', () => {
  const catalogs: FoundItemCatalogs = {
    categories: [{ id: 47, name: 'Llaves' }],
    places: [
      { id: 83, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 216, name: 'Aula A-12' }] },
      { id: 98, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
    ],
  };
  const editable = {
    description: 'Llaves con llavero azul',
    categoryId: 47,
    places: [
      { placeId: 83, classroomId: 216 },
      { placeId: 98, classroomId: null },
    ],
    placeDescription: 'Fui de la biblioteca al bloque A',
    dateFrom: '2026-10-17',
    dateTo: '2026-10-18',
  };

  /** Stands in for the matches screen, to see where the app goes. */
  function MatchesDestination() {
    const { code } = useParams();
    return <p>Coincidencias de {code}</p>;
  }

  function renderEditable(getMine: jest.Mock, update = jest.fn().mockResolvedValue(undefined)) {
    const myLostReportsService = {
      getMine,
      getEditable: jest.fn().mockResolvedValue(editable),
      update,
      close: jest.fn(),
    };
    render(
      <MemoryRouter initialEntries={['/mis-perdidas/PR-0007']}>
        <Routes>
          <Route
            path="/mis-perdidas/:code"
            element={
              <MyLostReportScreen
                myLostReportsService={myLostReportsService}
                foundItemsService={{ getCatalogs: jest.fn().mockResolvedValue(catalogs) }}
              />
            }
          />
          <Route path="/mis-reportes/:code/coincidencias" element={<MatchesDestination />} />
        </Routes>
      </MemoryRouter>,
    );
    return myLostReportsService;
  }

  it('permite editar un reporte activo y guardar sus cambios', async () => {
    const service = renderEditable(jest.fn().mockResolvedValue(keys));

    await userEvent.click(await screen.findByRole('button', { name: 'Editar reporte' }));
    expect(await screen.findByRole('heading', { name: 'Editar reporte' })).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción de tu objeto')).toHaveValue('Llaves con llavero azul');
    await userEvent.clear(screen.getByLabelText('Descripción de tu objeto'));
    await userEvent.type(screen.getByLabelText('Descripción de tu objeto'), 'Llaves con llavero rojo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(service.update).toHaveBeenCalledWith('PR-0007', {
      ...editable,
      description: 'Llaves con llavero rojo',
    });
  });

  it('al guardar los cambios lo lleva a ver sus coincidencias actualizadas', async () => {
    renderEditable(jest.fn().mockResolvedValue(keys));

    await userEvent.click(await screen.findByRole('button', { name: 'Editar reporte' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Coincidencias de PR-0007')).toBeInTheDocument();
  });

  it('puede volver al detalle sin guardar los cambios', async () => {
    const service = renderEditable(jest.fn().mockResolvedValue(keys));

    await userEvent.click(await screen.findByRole('button', { name: 'Editar reporte' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Volver al detalle' }));

    expect(await screen.findByRole('heading', { name: 'Detalle de mi reporte' })).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();
  });
});

describe('Cerrar mi reporte con "Ya lo encontré"', () => {
  function renderClosable(getMine: jest.Mock, close: jest.Mock) {
    render(
      <MemoryRouter initialEntries={['/mis-perdidas/PR-0007']}>
        <Routes>
          <Route
            path="/mis-perdidas/:code"
            element={
              <MyLostReportScreen
                myLostReportsService={{ getMine, getEditable: jest.fn(), update: jest.fn(), close }}
                foundItemsService={{ getCatalogs: jest.fn() }}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('cierra el reporte y lo vuelve a mostrar con su nuevo estado', async () => {
    const getMine = jest
      .fn()
      .mockResolvedValueOnce(keys)
      .mockResolvedValueOnce({ ...keys, status: 'CLOSED' });
    const close = jest.fn().mockResolvedValue(undefined);
    renderClosable(getMine, close);

    await userEvent.click(await screen.findByRole('button', { name: 'Ya lo encontré' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }));

    expect(close).toHaveBeenCalledWith('PR-0007');
    expect(await screen.findByText('Cerrado')).toBeInTheDocument();
  });

  it('avisa si no se pudo cerrar el reporte', async () => {
    const close = jest.fn().mockRejectedValue(new Error('No se pudo cerrar el reporte. Intenta nuevamente.'));
    renderClosable(jest.fn().mockResolvedValue(keys), close);

    await userEvent.click(await screen.findByRole('button', { name: 'Ya lo encontré' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar el reporte. Intenta nuevamente.');
  });
});

describe('Confirmación antes de cerrar mi reporte', () => {
  function renderClosable(close: jest.Mock) {
    render(
      <MemoryRouter initialEntries={['/mis-perdidas/PR-0007']}>
        <Routes>
          <Route
            path="/mis-perdidas/:code"
            element={
              <MyLostReportScreen
                myLostReportsService={{
                  getMine: jest.fn().mockResolvedValue(keys),
                  getEditable: jest.fn(),
                  update: jest.fn(),
                  close,
                }}
                foundItemsService={{ getCatalogs: jest.fn() }}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('pide confirmar antes de cerrar el reporte', async () => {
    const close = jest.fn();
    renderClosable(close);

    await userEvent.click(await screen.findByRole('button', { name: 'Ya lo encontré' }));

    expect(screen.getByRole('heading', { name: '¿Ya encontraste tu objeto?' })).toBeInTheDocument();
    expect(
      screen.getByText('Si cierras el reporte, ya no recibirás coincidencias ni podrás editarlo.'),
    ).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });

  it('puede conservar el reporte sin cerrarlo', async () => {
    const close = jest.fn();
    renderClosable(close);

    await userEvent.click(await screen.findByRole('button', { name: 'Ya lo encontré' }));
    await userEvent.click(screen.getByRole('button', { name: 'Conservar reporte' }));

    expect(screen.queryByRole('heading', { name: '¿Ya encontraste tu objeto?' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ya lo encontré' })).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});
