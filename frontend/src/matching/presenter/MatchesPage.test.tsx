import { render, screen } from '@testing-library/react';
import type { MatchView } from '@shared/matching';
import { MatchesPage } from './MatchesPage';

function match(code: string, description: string): MatchView {
  return {
    id: code,
    status: 'SUGGESTED',
    similarity: 50,
    foundItem: { code, description, photoUrl: null, category: 'Electrónicos' },
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
});
