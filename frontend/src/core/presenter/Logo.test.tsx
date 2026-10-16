import { render, screen } from '@testing-library/react';
import { APP_NAME } from '@shared/constants';
import { Logo } from './Logo';

describe('Logo', () => {
  it('muestra el nombre de la app', () => {
    render(<Logo />);

    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
  });
});
