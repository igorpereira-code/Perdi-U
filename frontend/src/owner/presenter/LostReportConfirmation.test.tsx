import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LostReportConfirmation } from './LostReportConfirmation';

describe('LostReportConfirmation', () => {
  it('muestra el código único asignado al reporte de pérdida', () => {
    render(
      <MemoryRouter>
        <LostReportConfirmation reportCode="PR-0001" onGoHome={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/reporte registrado con éxito/i)).toBeInTheDocument();
    expect(screen.getByText('PR-0001')).toBeInTheDocument();
  });

  it('indica claramente que el reporte es privado y solo lo ven el dueño y Bienestar Estudiantil', () => {
    render(
      <MemoryRouter>
        <LostReportConfirmation reportCode="PR-0001" onGoHome={() => {}} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/solo lo ven tú y bienestar estudiantil|solo lo ven él y bienestar estudiantil/i),
    ).toBeInTheDocument();
  });
});