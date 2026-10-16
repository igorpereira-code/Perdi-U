import { render, screen, within } from '@testing-library/react';
import type { MatchView } from '@shared/matching';
import { MatchesPage } from './MatchesPage';

function match(code: string, description: string, photoUrl: string | null = null): MatchView {
  return {
    id: code,
    status: 'SUGGESTED',
    similarity: 50,
    foundItem: { code, description, photoUrl, category: 'Electrónicos' },
  };
}

describe('Objetos parecidos a mi reporte', () => {
  it('muestra los objetos parecidos en el orden en que llegan, del más parecido al menos parecido', () => {
    const matches = [
      match('HZ-0001', 'Celular Samsung con funda azul'),
      match('HZ-0002', 'Celular negro'),
    ];

    render(<MatchesPage reportCode="PR-0001" matches={matches} />);

    expect(
      screen.getByRole('heading', { name: 'Objetos parecidos a tu reporte PR-0001' }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Celular Samsung con funda azul');
    expect(items[1]).toHaveTextContent('Celular negro');
  });

  it('avisa que su reporte seguirá activo cuando no hay objetos parecidos', () => {
    render(<MatchesPage reportCode="PR-0003" matches={[]} />);

    expect(
      screen.getByRole('heading', { name: 'Todavía no hay objetos parecidos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tu reporte PR-0003 seguirá activo. Vuelve a revisarlo más adelante.'),
    ).toBeInTheDocument();
  });

  it('muestra la foto, la descripción y el código de cada objeto parecido', () => {
    const matches = [
      match('HZ-0001', 'Celular Samsung con funda azul', 'https://foto.com/celular.jpg'),
      match('HZ-0002', 'Celular negro'),
    ];

    render(<MatchesPage reportCode="PR-0001" matches={matches} />);

    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first).getByRole('img', { name: 'Foto del objeto' })).toHaveAttribute(
      'src',
      'https://foto.com/celular.jpg',
    );
    expect(first).toHaveTextContent('HZ-0001');
    expect(within(second).getByRole('img', { name: 'Electrónicos' })).toBeInTheDocument();
    expect(second).toHaveTextContent('HZ-0002');
  });
});
