import { formatRoleLabel } from './formatRoleLabel';

describe('Nombre del rol', () => {
  it.each([
    ['COMMUNITY', 'Comunidad'],
    ['WELFARE', 'Bienestar'],
    ['ADMIN', 'Administrador'],
  ] as const)('muestra el rol %s como "%s"', (role, label) => {
    expect(formatRoleLabel(role)).toBe(label);
  });
});
