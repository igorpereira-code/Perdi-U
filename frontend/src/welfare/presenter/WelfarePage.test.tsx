import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WelfareFoundItemView } from '@shared/welfare';
import type { WelfareService } from '../data/welfareService';
import { WelfarePage } from './WelfarePage';

const item: WelfareFoundItemView = {
  code: 'HZ-0005', description: 'Mochila negra con cuadernos', photoUrl: null,
  category: 'Mochilas', place: 'Bloque A', classroom: 'Aula 3',
  placeReference: 'Debajo de una mesa', foundAt: '2026-10-15T14:00:00.000Z',
  status: 'PENDING_DROP_OFF', finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

function service(overrides: Partial<WelfareService> = {}): WelfareService {
  return {
    listPending: jest.fn().mockResolvedValue([item]),
    findByCode: jest.fn().mockResolvedValue({ status: 'FOUND', item }),
    receive: jest.fn(),
    ...overrides,
  };
}

describe('Panel de Bienestar', () => {
  it('muestra la carga y luego los objetos pendientes', async () => {
    render(<WelfarePage welfareService={service()} />);
    expect(screen.getByText('Cargando objetos pendientes...')).toBeInTheDocument();
    expect(await screen.findByText('Mochila negra con cuadernos')).toBeInTheDocument();
  });

  it('muestra un estado vacio cuando no hay pendientes', async () => {
    render(<WelfarePage welfareService={service({ listPending: jest.fn().mockResolvedValue([]) })} />);
    expect(await screen.findByRole('heading', { name: 'No hay objetos pendientes' })).toBeInTheDocument();
  });

  it('busca por codigo y muestra los datos del objeto y del Hallador', async () => {
    const welfareService = service();
    render(<WelfarePage welfareService={welfareService} />);
    await userEvent.type(screen.getByLabelText('Código del objeto'), ' hz-0005 ');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(welfareService.findByCode).toHaveBeenCalledWith(' hz-0005 ');
    expect(await screen.findByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText('ana.rojas@ucb.edu.bo')).toBeInTheDocument();
    expect(screen.getByText('Aula 3')).toBeInTheDocument();
  });

  it.each([
    ['NOT_FOUND', 'No encontramos un objeto con ese código'],
    ['ALREADY_RECEIVED', 'Este objeto ya fue recibido'],
  ] as const)('muestra el resultado %s', async (status, message) => {
    render(<WelfarePage welfareService={service({ findByCode: jest.fn().mockResolvedValue({ status }) })} />);
    await userEvent.type(screen.getByLabelText('Código del objeto'), 'HZ-9999');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('muestra un error sin perder la pantalla', async () => {
    render(<WelfarePage welfareService={service({ listPending: jest.fn().mockRejectedValue(new Error('network')) })} />);
    expect(await screen.findByText('No pudimos cargar los objetos pendientes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Panel de Bienestar' })).toBeInTheDocument();
  });
});
