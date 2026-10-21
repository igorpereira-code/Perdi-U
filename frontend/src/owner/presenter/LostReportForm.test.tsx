import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { LostReportForm } from './LostReportForm';

const catalogs: FoundItemCatalogs = {
  categories: [
    { id: 47, name: 'Llaves' },
    { id: 48, name: 'Electrónicos' },
  ],
  places: [
    { id: 83, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 216, name: 'Aula A-12' }] },
    { id: 98, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
  ],
};

function renderForm(onCreate = jest.fn()) {
  render(
    <MemoryRouter>
      <LostReportForm catalogs={catalogs} onCreate={onCreate} />
    </MemoryRouter>,
  );
  return onCreate;
}

describe('Descripción del objeto perdido', () => {
  it('permite escribir una descripción de su objeto', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Descripción de tu objeto'), 'Llaves con llavero azul');

    expect(screen.getByLabelText('Descripción de tu objeto')).toHaveValue('Llaves con llavero azul');
  });
  
});

describe('Categoría del objeto perdido', () => {
  it('muestra las categorías y permite elegir una', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('radio', { name: 'Llaves' }));

    expect(screen.getByRole('radio', { name: 'Llaves' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Electrónicos' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('Lugares donde pudo perderlo', () => {
  it('permite elegir varios lugares', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Bloque A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Biblioteca' }));

    expect(screen.getByRole('button', { name: 'Bloque A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Biblioteca' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('al elegir un bloque permite elegir el aula, y en un espacio no', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Biblioteca' }));
    expect(screen.queryByLabelText(/Aula en/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Bloque A' }));
    await userEvent.selectOptions(screen.getByLabelText(/Aula en Bloque A/), 'Aula A-12');

    expect(screen.getByLabelText(/Aula en Bloque A/)).toHaveValue('216');
  });

  it('permite quitar un lugar elegido', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Bloque A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bloque A' }));

    expect(screen.getByRole('button', { name: 'Bloque A' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText(/Aula en Bloque A/)).not.toBeInTheDocument();
  });
});


describe('Descripción del lugar', () => {
  it('permite describir en texto por dónde pudo perderlo', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/¿Por dónde pudo perderlo\?/), 'Fui de la biblioteca a la cafetería');

    expect(screen.getByLabelText(/¿Por dónde pudo perderlo\?/)).toHaveValue('Fui de la biblioteca a la cafetería');
  });
});


describe('Rango de fechas de la pérdida', () => {
  it('permite indicar desde y hasta qué fecha pudo perderlo', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Desde'), '2026-10-17');
    await userEvent.type(screen.getByLabelText('Hasta'), '2026-10-18');

    expect(screen.getByLabelText('Desde')).toHaveValue('2026-10-17');
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-10-18');
  });
});


async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText('Descripción de tu objeto'), '  Llaves con llavero azul ');
  await userEvent.click(screen.getByRole('radio', { name: 'Llaves' }));
  await userEvent.type(screen.getByLabelText('Desde'), '2026-10-17');
  await userEvent.type(screen.getByLabelText('Hasta'), '2026-10-18');
}

describe('Enviar el reporte y recibir su código', () => {
  it('envía los datos elegidos y muestra el código único del reporte', async () => {
    const onCreate = renderForm(jest.fn().mockResolvedValue({ code: 'PR-0007' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Bloque A' }));
    await userEvent.selectOptions(screen.getByLabelText(/Aula en Bloque A/), 'Aula A-12');
    await userEvent.click(screen.getByRole('button', { name: 'Biblioteca' }));
    await userEvent.type(screen.getByLabelText(/¿Por dónde pudo perderlo\?/), 'Cerca de la cafetería');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText('PR-0007')).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledWith(
      {
        description: 'Llaves con llavero azul',
        categoryId: 47,
        places: [
          { placeId: 83, classroomId: 216 },
          { placeId: 98, classroomId: null },
        ],
        placeDescription: 'Cerca de la cafetería',
        dateFrom: '2026-10-17',
        dateTo: '2026-10-18',
      },
      null,
    );
  });

  it('muestra el error y mantiene lo escrito si no se pudo enviar', async () => {
    renderForm(jest.fn().mockRejectedValue(new Error('No se pudo enviar tu reporte. Intenta nuevamente.')));
    await fillRequiredFields();

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText('No se pudo enviar tu reporte. Intenta nuevamente.')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción de tu objeto')).toHaveValue('  Llaves con llavero azul ');
  });
});

describe('Datos obligatorios al enviar', () => {
  it('no envía el reporte si falta la descripción, la categoría o el rango de fechas', async () => {
    const onCreate = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(screen.getByText('Escribe una descripción de tu objeto.')).toBeInTheDocument();
    expect(screen.getByText('Elige una categoría.')).toBeInTheDocument();
    expect(screen.getByText('Indica desde qué fecha pudo perderse.')).toBeInTheDocument();
    expect(screen.getByText('Indica hasta qué fecha pudo perderse.')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe('Foto de referencia', () => {
  beforeAll(() => {
    // jsdom no crea vistas previas de imágenes; las simulamos.
    URL.createObjectURL = jest.fn(() => 'blob:vista-previa');
    URL.revokeObjectURL = jest.fn();
  });

  it('permite subir una foto de referencia y la envía con el reporte', async () => {
    const onCreate = renderForm(jest.fn().mockResolvedValue({ code: 'PR-0008' }));
    const photo = new File(['foto'], 'llaves.png', { type: 'image/png' });

    await userEvent.upload(screen.getByLabelText('Foto del objeto'), photo);
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toBeInTheDocument();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText('PR-0008')).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledWith(expect.any(Object), photo);
  });
});