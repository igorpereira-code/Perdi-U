import { render, screen } from '@testing-library/react';
import { InfoRow } from './InfoRow';

describe('Fila de datos', () => {
  it('muestra el nombre del dato junto a su valor', () => {
    render(
      <dl>
        <InfoRow label="Categoría" value="Llaves" />
      </dl>,
    );

    expect(screen.getByRole('term')).toHaveTextContent('Categoría');
    expect(screen.getByRole('definition')).toHaveTextContent('Llaves');
  });
});
