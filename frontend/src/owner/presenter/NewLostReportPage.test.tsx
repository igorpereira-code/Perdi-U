import { render, screen, fireEvent } from '@testing-library/react';
import { NewLostReportPage } from './NewLostReportPage';

describe('NewLostReportPage', () => {
  it('muestra el encabezado y el formulario para reportar un objeto perdido', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    expect(screen.getByRole('heading', { name: /reportar objeto perdido/i })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /reporte de pérdida/i })).toBeInTheDocument();
  });

  it('permite escribir una descripción del objeto perdido', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    const descriptionInput = screen.getByLabelText(/descripción/i);
    expect(descriptionInput).toBeInTheDocument();

    fireEvent.change(descriptionInput, { target: { value: 'Mochila negra con un llavero de gato' } });
    expect(descriptionInput).toHaveValue('Mochila negra con un llavero de gato');
  });
});