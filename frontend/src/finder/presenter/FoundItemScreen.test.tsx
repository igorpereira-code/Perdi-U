import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FoundItemsService } from '../data/foundItemsService';
import { FoundItemScreen } from './FoundItemScreen';

const catalogs = {
  categories: [{ id: 47, name: 'Llaves reales' }],
  places: [{ id: 83, name: 'Bloque real', type: 'BLOCK' as const, classrooms: [{ id: 216, name: 'Aula real' }] }],
};

function fakeService(): jest.Mocked<FoundItemsService> {
  return {
    getCatalogs: jest.fn().mockResolvedValue(catalogs),
    create: jest.fn().mockResolvedValue({ code: 'HZ-7325', status: 'PENDING_DROP_OFF' }),
    getPhotoUrl: jest.fn(),
  };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('option', { name: 'Llaves reales' });
  await user.type(screen.getByLabelText('Descripción del objeto'), 'Llaves azules');
  await user.selectOptions(screen.getByLabelText('Categoría'), '47');
  await user.selectOptions(screen.getByLabelText('Bloque o espacio'), '83');
  await user.selectOptions(screen.getByLabelText('Aula'), '216');
  await user.type(screen.getByLabelText('Referencia del lugar'), 'Sobre la mesa');
  fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2026-10-19' } });
}

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:foto-local');
  URL.revokeObjectURL = jest.fn();
});

describe('Envío del formulario de hallazgo con catálogos reales', () => {
  it('carga IDs del servicio y muestra un error con reintento si falla la consulta', async () => {
    const service = fakeService();
    service.getCatalogs.mockRejectedValueOnce(new Error('No se pudieron cargar los catálogos.'));
    render(<FoundItemScreen foundItemsService={service} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los catálogos.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('option', { name: 'Llaves reales' })).toHaveValue('47');
    expect(service.getCatalogs).toHaveBeenCalledTimes(2);
  });

  it('envía IDs reales sin foto ni hora y muestra únicamente el código confirmado', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);
    expect(screen.queryByText(/HZ-/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('status')).toHaveTextContent('HZ-7325');
    expect(service.create).toHaveBeenCalledWith({
      description: 'Llaves azules', categoryId: 47, placeId: 83, classroomId: 216,
      placeReference: 'Sobre la mesa', foundAt: '2026-10-19T04:00:00.000Z',
    }, null);
  });

  it('conserva la hora elegida y pasa la fotografía opcional al servicio del backend', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    const photo = new File(['imagen'], 'llaves.png', { type: 'image/png' });
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);
    fireEvent.change(screen.getByLabelText('Hora del hallazgo'), { target: { value: '23:45' } });
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByText('HZ-7325')).toBeInTheDocument();
    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      foundAt: '2026-10-20T03:45:00.000Z',
    }), photo);
  });

  it('impide envíos repetidos mientras espera la respuesta y después del éxito', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    let finish!: (value: { code: string; status: 'PENDING_DROP_OFF' }) => void;
    service.create.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);

    await user.dblClick(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));
    fireEvent.submit(screen.getByRole('form'));

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/HZ-/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    finish({ code: 'HZ-9881', status: 'PENDING_DROP_OFF' });
    expect(await screen.findByText('HZ-9881')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('conserva todos los datos y la foto tras un error y permite reintentar', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    service.create.mockRejectedValueOnce(new Error('No se pudo subir la fotografía. Intenta nuevamente.'));
    const photo = new File(['imagen'], 'llaves.png', { type: 'image/png' });
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);
    await user.upload(screen.getByLabelText('Foto del objeto'), photo);
    fireEvent.change(screen.getByLabelText('Hora del hallazgo'), { target: { value: '08:15' } });

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo subir la fotografía.');
    expect(screen.getByLabelText('Descripción del objeto')).toHaveValue('Llaves azules');
    expect(screen.getByLabelText('Categoría')).toHaveValue('47');
    expect(screen.getByLabelText('Bloque o espacio')).toHaveValue('83');
    expect(screen.getByLabelText('Aula')).toHaveValue('216');
    expect(screen.getByLabelText('Referencia del lugar')).toHaveValue('Sobre la mesa');
    expect(screen.getByLabelText('Fecha del hallazgo')).toHaveValue('2026-10-19');
    expect(screen.getByLabelText('Hora del hallazgo')).toHaveValue('08:15');
    expect(screen.getByRole('img', { name: 'Vista previa de la foto' })).toHaveAttribute('src', 'blob:foto-local');
    expect(screen.queryByText(/HZ-/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    await waitFor(() => expect(screen.getByText('HZ-7325')).toBeInTheDocument());
    expect(service.create).toHaveBeenCalledTimes(2);
    expect(service.create.mock.calls[1][1]).toBe(photo);
  });
});
