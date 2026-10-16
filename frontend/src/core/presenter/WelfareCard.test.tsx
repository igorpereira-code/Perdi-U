import { render, screen } from '@testing-library/react';
import { WELFARE_OFFICE } from '@shared/constants';
import { WelfareCard } from './WelfareCard';

describe('Tarjeta de Bienestar', () => {
  it('indica al usuario dónde y cuándo acudir a Bienestar Estudiantil', () => {
    render(<WelfareCard />);

    expect(screen.getByText(WELFARE_OFFICE.place)).toBeInTheDocument();
    expect(screen.getByText(WELFARE_OFFICE.hours)).toBeInTheDocument();
  });
});
