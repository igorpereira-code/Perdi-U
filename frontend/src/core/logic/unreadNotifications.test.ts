import type { AppNotification } from '@shared/notifications';
import { countUnread, unreadBadgeText } from './unreadNotifications';

function notification(id: string, readAt: string | null): AppNotification {
  return { id, message: 'Aviso', link: null, createdAt: '2026-11-06T14:00:00.000Z', readAt };
}

describe('Cantidad de avisos nuevos', () => {
  it('cuenta solo los avisos que todavía no abrió', () => {
    const notifications = [
      notification('aviso-1', null),
      notification('aviso-2', '2026-11-06T15:00:00.000Z'),
      notification('aviso-3', null),
    ];

    expect(countUnread(notifications)).toBe(2);
  });

  it('no tiene avisos nuevos si no tiene avisos', () => {
    expect(countUnread([])).toBe(0);
  });

  it('no tiene avisos nuevos si ya abrió todos', () => {
    expect(countUnread([notification('aviso-1', '2026-11-06T15:00:00.000Z')])).toBe(0);
  });
});

describe('Número que se muestra junto a la opción de avisos', () => {
  it('no muestra número si no hay avisos nuevos', () => {
    expect(unreadBadgeText(0)).toBeNull();
  });

  it.each([
    [1, '1'],
    [9, '9'],
  ])('muestra la cantidad exacta de avisos nuevos (%i)', (count, text) => {
    expect(unreadBadgeText(count)).toBe(text);
  });

  it('muestra 9+ cuando hay más de 9 avisos nuevos', () => {
    expect(unreadBadgeText(10)).toBe('9+');
    expect(unreadBadgeText(25)).toBe('9+');
  });
});
