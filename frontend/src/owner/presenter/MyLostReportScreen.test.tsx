import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
        <Route path="/mis-perdidas/:code" element={<MyLostReportScreen myLostReportsService={{ getMine }} />} />
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