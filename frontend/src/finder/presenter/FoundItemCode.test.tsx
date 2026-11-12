import { render, screen, within } from '@testing-library/react';
import { FoundItemCode } from './FoundItemCode';

describe('Código para entregar un objeto encontrado', () => {
  it('agrupa el código real del reporte y la instrucción exacta de presentación en Bienestar', () => {
    render(<FoundItemCode code="HZ-7325" />);

    const group = screen.getByRole('group', { name: 'Código para entregar el objeto' });
    expect(within(group).getByText('HZ-7325')).toBeInTheDocument();
    expect(within(group).getByText('Muestra este código en Bienestar Estudiantil cuando entregues el objeto')).toBeInTheDocument();
  });
});
