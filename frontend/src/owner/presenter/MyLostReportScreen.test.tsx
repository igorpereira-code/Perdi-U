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
              myLostReportsService={{ getMine, getEditable: jest.fn(), update: jest.fn() }}
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
