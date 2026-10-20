import { render, screen } from '@testing-library/react';
import { FoundItemReception } from './FoundItemReception';

describe('Recepción del objeto por Bienestar Estudiantil', () => {
  it('muestra pendiente de entrega según el estado, sin interpretar una fecha aislada como recepción', () => {
    render(<FoundItemReception status="PENDING_DROP_OFF" receivedAt="2026-10-19T14:30:00.000Z" />);

    expect(screen.getByText('Pendiente de entrega')).toBeInTheDocument();
    expect(screen.getByText('Bienestar Estudiantil aún no recibió el objeto.')).toBeInTheDocument();
    expect(screen.queryByText('19/10/2026')).not.toBeInTheDocument();
  });

  it.each([
    ['IN_CUSTODY', 'En custodia'], ['PUBLISHED', 'Publicado'], ['DELIVERED', 'Entregado'],
  ] as const)('reconoce la recepción en estado %s y conserva su etiqueta', (status, label) => {
    render(<FoundItemReception status={status} receivedAt="2026-10-19T14:30:00.000Z" />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('Recibido por Bienestar Estudiantil')).toBeInTheDocument();
    expect(screen.getByText('19/10/2026')).toHaveAttribute('datetime', '2026-10-19T14:30:00.000Z');
  });

  it('informa la recepción sin inventar una fecha cuando la base no la tiene', () => {
    render(<FoundItemReception status="IN_CUSTODY" receivedAt={null} />);

    expect(screen.getByText('Recibido por Bienestar Estudiantil')).toBeInTheDocument();
    expect(screen.getByText('Fecha de recepción no registrada.')).toBeInTheDocument();
  });
});
