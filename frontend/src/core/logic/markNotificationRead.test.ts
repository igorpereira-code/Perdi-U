import type { AppNotification } from '@shared/notifications';
import { markNotificationRead } from './markNotificationRead';
import { countUnread } from './unreadNotifications';

const unread = (id: string): AppNotification => ({
  id,
  message: 'Aviso',
  link: null,
  createdAt: '2026-11-06T14:00:00.000Z',
  readAt: null,
});

describe('Avisos nuevos después de abrir uno', () => {
  it('el aviso abierto deja de contarse como nuevo', () => {
    const notifications = [unread('aviso-1'), unread('aviso-2')];

    const after = markNotificationRead(
      notifications,
      'aviso-1',
      new Date('2026-11-06T15:00:00.000Z'),
    );

    expect(countUnread(after)).toBe(1);
    expect(after[0].readAt).toBe('2026-11-06T15:00:00.000Z');
    expect(after[1].readAt).toBeNull();
  });

  it('conserva la primera vez que se abrió un aviso', () => {
    const opened = { ...unread('aviso-1'), readAt: '2026-11-06T14:30:00.000Z' };

    const after = markNotificationRead([opened], 'aviso-1', new Date('2026-11-06T15:00:00.000Z'));

    expect(after[0].readAt).toBe('2026-11-06T14:30:00.000Z');
  });
});
