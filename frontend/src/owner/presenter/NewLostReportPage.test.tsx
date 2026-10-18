import { render, screen } from '@testing-library/react';
import { NewLostReportPage } from './NewLostReportPage';

describe('NewLostReportPage', () => {
  it('muestra el encabezado y el formulario para reportar un objeto perdido', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    expect(screen.getByRole('heading', { name: /reportar objeto perdido/i })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /reporte de pérdida/i })).toBeInTheDocument();
  });
});