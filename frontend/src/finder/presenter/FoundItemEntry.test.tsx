
import { render, screen } from '@testing-library/react';
import { FoundItemEntry } from './FoundItemEntry';

describe('Acceso al reporte de objetos encontrados', () => {
  it('muestra la opción Encontré un objeto', () => {
    render(<FoundItemEntry onClick={() => {}} />);

    expect(
      screen.getByRole('button', { name: 'Encontré un objeto' }),
    ).toBeInTheDocument();
  });
});
