import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LostReportConfirmation } from './LostReportConfirmation';

function renderConfirmation() {
  render(
    <MemoryRouter>
      <LostReportConfirmation code="PR-0007" />
    </MemoryRouter>,
  );
}

describe('Confirmación del reporte de pérdida', () => {
  it('muestra el código único del reporte', () => {
    renderConfirmation();

    expect(screen.getByRole('heading', { name: 'Reporte enviado' })).toBeInTheDocument();
    expect(screen.getByText('PR-0007')).toBeInTheDocument();
  });
});