import { KeyRound, Package, Smartphone } from 'lucide-react';
import { getCategoryIcon } from './CategoryIcon';

describe('Ícono de cada categoría', () => {
  it('muestra el ícono que corresponde a la categoría', () => {
    expect(getCategoryIcon('Llaves')).toBe(KeyRound);
    expect(getCategoryIcon('Electrónicos')).toBe(Smartphone);
  });

  it('muestra un paquete cuando la categoría no tiene ícono propio', () => {
    expect(getCategoryIcon('Paraguas')).toBe(Package);
  });
});
