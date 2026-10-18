import { render, screen, fireEvent } from '@testing-library/react';
import { FoundObjectDetailPage } from './FoundObjectDetailPage';

describe('FoundObjectDetailPage', () => {
  const sampleObject = {
    id: '1',
    code: 'EN-0001',
    description: 'Mochila negra con tirantes acolchados y llavero',
    category: 'Mochilas y bolsos',
    place: 'Biblioteca - 2do piso',
    foundDate: '2026-10-17',
    photoUrl: 'https://example.com/mochila.jpg',
  };

  it('muestra la foto, descripción, categoría, lugar, fecha y código del objeto', () => {
    render(<FoundObjectDetailPage object={sampleObject} onBack={() => {}} />);

    expect(screen.getByText('EN-0001')).toBeInTheDocument();
    expect(screen.getByText('Mochila negra con tirantes acolchados y llavero')).toBeInTheDocument();
    expect(screen.getByText('Mochilas y bolsos')).toBeInTheDocument();
    expect(screen.getByText('Biblioteca - 2do piso')).toBeInTheDocument();
    expect(screen.getByText('2026-10-17')).toBeInTheDocument();

    const image = screen.getByRole('img', { name: /mochila negra/i });
    expect(image).toHaveAttribute('src', 'https://example.com/mochila.jpg');
  });

  it('permite regresar a la vista anterior', () => {
    const onBack = jest.fn();
    render(<FoundObjectDetailPage object={sampleObject} onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: /volver|atrás/i });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});