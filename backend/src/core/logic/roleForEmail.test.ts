import { getRoleForEmail } from './roleForEmail';

describe('Rol de un perfil nuevo', () => {
  const welfareEmails = ['bienestar@ucb.edu.bo'];

  it('da el rol de Bienestar a los correos registrados como Bienestar', () => {
    expect(getRoleForEmail('bienestar@ucb.edu.bo', welfareEmails)).toBe('WELFARE');
    expect(getRoleForEmail('Bienestar@UCB.edu.bo', welfareEmails)).toBe('WELFARE');
  });

  it('da el rol de comunidad a todos los demás', () => {
    expect(getRoleForEmail('igor.pereira@ucb.edu.bo', welfareEmails)).toBe('COMMUNITY');
  });
});
