import { render, screen, fireEvent } from '@testing-library/react';
import { LostReportDetailPage } from './LostReportDetailPage';

describe('LostReportDetailPage', () => {
  const sampleReport = {
    id: '1',
    code: 'PR-0001',
    description: 'Mochila negra con llavero',
    category: 'Mochilas y bolsos',
    place: 'Biblioteca',
    date: '2026-10-17',
    status: 'SEARCHING',
  };

  it('muestra todos los detalles del reporte de pérdida', () => {
    render(<LostReportDetailPage report={sampleReport} onBack={() => {}} />);

    expect(screen.getByText('PR-0001')).toBeInTheDocument();
    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.getByText('Mochilas y bolsos')).toBeInTheDocument();
    expect(screen.getByText('Biblioteca')).toBeInTheDocument();
    expect(screen.getByText('2026-10-17')).toBeInTheDocument();
    expect(screen.getByText('Buscando')).toBeInTheDocument();
  });

  it('permite regresar a la vista anterior', () => {
    const onBack = jest.fn();
    render(<LostReportDetailPage report={sampleReport} onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: /volver|atrás/i });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});