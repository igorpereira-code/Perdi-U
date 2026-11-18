import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { activeLostReport, publishingService, renderPage, service } from './welfareTestSupport';

describe('Reportes de pérdida en Bienestar', () => {
  it('explica cuando el codigo no corresponde a un reporte activo', async () => {
    const getMatches = jest.fn();
    renderPage(service({ findLostReportByCode: jest.fn().mockResolvedValue({ status: 'NOT_FOUND' }) }), { ...publishingService(), getMatches });
    await userEvent.type(screen.getByLabelText('Código del reporte'), 'PR-9999');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar reporte' }));
    expect(await screen.findByText('No encontramos un reporte activo con ese código')).toBeInTheDocument();
    expect(getMatches).not.toHaveBeenCalled();
  });

  it('explica cuando el reporte no tiene objetos parecidos', async () => {
    renderPage(service({ findLostReportByCode: jest.fn().mockResolvedValue({ status: 'FOUND', report: activeLostReport }) }));
    await userEvent.type(screen.getByLabelText('Código del reporte'), 'PR-0001');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar reporte' }));
    expect(await screen.findByText('No hay objetos parecidos')).toBeInTheDocument();
  });

  it('conserva el reporte y explica si no puede cargar sus objetos parecidos', async () => {
    renderPage(
      service({ findLostReportByCode: jest.fn().mockResolvedValue({ status: 'FOUND', report: activeLostReport }) }),
      { ...publishingService(), getMatches: jest.fn().mockRejectedValue(new Error('network error')) },
    );
    await userEvent.type(screen.getByLabelText('Código del reporte'), 'PR-0001');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar reporte' }));
    expect(await screen.findByText('No pudimos cargar los objetos parecidos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detalle del reporte' })).toBeInTheDocument();
    expect(screen.getByText('PR-0001')).toBeInTheDocument();
  });

  it('muestra los objetos parecidos del reporte consultado', async () => {
    const getMatches = jest.fn().mockResolvedValue([{ id: 'match-1', status: 'SUGGESTED', similarity: 0.86, foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul', photoUrl: null, category: 'Electrónicos' } }]);
    renderPage(service({ findLostReportByCode: jest.fn().mockResolvedValue({ status: 'FOUND', report: activeLostReport }) }), { ...publishingService(), getMatches });
    await userEvent.type(screen.getByLabelText('Código del reporte'), 'PR-0001');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar reporte' }));
    expect(getMatches).toHaveBeenCalledWith('PR-0001');
    const matches = (await screen.findByRole('heading', { name: 'Objetos parecidos' })).closest('section');
    expect(within(matches!).getByText('HZ-0001')).toBeInTheDocument();
    expect(within(matches!).getByText('Celular Samsung con funda azul')).toBeInTheDocument();
  });

  it('busca un reporte por codigo y muestra sus datos y propietario', async () => {
    const report = { ...activeLostReport, photoUrl: 'https://example.com/lost-phone.jpg' };
    const findLostReportByCode = jest.fn().mockResolvedValue({ status: 'FOUND', report });
    renderPage(service({ findLostReportByCode }));
    await userEvent.type(screen.getByLabelText('Código del reporte'), ' pr-0001 ');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar reporte' }));
    expect(findLostReportByCode).toHaveBeenCalledWith(' pr-0001 ');
    const detail = (await screen.findByRole('heading', { name: 'Detalle del reporte' })).closest('section');
    expect(within(detail!).getByText('PR-0001')).toBeInTheDocument();
    expect(within(detail!).getByText('Celular Samsung con funda azul')).toBeInTheDocument();
    expect(within(detail!).getByText('Electrónicos')).toBeInTheDocument();
    expect(within(detail!).getByText('Ana Rojas')).toBeInTheDocument();
    expect(within(detail!).getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(within(detail!).getByText('10/10/2026')).toBeInTheDocument();
    expect(within(detail!).getByText('11/10/2026')).toBeInTheDocument();
    expect(within(detail!).getByRole('img', { name: 'Foto del objeto' })).toHaveAttribute('src', report.photoUrl);
  });

  it('muestra los reportes de perdida activos y sus propietarios', async () => {
    renderPage(service({ listActiveLostReports: jest.fn().mockResolvedValue([activeLostReport]) }));
    const section = (await screen.findByRole('heading', { name: 'Reportes de pérdida activos' })).closest('section');
    expect(await within(section!).findByText('PR-0001')).toBeInTheDocument();
    expect(within(section!).getByText('Celular Samsung con funda azul')).toBeInTheDocument();
    expect(within(section!).getByText('Ana Rojas')).toBeInTheDocument();
    expect(within(section!).getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(within(section!).getByText('Con coincidencias')).toBeInTheDocument();
  });
});
