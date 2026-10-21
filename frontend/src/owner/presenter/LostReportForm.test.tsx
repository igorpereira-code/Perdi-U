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

function renderForm() {
  render(
    <MemoryRouter>
      <LostReportForm catalogs={catalogs} />
    </MemoryRouter>,
  );
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