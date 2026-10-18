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

  it('muestra los últimos objetos publicados en la pantalla de inicio', () => {
    const mockObjects = [
      {
        id: '1',
        code: 'EN-0001',
        description: 'Mochila negra con llavero',
        category: 'Mochilas y bolsos',
        place: 'Biblioteca',
        foundDate: '2026-10-17',
      },
      {
        id: '2',
        code: 'EN-0002',
        description: 'Termo metálico azul',
        category: 'Botellas y termos',
        place: 'Bloque A',
        foundDate: '2026-10-18',
      },
    ];

    render(
      <HomeScreen
        onNavigateToLost={() => {}}
        onNavigateToFound={() => {}}
        recentFoundObjects={mockObjects}
      />,
    );

    expect(screen.getByText(/últimos objetos publicados/i)).toBeInTheDocument();
    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.getByText('Termo metálico azul')).toBeInTheDocument();
  });


  it('permite buscar objetos escribiendo palabras clave como "mochila negra"', () => {
    const mockObjects = [
      {
        id: '1',
        code: 'EN-0001',
        description: 'Mochila negra con llavero',
        category: 'Mochilas y bolsos',
        place: 'Biblioteca',
        foundDate: '2026-10-17',
      },
      {
        id: '2',
        code: 'EN-0002',
        description: 'Termo metálico azul',
        category: 'Botellas y termos',
        place: 'Bloque A',
        foundDate: '2026-10-18',
      },
    ];

    render(
      <HomeScreen
        onNavigateToLost={() => {}}
        onNavigateToFound={() => {}}
        recentFoundObjects={mockObjects}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/buscar objetos.*mochila negra/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'mochila negra' } });

    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.queryByText('Termo metálico azul')).not.toBeInTheDocument();
  });

it('permite filtrar los objetos por categoría', () => {
    const mockObjects = [
      {
        id: '1',
        code: 'EN-0001',
        description: 'Mochila negra con llavero',
        category: 'Mochilas y bolsos',
        place: 'Biblioteca',
        foundDate: '2026-10-17',
      },
      {
        id: '2',
        code: 'EN-0002',
        description: 'Termo metálico azul',
        category: 'Botellas y termos',
        place: 'Bloque A',
        foundDate: '2026-10-18',
      },
    ];

    render(
      <HomeScreen
        onNavigateToLost={() => {}}
        onNavigateToFound={() => {}}
        recentFoundObjects={mockObjects}
      />,
    );

    const categorySelect = screen.getByLabelText(/filtrar por categoría/i);
    expect(categorySelect).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: 'Botellas y termos' } });

    expect(screen.getByText('Termo metálico azul')).toBeInTheDocument();
    expect(screen.queryByText('Mochila negra con llavero')).not.toBeInTheDocument();
  });






});