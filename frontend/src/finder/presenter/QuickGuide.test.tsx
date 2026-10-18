import { render, screen, fireEvent } from '@testing-library/react';
import { QuickGuide } from './QuickGuide';

describe('Guía rápida de Perdi-U', () => {
  it('explica que los objetos encontrados se entregan a Bienestar', () => {
    render(<QuickGuide onSkip={() => {}} />);

    expect(
      screen.getByText(/bienestar universitario/i),
    ).toBeInTheDocument();
  });
  it('permite saltar la guía rápida', () => {
  const onSkip = jest.fn();

  render(<QuickGuide onSkip={onSkip} />);

  const boton = screen.getByRole('button', {
    name: /saltar guía/i,
  });

  fireEvent.click(boton);

  expect(onSkip).toHaveBeenCalledTimes(1);
});
});