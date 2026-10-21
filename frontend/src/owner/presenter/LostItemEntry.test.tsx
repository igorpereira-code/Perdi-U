import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LostItemEntry } from './LostItemEntry';

describe('Opción "Perdí un objeto"', () => {
  it('muestra la opción "Perdí un objeto"', () => {
    render(<LostItemEntry onClick={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Perdí un objeto' })).toBeInTheDocument();
  });

  it('avisa cuando el usuario la elige', async () => {
    const onClick = jest.fn();
    render(<LostItemEntry onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Perdí un objeto' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});