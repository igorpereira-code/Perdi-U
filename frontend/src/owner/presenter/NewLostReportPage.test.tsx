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
    const optionalLabels = screen.getAllByText(/\(opcional\)/i);
    expect(optionalLabels.length).toBeGreaterThanOrEqual(1);
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

  it('permite elegir uno o varios lugares con bloque y aula si corresponde', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    // Verifica que exista el selector de bloque o espacio
    const placeSelect = screen.getByLabelText(/bloque o espacio/i);
    expect(placeSelect).toBeInTheDocument();

    // Antes de seleccionar un bloque con aulas, no se muestra selector de aula
    expect(screen.queryByLabelText(/^aula/i)).not.toBeInTheDocument();

    // Selecciona Bloque A (id 1, tipo BLOCK)
    fireEvent.change(placeSelect, { target: { value: '1' } });

    // Ahora debe mostrarse el selector de aula
    const classroomSelect = screen.getByLabelText(/^aula/i);
    expect(classroomSelect).toBeInTheDocument();

    fireEvent.change(classroomSelect, { target: { value: '101' } });
    expect(classroomSelect).toHaveValue('101');

    // Puede agregar otro lugar
    const addPlaceBtn = screen.getByRole('button', { name: /\+ agregar otro lugar/i });
    fireEvent.click(addPlaceBtn);

    const placeSelects = screen.getAllByLabelText(/bloque o espacio/i);
    expect(placeSelects).toHaveLength(2);
  });

  it('permite describir en texto una referencia de por dónde pudo perderlo', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    const placeDescriptionInput = screen.getByLabelText(/referencia del lugar/i);
    expect(placeDescriptionInput).toBeInTheDocument();

    fireEvent.change(placeDescriptionInput, {
      target: { value: 'En las gradas hacia el segundo piso o cerca de las jardineras' },
    });
    expect(placeDescriptionInput).toHaveValue(
      'En las gradas hacia el segundo piso o cerca de las jardineras',
    );
  });

it('permite indicar el rango de fechas en que pudo perderlo', () => {
    render(<NewLostReportPage onBack={() => {}} />);

    const dateFromInput = screen.getByLabelText(/fecha desde|desde/i);
    const dateToInput = screen.getByLabelText(/fecha hasta|hasta/i);

    expect(dateFromInput).toBeInTheDocument();
    expect(dateToInput).toBeInTheDocument();

    fireEvent.change(dateFromInput, { target: { value: '2026-10-15' } });
    fireEvent.change(dateToInput, { target: { value: '2026-10-18' } });

    expect(dateFromInput).toHaveValue('2026-10-15');
    expect(dateToInput).toHaveValue('2026-10-18');
  });



});