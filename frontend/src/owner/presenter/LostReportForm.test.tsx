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