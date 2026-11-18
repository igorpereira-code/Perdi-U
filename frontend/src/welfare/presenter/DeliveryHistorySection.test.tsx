import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WelfareDeliveryView } from '@shared/welfare';
import { completedDelivery, renderPage, service } from './welfareTestSupport';

describe('Historial de entregas en Bienestar', () => {
  it('muestra las entregas realizadas con objeto receptor y fecha', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Entregas realizadas' }));
    expect(await screen.findByText('HZ-0008')).toBeInTheDocument();
    expect(screen.getByText('Paraguas negro')).toBeInTheDocument();
    expect(screen.getByText('Luis Mamani')).toBeInTheDocument();
    expect(screen.getByText('luis.mamani@ucb.edu.bo')).toBeInTheDocument();
    expect(screen.getByText('16/11/2026')).toBeInTheDocument();
  });

  it.each([
    ['hz-0008', 'HZ-0008'],
    ['luis mamani', 'Luis Mamani'],
    ['LUIS.MAMANI@UCB.EDU.BO', 'luis.mamani@ucb.edu.bo'],
  ])('busca entregas por %s', async (search, expected) => {
    const other: WelfareDeliveryView = { ...completedDelivery, foundItem: { code: 'HZ-0099', description: 'Cuaderno rojo' }, recipient: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo', universityCode: '20205678' } };
    renderPage(service({ listDeliveries: jest.fn().mockResolvedValue([completedDelivery, other]) }));
    await userEvent.click(screen.getByRole('button', { name: 'Entregas realizadas' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar entregas' }), search);
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.queryByText('HZ-0099')).not.toBeInTheDocument();
  });
});
