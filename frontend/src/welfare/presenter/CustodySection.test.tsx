import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReceptionCorrection } from '../data/welfareService';
import { publishedItem, publishingService, renderPage, service } from './welfareTestSupport';

describe('Objetos en custodia de Bienestar', () => {
  it('publica un objeto y muestra cuantos reportes se parecen', async () => {
    renderPage(service(), publishingService());
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const card = (await screen.findByText('HZ-0004')).closest('article')!;
    await userEvent.click(within(card).getByRole('button', { name: 'Publicar' }));
    expect(await within(card).findByText('Publicado: la comunidad ya puede ver este objeto.')).toBeInTheDocument();
    expect(within(card).getByText('2 reportes de pérdida se parecen a este objeto.')).toBeInTheDocument();
    expect(within(card).queryByText('En custodia')).not.toBeInTheDocument();
    expect(within(card).getByText('Publicado')).toBeInTheDocument();
    expect(within(card).getByText('Visible para la comunidad')).toBeInTheDocument();
  });

  it('muestra codigo, estado y publicacion de los objetos que estan en la oficina', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const custodyCard = (await screen.findByText('HZ-0004')).closest('article')!;
    const publishedCard = screen.getByText('HZ-0003').closest('article')!;
    expect(within(custodyCard).getByText('En custodia')).toBeInTheDocument();
    expect(within(custodyCard).getByText('No publicado')).toBeInTheDocument();
    expect(within(publishedCard).getByText('Publicado')).toBeInTheDocument();
    expect(within(publishedCard).getByText('Visible para la comunidad')).toBeInTheDocument();
  });

  it('permite ocultar un objeto publicado y actualiza su estado', async () => {
    const setPublishedVisibility = jest.fn().mockResolvedValue({ code: 'HZ-0003', visibility: 'HIDDEN' });
    renderPage(service({ setPublishedVisibility }));
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const card = (await screen.findByText('HZ-0003')).closest('article')!;
    await userEvent.click(within(card).getByRole('button', { name: 'Ocultar de la comunidad' }));
    expect(setPublishedVisibility).toHaveBeenCalledWith('HZ-0003', 'HIDDEN');
    expect(await within(card).findByText('Oculto para la comunidad')).toBeInTheDocument();
  });

  it('permite editar los datos de un objeto publicado', async () => {
    const updatePublishedItem = jest.fn().mockImplementation(async (_code: string, correction: ReceptionCorrection) => ({ ...publishedItem, ...correction, description: correction.description }));
    renderPage(service({ updatePublishedItem }));
    await userEvent.click(screen.getByRole('button', { name: 'Objetos en custodia' }));
    const card = (await screen.findByText('HZ-0003')).closest('article')!;
    await userEvent.click(within(card).getByRole('button', { name: 'Editar datos' }));
    await userEvent.clear(within(card).getByLabelText('Descripción publicada'));
    await userEvent.type(within(card).getByLabelText('Descripción publicada'), 'Chamarra azul con cierre negro');
    await userEvent.selectOptions(within(card).getByLabelText('Categoría publicada'), '2');
    await userEvent.selectOptions(within(card).getByLabelText('Lugar publicado'), '4');
    await userEvent.clear(within(card).getByLabelText('Fecha publicada'));
    await userEvent.type(within(card).getByLabelText('Fecha publicada'), '2026-10-16T09:30');
    await userEvent.click(within(card).getByRole('button', { name: 'Guardar cambios' }));
    expect(updatePublishedItem).toHaveBeenCalledWith('HZ-0003', expect.objectContaining({ description: 'Chamarra azul con cierre negro', categoryId: 2, placeId: 4, classroomId: null, foundAt: new Date('2026-10-16T09:30').toISOString() }));
    expect(await within(card).findByText('Chamarra azul con cierre negro')).toBeInTheDocument();
  }, 10_000);
});
