import { canBePublished } from './canBePublished';

describe('Qué objetos se pueden publicar', () => {
  it('solo se publica un objeto que Bienestar ya recibió', () => {
    expect(canBePublished('IN_CUSTODY')).toBe(true);
    expect(canBePublished('PENDING_DROP_OFF')).toBe(false);
    expect(canBePublished('PUBLISHED')).toBe(false);
    expect(canBePublished('DELIVERED')).toBe(false);
  });
});
