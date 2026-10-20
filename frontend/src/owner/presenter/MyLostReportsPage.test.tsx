import { render, screen } from '@testing-library/react';
import { MyLostReportsPage } from './MyLostReportsPage';

describe('MyLostReportsPage', () => {
  it('muestra todos los reportes de pérdida del usuario', () => {
    const mockReports = [
      {
        id: '1',
        code: 'PR-0001',
        description: 'Mochila negra con llavero',
        status: 'SEARCHING',
      },
      {
        id: '2',
        code: 'PR-0002',
        description: 'Termo metálico azul',
        status: 'RECOVERED',
      },
    ];

    render(<MyLostReportsPage reports={mockReports} onBack={() => {}} />);

    expect(screen.getByText('Mis reportes de pérdida')).toBeInTheDocument();
    expect(screen.getByText('Mochila negra con llavero')).toBeInTheDocument();
    expect(screen.getByText('Termo metálico azul')).toBeInTheDocument();
  });
});