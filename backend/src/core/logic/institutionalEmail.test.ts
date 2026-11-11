import { isInstitutionalEmail } from './institutionalEmail';

describe('Correo institucional', () => {
  it('reconoce los correos de la universidad', () => {
    expect(isInstitutionalEmail('igor.pereira@ucb.edu.bo')).toBe(true);
    expect(isInstitutionalEmail('Igor.Pereira@UCB.EDU.BO')).toBe(true);
  });

  it('no acepta correos de otros lugares', () => {
    expect(isInstitutionalEmail('igor@gmail.com')).toBe(false);
    expect(isInstitutionalEmail('igor@ucb.edu.bo.falso.com')).toBe(false);
    expect(isInstitutionalEmail('igor@noucb.edu.bo')).toBe(false);
  });
});
