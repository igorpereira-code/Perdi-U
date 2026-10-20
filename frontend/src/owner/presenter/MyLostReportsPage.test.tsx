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

it('muestra el código y el estado visual de cada reporte', () => {
    const mockReports = [
      { id: '1', code: 'PR-0001', description: 'Mochila negra', status: 'SEARCHING' },
      { id: '2', code: 'PR-0002', description: 'Llaves', status: 'WITH_MATCHES' },
      { id: '3', code: 'PR-0003', description: 'Cuaderno', status: 'PENDING_PICKUP' },
      { id: '4', code: 'PR-0004', description: 'Termo', status: 'RECOVERED' },
    ];

    render(<MyLostReportsPage reports={mockReports} onBack={() => {}} />);

    // Verifica códigos
    expect(screen.getByText('PR-0001')).toBeInTheDocument();
    expect(screen.getByText('PR-0004')).toBeInTheDocument();

    // Verifica estados traducidos
    expect(screen.getByText(/buscando/i)).toBeInTheDocument();
    expect(screen.getByText(/con coincidencias/i)).toBeInTheDocument();
    expect(screen.getByText(/pendiente de recojo/i)).toBeInTheDocument();
    expect(screen.getByText(/recuperado/i)).toBeInTheDocument();
  });






});