import { render, screen, fireEvent } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('muestra la opción para reportar que perdí un objeto', () => {
    render(<HomeScreen onNavigateToLost={() => {}} onNavigateToFound={() => {}} />);

    const lostButton = screen.getByRole('button', { name: /perdí un objeto/i });
    expect(lostButton).toBeInTheDocument();
  });

  it('llama a la navegación al presionar el botón de perdí un objeto', () => {
    const onNavigateToLost = jest.fn();
    render(<HomeScreen onNavigateToLost={onNavigateToLost} onNavigateToFound={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /perdí un objeto/i }));
    expect(onNavigateToLost).toHaveBeenCalledTimes(1);
  });
});