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
it('muestra los cuatro pasos para recuperar un objeto encontrado', () => {
  render(<QuickGuide onSkip={() => {}} />);

  expect(screen.getByText('Encuentra el objeto')).toBeInTheDocument();
  expect(screen.getByText('Reporta el hallazgo')).toBeInTheDocument();
  expect(screen.getByText('Lleva el objeto a Bienestar Estudiantil')).toBeInTheDocument();
  expect(screen.getByText('El dueño lo recoge en Bienestar')).toBeInTheDocument();
});
});