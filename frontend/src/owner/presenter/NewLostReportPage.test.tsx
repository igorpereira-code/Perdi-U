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

  it('permite subir una foto de referencia de manera opcional', () => {
    const { container } = render(<NewLostReportPage onBack={() => {}} />);

    expect(screen.getByText(/foto de referencia/i)).toBeInTheDocument();
    expect(screen.getByText(/\(opcional\)/i)).toBeInTheDocument();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('permite elegir la categoría del objeto', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    const categorySelect = screen.getByLabelText(/categoría/i);
    expect(categorySelect).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: 'Electrónicos' } });
    expect(categorySelect).toHaveValue('Electrónicos');
  });
});