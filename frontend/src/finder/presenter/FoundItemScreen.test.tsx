import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WELFARE_OFFICE } from '@shared/constants';
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

async function fillForm(user: ReturnType<typeof userEvent.setup>, withPhoto = false) {
  await screen.findByRole('option', { name: 'Llaves reales' });
  await user.type(screen.getByLabelText('Descripción del objeto'), 'Llaves azules');
  await user.selectOptions(screen.getByLabelText('Categoría'), '47');
  await user.selectOptions(screen.getByLabelText('Bloque o espacio'), '83');
  await user.selectOptions(screen.getByLabelText('Aula'), '216');
  await user.type(screen.getByLabelText('Referencia del lugar'), 'Sobre la mesa');
  fireEvent.change(screen.getByLabelText('Fecha del hallazgo'), { target: { value: '2026-10-19' } });
  if (withPhoto) {
    await user.upload(screen.getByLabelText('Foto del objeto'), new File(['imagen'], 'llaves.png', { type: 'image/png' }));
  }
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

describe('Instrucciones de entrega después del registro (CA11)', () => {
  it.each([
    { withPhoto: false, code: 'HZ-31072' },
    { withPhoto: true, code: 'HZ-92648' },
  ])('indica llevar el objeto a Bienestar y mostrar el código confirmado $code, con fotografía: $withPhoto', async ({ withPhoto, code }) => {
    const user = userEvent.setup();
    const service = fakeService();
    service.create.mockResolvedValue({ code, status: 'PENDING_DROP_OFF' });
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user, withPhoto);

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('heading', { name: 'Reporte registrado' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(code);
    expect(screen.getByText('Lleva el objeto a Bienestar Estudiantil.')).toBeInTheDocument();
    expect(screen.getByText(`Muestra el código ${code} al entregar el objeto.`)).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('mantiene oculta la confirmación antes de enviar, mientras guarda y si el guardado falla', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    let rejectCreate!: (error: Error) => void;
    service.create.mockImplementation(() => new Promise((_resolve, reject) => { rejectCreate = reject; }));
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);

    function expectNoConfirmation() {
      expect(screen.queryByRole('heading', { name: 'Reporte registrado' })).not.toBeInTheDocument();
      expect(screen.queryByText('Lleva el objeto a Bienestar Estudiantil.')).not.toBeInTheDocument();
      expect(screen.queryByText(/Muestra el código HZ-/)).not.toBeInTheDocument();
      expect(screen.queryByText(/HZ-/)).not.toBeInTheDocument();
    }

    expectNoConfirmation();
    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expectNoConfirmation();
    await act(async () => { rejectCreate(new Error('No se pudo registrar el objeto encontrado. Intenta nuevamente.')); });

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el objeto encontrado.');
    expectNoConfirmation();
    expect(screen.getByLabelText('Descripción del objeto')).toHaveValue('Llaves azules');
    expect(screen.getByRole('button', { name: 'Reportar objeto encontrado' })).toBeEnabled();
  });
});

describe('Advertencia de entrega a Bienestar Estudiantil (CA12)', () => {
  const warningText = 'No entregues el objeto directamente a su dueño. Debes llevarlo a Bienestar Estudiantil';

  it('advierte expresamente que el objeto no se entrega al dueño y debe llevarse a Bienestar', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('heading', { name: 'Reporte registrado' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(warningText);
    expect(screen.getByRole('status')).toHaveTextContent('HZ-7325');
  });

  it('conserva el error y muestra el aviso de entrega después de un reintento exitoso', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    service.create.mockRejectedValueOnce(new Error('No se pudo registrar el objeto encontrado. Intenta nuevamente.'));
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user);
    expect(screen.queryByText(/No entregues el objeto directamente a su dueño/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el objeto encontrado.');
    expect(screen.queryByText(/No entregues el objeto directamente a su dueño/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte registrado' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Descripción del objeto')).toHaveValue('Llaves azules');

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('heading', { name: 'Reporte registrado' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(warningText);
    expect(service.create).toHaveBeenCalledTimes(2);
  });
});

describe('Ubicación y horario de Bienestar después del registro (CA13)', () => {
  it.each([false, true])('muestra dónde y cuándo entregar el objeto tras guardar, con fotografía: %s', async (withPhoto) => {
    const user = userEvent.setup();
    const service = fakeService();
    render(<FoundItemScreen foundItemsService={service} />);
    await fillForm(user, withPhoto);
    expect(screen.queryByText(WELFARE_OFFICE.place)).not.toBeInTheDocument();
    expect(screen.queryByText(WELFARE_OFFICE.hours)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reportar objeto encontrado' }));

    expect(await screen.findByRole('heading', { name: 'Reporte registrado' })).toBeInTheDocument();
    expect(screen.getByText(WELFARE_OFFICE.place)).toBeVisible();
    expect(screen.getByText(WELFARE_OFFICE.hours)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('HZ-7325');
  });
});
