import { render, screen } from '@testing-library/react';
import type { AppUser } from '@shared/user';
import { ProfilePage } from './ProfilePage';

const igor: AppUser = {
  id: 'google-1',
  name: 'Igor Pereira',
  email: 'igor.pereira@ucb.edu.bo',
  photoUrl: 'https://foto.com/igor.jpg',
  role: 'COMMUNITY',
};

describe('Mi perfil', () => {
  it('muestra el nombre, el correo y la foto de su cuenta de Google', () => {
    render(<ProfilePage user={igor} />);

    expect(screen.getByRole('heading', { name: 'Igor Pereira' })).toBeInTheDocument();
    expect(screen.getByText('igor.pereira@ucb.edu.bo')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto de perfil' })).toHaveAttribute(
      'src',
      'https://foto.com/igor.jpg',
    );
  });

  it('muestra la inicial de su nombre cuando no tiene foto', () => {
    render(<ProfilePage user={{ ...igor, photoUrl: null }} />);

    expect(screen.getByRole('img', { name: 'Foto de perfil' })).toHaveTextContent('I');
  });
});
