import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PublishResult } from '@shared/matching';
import type { MatchesService } from '../data/matchesService';
import { PublishButton } from './PublishButton';

function fakeService(result: PublishResult): MatchesService {
  return {
    getMatches: jest.fn(),
    pickUp: jest.fn(),
    dismiss: jest.fn(),
    publish: jest.fn().mockResolvedValue(result),
  };
}

describe('Botón para publicar un objeto (para el panel de Bienestar)', () => {
  it('avisa que no se puede publicar un objeto que todavía no fue recibido', async () => {
    const service = fakeService({ status: 'NOT_RECEIVED' });
    render(<PublishButton itemCode="HZ-0005" matchesService={service} />);

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(service.publish).toHaveBeenCalledWith('HZ-0005');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este objeto todavía no fue recibido en Bienestar.',
    );
  });

  it('avisa que la comunidad ya puede ver el objeto publicado', async () => {
    render(
      <PublishButton
        itemCode="HZ-0004"
        matchesService={fakeService({ status: 'PUBLISHED', matchCount: 0 })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Publicado: la comunidad ya puede ver este objeto.',
    );
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
  });
});
