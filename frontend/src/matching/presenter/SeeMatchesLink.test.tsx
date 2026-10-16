import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SeeMatchesLink } from './SeeMatchesLink';

describe('Ir a los objetos parecidos desde un reporte', () => {
  it('lleva a los objetos parecidos de ese reporte', () => {
    render(
      <MemoryRouter>
        <SeeMatchesLink reportCode="PR-0001" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Ver objetos parecidos' })).toHaveAttribute(
      'href',
      '/mis-reportes/PR-0001/coincidencias',
    );
  });
});
