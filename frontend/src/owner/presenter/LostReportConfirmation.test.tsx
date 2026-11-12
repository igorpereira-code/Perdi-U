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

describe('Privacidad del reporte de pérdida', () => {
  it('avisa que el reporte solo lo ven el dueño y Bienestar', () => {
    renderConfirmation();

    expect(screen.getByRole('note')).toHaveTextContent(
      'Tu reporte es privado: solo lo ven tú y Bienestar Estudiantil.',
    );
  });
});

describe('El reporte sigue activo', () => {
  it('avisa que el reporte sigue activo aunque el objeto todavía no aparezca', () => {
    renderConfirmation();

    expect(
      screen.getByText('Tu reporte seguirá activo aunque tu objeto todavía no aparezca.'),
    ).toBeInTheDocument();
  });

  it('permite ver los objetos parecidos a su reporte', () => {
    renderConfirmation();

    expect(screen.getByRole('link', { name: 'Ver objetos parecidos' })).toHaveAttribute(
      'href',
      '/mis-reportes/PR-0007/coincidencias',
    );
  });
});