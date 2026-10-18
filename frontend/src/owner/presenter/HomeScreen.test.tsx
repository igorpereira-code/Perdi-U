import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('muestra la opción para reportar que perdí un objeto', () => {
    render(<HomeScreen onNavigateToLost={() => {}} onNavigateToFound={() => {}} />);

    const lostButton = screen.getByRole('button', { name: /perdí un objeto/i });
    expect(lostButton).toBeInTheDocument();
  });
});