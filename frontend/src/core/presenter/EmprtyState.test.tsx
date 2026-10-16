import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('Estado vacío', () => {
  it('explica al usuario por qué no hay nada que mostrar', () => {
    render(
      <EmptyState title="Sin reportes" text="Cuando encuentres algo, repórtalo desde Inicio." />,
    );

    expect(screen.getByRole('heading', { name: 'Sin reportes' })).toBeInTheDocument();
    expect(screen.getByText('Cuando encuentres algo, repórtalo desde Inicio.')).toBeInTheDocument();
  });
});
