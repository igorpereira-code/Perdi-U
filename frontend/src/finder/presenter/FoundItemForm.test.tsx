import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CATEGORIES, PLACES } from '../../../../backend/prisma/seed/catalogs';
import { FoundItemForm } from './FoundItemForm';

const catalogs = {
  categories: CATEGORIES.map((name, index) => ({ id: 100 + index, name })),
  places: PLACES.map((place, index) => ({
    ...place,
    id: 1000 + index,
    classrooms: (place.classrooms ?? []).map((name, classroomIndex) => ({
      id: 10000 + index * 100 + classroomIndex, name,
    })),
  })),
};

function idForName(name: string): string {
  if (!name) { return ''; }
  const options = [...catalogs.categories, ...catalogs.places, ...catalogs.places.flatMap((place) => place.classrooms)];
  const option = options.find((candidate) => candidate.name === name);
  if (!option) { throw new Error('Nombre de prueba desconocido: ' + name); }
  return String(option.id);
}


describe('Descripción del objeto encontrado', () => {
  it('muestra un campo accesible para ingresar la descripción del objeto', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('textbox', { name: 'Descripción del objeto' })).toBeInTheDocument();
  });

  it('permite escribir y conservar la descripción al volver a renderizar el formulario', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);
    const description = 'Teléfono con funda azul y una marca en la esquina.';

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);

    await user.tab();
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
  });
});

describe('Fotografía opcional del objeto encontrado', () => {
  const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-del-objeto');
    URL.revokeObjectURL = jest.fn();
  });

  it('permite seleccionar una fotografía desde el formulario y ver su vista previa', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByLabelText('Foto del objeto')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Foto del objeto'), photo);

    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-del-objeto',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
  });

  it('indica que la fotografía es opcional y permite escribir la descripción sin seleccionarla', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('group', { name: 'Fotografía (opcional)' })).toBeInTheDocument();

    const photoInput = screen.getByLabelText('Foto del objeto');
    expect(photoInput).not.toBeRequired();
    expect(photoInput).toHaveAttribute('accept', 'image/*');
    expect(photoInput).not.toHaveAttribute('capture');

    const description = 'Llaves con un llavero azul';
    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
    expect(screen.queryByRole('img', { name: 'Vista previa de la foto' })).not.toBeInTheDocument();
  });

  it('permite quitar la fotografía seleccionada sin perder la descripción', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);
    const description = 'Llaves con un llavero azul';

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    expect(screen.queryByLabelText('Foto del objeto')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    await user.click(screen.getByRole('button', { name: 'Quitar foto' }));

    expect(screen.queryByRole('img', { name: 'Vista previa de la foto' })).not.toBeInTheDocument();
    expect(screen.queryByText(photo.name)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Foto del objeto')).not.toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
  });
});

describe('Categoría del objeto encontrado', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-categoria');
    URL.revokeObjectURL = jest.fn();
  });

  it('muestra un selector accesible con las categorías definidas en el proyecto', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    const categorySelect = screen.getByRole('combobox', { name: 'Categoría' });
    const options = within(categorySelect)
      .getAllByRole('option')
      .filter((option) => option.getAttribute('value') !== '');

    expect(options.map((option) => option.textContent)).toEqual(CATEGORIES);
    expect(options.map((option) => option.getAttribute('value'))).toEqual(catalogs.categories.map((category) => String(category.id)));
  });

  it('permite seleccionar y cambiar la categoría y conserva la selección al renderizar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName('Llaves'));
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Llaves'));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName('Otros'));
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Otros'));
  });

  it('conserva la descripción y la fotografía al seleccionar una categoría', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);
    const description = 'Llaves con un llavero azul';
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    expect(screen.queryByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName('Llaves'));

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Llaves'));
    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-con-categoria',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
  });
});

describe('Ubicación del objeto encontrado', () => {
  const blocks = PLACES.filter((place) => place.type === 'BLOCK');
  const spaces = PLACES.filter((place) => place.type === 'SPACE');

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-ubicacion');
    URL.revokeObjectURL = jest.fn();
  });

  it('ofrece primero los bloques y espacios del catálogo recibido, sin mostrar aulas', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    const placeSelect = screen.getByRole('combobox', { name: 'Bloque o espacio' });
    const options = within(placeSelect)
      .getAllByRole('option')
      .filter((option) => option.getAttribute('value') !== '');

    expect(options.map((option) => option.textContent)).toEqual(PLACES.map((place) => place.name));
    expect(options.map((option) => option.getAttribute('value'))).toEqual(
      catalogs.places.map((place) => String(place.id)),
    );
    expect(placeSelect).toHaveValue('');
    expect(screen.queryByRole('combobox', { name: 'Aula' })).not.toBeInTheDocument();
  });

  it.each(blocks)('permite seleccionar únicamente las aulas de $name y conserva la selección', async (block) => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName(block.name));
    const classroomSelect = screen.getByRole('combobox', { name: 'Aula' });
    const options = within(classroomSelect)
      .getAllByRole('option')
      .filter((option) => option.getAttribute('value') !== '');

    expect(options.map((option) => option.textContent)).toEqual(block.classrooms);
    expect(options.map((option) => option.getAttribute('value'))).toEqual(block.classrooms?.map(idForName));
    expect(classroomSelect).toHaveValue('');

    await user.selectOptions(classroomSelect, idForName(block.classrooms![0]));
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByRole('combobox', { name: 'Bloque o espacio' })).toHaveValue(idForName(block.name));
    expect(screen.getByRole('combobox', { name: 'Aula' })).toHaveValue(idForName(block.classrooms![0]));
  });

  it('no muestra el selector de aula en ninguno de los espacios del catálogo', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    for (const space of spaces) {
      await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName(space.name));

      expect(screen.getByRole('combobox', { name: 'Bloque o espacio' })).toHaveValue(idForName(space.name));
      expect(screen.queryByRole('combobox', { name: 'Aula' })).not.toBeInTheDocument();
    }
  });

  it('limpia el aula al cambiar de bloque y no recupera una selección anterior al volver', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    const placeSelect = screen.getByRole('combobox', { name: 'Bloque o espacio' });
    await user.selectOptions(placeSelect, idForName('Bloque A'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula A-12'));
    await user.selectOptions(placeSelect, idForName('Bloque B'));

    expect(screen.getByRole('combobox', { name: 'Aula' })).toHaveValue('');
    expect(
      within(screen.getByRole('combobox', { name: 'Aula' })).queryByRole('option', { name: 'Aula A-12' }),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula B-12'));
    await user.selectOptions(placeSelect, idForName('Bloque A'));

    expect(screen.getByRole('combobox', { name: 'Aula' })).toHaveValue('');
  });

  it('limpia el aula al seleccionar un espacio o dejar la ubicación sin seleccionar', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    const placeSelect = screen.getByRole('combobox', { name: 'Bloque o espacio' });
    for (const nextPlace of ['Biblioteca', '']) {
      await user.selectOptions(placeSelect, idForName('Bloque A'));
      await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula A-12'));
      await user.selectOptions(placeSelect, idForName(nextPlace));

      expect(screen.queryByRole('combobox', { name: 'Aula' })).not.toBeInTheDocument();
      await user.selectOptions(placeSelect, idForName('Bloque A'));
      expect(screen.getByRole('combobox', { name: 'Aula' })).toHaveValue('');
    }
  });

  it('conserva la descripción, categoría y fotografía al cambiar de bloque, aula o espacio', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);
    const description = 'Llaves con un llavero azul';
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName('Llaves'));
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);

    expect(screen.queryByRole('combobox', { name: 'Bloque o espacio' })).toBeInTheDocument();
    for (const place of PLACES) {
      await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName(place.name));
      if (place.type === 'BLOCK') {
        await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName(place.classrooms![0]));
      }
      rerender(<FoundItemForm catalogs={catalogs} />);

      expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
      expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Llaves'));
      expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
        'src',
        'blob:foto-con-ubicacion',
      );
      expect(screen.getByText(photo.name)).toBeInTheDocument();
    }
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe('Referencia adicional del lugar del hallazgo', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-referencia');
    URL.revokeObjectURL = jest.fn();
  });

  it('muestra un campo accesible de referencia del lugar, inicialmente vacío', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('textbox', { name: 'Referencia del lugar' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).not.toBeRequired();
  });

  it('permite escribir, editar y borrar libremente la referencia y conservarla al renderizar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('textbox', { name: 'Referencia del lugar' })).toBeInTheDocument();
    const reference = screen.getByRole('textbox', { name: 'Referencia del lugar' });
    await user.type(reference, 'Junto al aula A-12, cerca de la ventana.');
    expect(reference).toHaveValue('Junto al aula A-12, cerca de la ventana.');

    await user.clear(reference);
    const editedReference = 'Sobre la mesa grande (junto a la puerta), 2.º piso.';
    await user.type(reference, editedReference);
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).toHaveValue(editedReference);
    await user.clear(screen.getByRole('textbox', { name: 'Referencia del lugar' }));
    expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).toHaveValue('');
  });

  it('conserva la referencia, descripción y foto al cambiar aula, bloque, espacio o categoría', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);
    const reference = 'En la mesa junto a la ventana, segundo piso.';
    const description = 'Llaves con un llavero azul';
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

    expect(screen.queryByRole('textbox', { name: 'Referencia del lugar' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Referencia del lugar' }), reference);
    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);

    function expectDraftKept() {
      expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).toHaveValue(reference);
      expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
      expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
        'src',
        'blob:foto-con-referencia',
      );
      expect(screen.getByText(photo.name)).toBeInTheDocument();
    }

    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Bloque A'));
    expectDraftKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula A-12'));
    expectDraftKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula A-22'));
    expectDraftKept();
    for (const category of ['Llaves', 'Otros']) {
      await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName(category));
      expectDraftKept();
    }
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Bloque B'));
    expectDraftKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula B-12'));
    expectDraftKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Biblioteca'));
    rerender(<FoundItemForm catalogs={catalogs} />);

    expectDraftKept();
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Otros'));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe('Fecha y hora del hallazgo', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-fecha');
    URL.revokeObjectURL = jest.fn();
  });

  it('muestra controles accesibles vacíos para la fecha y hora del hallazgo, distintas de la creación del reporte', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByLabelText('Fecha del hallazgo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Hora del hallazgo')).toBeInTheDocument();
    const date = screen.getByLabelText('Fecha del hallazgo');
    const time = screen.getByLabelText('Hora del hallazgo');

    expect(date).toHaveAttribute('type', 'date');
    expect(time).toHaveAttribute('type', 'time');
    expect(date).toHaveValue('');
    expect(time).toHaveValue('');
    expect(date).toHaveAccessibleDescription(/aunque lo reportes otro día/i);
    expect(time).toHaveAccessibleDescription(/aunque lo reportes otro día/i);
    expect(date).toBeRequired();
    expect(time).not.toBeRequired();
  });

  it('permite editar y borrar fecha y hora por separado sin sustituir la fecha elegida por la actual', () => {
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByLabelText('Fecha del hallazgo')).toBeInTheDocument();
    const date = screen.getByLabelText('Fecha del hallazgo');
    const time = screen.getByLabelText('Hora del hallazgo');
    fireEvent.change(date, { target: { value: '2025-05-14' } });
    fireEvent.change(time, { target: { value: '13:40' } });
    expect(date).toHaveValue('2025-05-14');
    expect(time).toHaveValue('13:40');

    fireEvent.change(date, { target: { value: '2025-05-16' } });
    expect(time).toHaveValue('13:40');
    fireEvent.change(time, { target: { value: '08:15' } });
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2025-05-16');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('08:15');

    fireEvent.change(date, { target: { value: '' } });
    expect(time).toHaveValue('08:15');
    fireEvent.change(time, { target: { value: '' } });
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('');
  });

  it('conserva fecha y hora al modificar descripción, fotografía, categoría, bloque, aula y referencia', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);
    const description = 'Llaves con llavero azul';
    const reference = 'Sobre la mesa junto a la ventana';
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });

    expect(screen.queryByLabelText('Fecha del hallazgo')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2025-05-14' } });
    fireEvent.change(screen.getByLabelText('Hora del hallazgo'), { target: { value: '13:40' } });

    function expectFoundDateTimeKept() {
      expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2025-05-14');
      expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('13:40');
    }

    await user.type(screen.getByRole('textbox', { name: 'Descripción del objeto' }), description);
    expectFoundDateTimeKept();
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    expectFoundDateTimeKept();
    await user.click(screen.getByRole('button', { name: 'Quitar foto' }));
    expectFoundDateTimeKept();
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    expectFoundDateTimeKept();
    for (const category of ['Llaves', 'Otros']) {
      await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), idForName(category));
      expectFoundDateTimeKept();
    }
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Bloque A'));
    expectFoundDateTimeKept();
    for (const classroom of ['Aula A-12', 'Aula A-22']) {
      await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName(classroom));
      expectFoundDateTimeKept();
    }
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Bloque B'));
    expectFoundDateTimeKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aula' }), idForName('Aula B-12'));
    expectFoundDateTimeKept();
    await user.type(screen.getByRole('textbox', { name: 'Referencia del lugar' }), reference);
    expectFoundDateTimeKept();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Bloque o espacio' }), idForName('Biblioteca'));
    rerender(<FoundItemForm catalogs={catalogs} />);
    expectFoundDateTimeKept();

    fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2025-05-16' } });
    fireEvent.change(screen.getByLabelText('Hora del hallazgo'), { target: { value: '08:15' } });

    expect(screen.getByRole('textbox', { name: 'Descripción del objeto' })).toHaveValue(description);
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue(idForName('Otros'));
    expect(screen.getByRole('combobox', { name: 'Bloque o espacio' })).toHaveValue(idForName('Biblioteca'));
    expect(screen.getByRole('textbox', { name: 'Referencia del lugar' })).toHaveValue(reference);
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-con-fecha',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2025-05-16');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('08:15');
  });
});

describe('Validación del formulario de hallazgo', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:foto-con-validacion');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, place = 'Biblioteca') {
    await user.type(screen.getByLabelText('Descripción del objeto'), 'Llaves con llavero azul');
    await user.selectOptions(screen.getByLabelText('Categoría'), idForName('Llaves'));
    await user.selectOptions(screen.getByLabelText('Bloque o espacio'), idForName(place));
    fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2025-05-14' } });
  }

  it('ofrece un botón de envío y señala únicamente los cuatro campos obligatorios sin errores iniciales', () => {
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('button', { name: 'Reportar objeto encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reportar objeto encontrado' })).toHaveAttribute(
      'type',
      'submit',
    );
    for (const label of ['Descripción del objeto', 'Categoría', 'Bloque o espacio', 'Fecha del hallazgo']) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    for (const label of ['Foto del objeto', 'Referencia del lugar', 'Hora del hallazgo']) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('impide enviar el formulario vacío y muestra errores accesibles junto a cada campo obligatorio', async () => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('button', { name: 'Reportar objeto encontrado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(screen.getAllByRole('alert')).toHaveLength(4);
    for (const [label, message] of [
      ['Descripción del objeto', 'Escribe una descripción del objeto.'],
      ['Categoría', 'Selecciona una categoría.'],
      ['Bloque o espacio', 'Selecciona un bloque o espacio.'],
      ['Fecha del hallazgo', 'Indica la fecha del hallazgo.'],
    ]) {
      const field = screen.getByLabelText(label);
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(within(field.parentElement!).getByRole('alert')).toHaveTextContent(message);
    }
    expect(screen.getByLabelText('Descripción del objeto')).toHaveFocus();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['Descripción del objeto', 'Escribe una descripción del objeto.'],
    ['Categoría', 'Selecciona una categoría.'],
    ['Bloque o espacio', 'Selecciona un bloque o espacio.'],
    ['Fecha del hallazgo', 'Indica la fecha del hallazgo.'],
  ])('impide enviar cuando solo falta %s', async (label, message) => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);
    await fillRequiredFields(user);
    fireEvent.change(screen.getByLabelText(label), { target: { value: '' } });

    expect(screen.queryByRole('button', { name: 'Reportar objeto encontrado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(label)).toHaveFocus();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(['Biblioteca', 'Bloque A'])('supera la validación en %s sin hora, aula, foto ni referencia y sin registrar el reporte', async (place) => {
    const user = userEvent.setup();
    render(<FoundItemForm catalogs={catalogs} />);

    expect(screen.queryByRole('button', { name: 'Reportar objeto encontrado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));
    expect(screen.getAllByRole('alert')).toHaveLength(4);
    await fillRequiredFields(user, place);

    expect(fireEvent.submit(screen.getByRole('form', { name: 'Reportar objeto encontrado' }))).toBe(false);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    for (const label of ['Descripción del objeto', 'Categoría', 'Bloque o espacio', 'Fecha del hallazgo']) {
      expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid', 'true');
    }
    expect(screen.getByLabelText('Descripción del objeto')).toHaveValue('Llaves con llavero azul');
    expect(screen.getByLabelText('Bloque o espacio')).toHaveValue(idForName(place));
    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2025-05-14');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('');
    expect(screen.getByLabelText('Referencia del lugar')).toHaveValue('');
    const classroom = screen.queryByLabelText('Aula');
    if (classroom) {
      expect(classroom).toHaveValue('');
      expect(classroom).not.toBeRequired();
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/reporte (registrado|enviado)|HZ-/i)).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('conserva todos los datos y la fotografía tras un error y permite corregir el campo faltante', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FoundItemForm catalogs={catalogs} />);
    const photo = new File(['foto'], 'llaves.jpg', { type: 'image/jpeg' });
    const description = '   ';
    const reference = 'Sobre la mesa junto a la ventana';
    await user.type(screen.getByLabelText('Descripción del objeto'), description);
    await user.selectOptions(screen.getByLabelText('Categoría'), idForName('Llaves'));
    await user.selectOptions(screen.getByLabelText('Bloque o espacio'), idForName('Bloque A'));
    await user.selectOptions(screen.getByLabelText('Aula'), idForName('Aula A-12'));
    await user.type(screen.getByLabelText('Referencia del lugar'), reference);
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2025-05-14' } });
    fireEvent.change(screen.getByLabelText('Hora del hallazgo'), { target: { value: '08:15' } });

    expect(screen.queryByRole('button', { name: 'Reportar objeto encontrado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));
    rerender(<FoundItemForm catalogs={catalogs} />);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe una descripción del objeto.');
    expect(screen.getByLabelText('Descripción del objeto')).toHaveValue(description);
    expect(screen.getByLabelText('Categoría')).toHaveValue(idForName('Llaves'));
    expect(screen.getByLabelText('Bloque o espacio')).toHaveValue(idForName('Bloque A'));
    expect(screen.getByLabelText('Aula')).toHaveValue(idForName('Aula A-12'));
    expect(screen.getByLabelText('Referencia del lugar')).toHaveValue(reference);
    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2025-05-14');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('08:15');
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute(
      'src',
      'blob:foto-con-validacion',
    );
    expect(screen.getByText(photo.name)).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Descripción del objeto'));
    await user.type(screen.getByLabelText('Descripción del objeto'), 'Llaves con llavero azul');
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toBeInTheDocument();
    expect(screen.queryByText(/reporte (registrado|enviado)|HZ-/i)).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
