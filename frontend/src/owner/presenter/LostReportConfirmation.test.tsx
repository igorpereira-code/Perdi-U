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
});