import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('Chip de estado', () => {
  it('muestra la etiqueta del estado en español', () => {
    render(<StatusChip status="IN_CUSTODY" />);

    expect(screen.getByText('En custodia')).toBeInTheDocument();
  });
});
