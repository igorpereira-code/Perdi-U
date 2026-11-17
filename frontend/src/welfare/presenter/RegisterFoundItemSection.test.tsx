import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPage, service } from './welfareTestSupport';

describe('Registro directo de objetos en Bienestar', () => {
  it('registra desde el panel un objeto sin reporte previo', async () => {
    const registerFoundItem = jest.fn().mockResolvedValue({ code: 'HZ-0042', status: 'IN_CUSTODY' });
    renderPage(service({ registerFoundItem }));

    await userEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));
    expect(screen.getByRole('heading', { name: 'Registrar objeto' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Descripción del objeto'), 'Paraguas negro');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Bloque o espacio'), '4');
    await userEvent.type(screen.getByLabelText('Fecha del hallazgo'), '2026-11-15');
    const form = screen.getByRole('heading', { name: 'Registrar objeto' }).closest('form');
    await userEvent.click(within(form!).getByRole('button', { name: 'Registrar objeto' }));

    expect(registerFoundItem).toHaveBeenCalledWith(expect.objectContaining({ description: 'Paraguas negro', categoryId: 1, placeId: 4 }), null);
    expect(await screen.findByText('HZ-0042')).toBeInTheDocument();
    expect(screen.getByText('El objeto quedó en custodia y está listo para publicarse.')).toBeInTheDocument();
  });
});
