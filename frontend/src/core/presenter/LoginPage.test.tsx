import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('Pantalla de ingreso', () => {
  it('permite ingresar con la cuenta Google de la universidad', async () => {
    const onGoogleLogin = jest.fn();
    render(<LoginPage onGoogleLogin={onGoogleLogin} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar con Google' }));

    expect(screen.getByText('Usa tu correo @ucb.edu.bo')).toBeInTheDocument();
    expect(onGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it('avisa que solo se permiten cuentas de la universidad', () => {
    render(<LoginPage onGoogleLogin={jest.fn()} notInstitutional />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo se permiten cuentas institucionales (@ucb.edu.bo).',
    );
  });
});
