import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('Chip de estado', () => {
  it('muestra el estado de un objeto encontrado en español', () => {
    render(<StatusChip status="IN_CUSTODY" />);

    expect(screen.getByText('En custodia')).toBeInTheDocument();
  });

  it('muestra el estado de un reporte de pérdida en español', () => {
    render(<StatusChip status="PENDING_PICKUP" />);

    expect(screen.getByText('Pendiente de recojo')).toBeInTheDocument();
  });
});
