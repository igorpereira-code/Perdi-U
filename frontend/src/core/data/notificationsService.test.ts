import type { AppNotification } from '@shared/notifications';
import type { ApiFetch } from './api';
import { createNotificationsService } from './notificationsService';

const received: AppNotification = {
  id: 'aviso-1',
  message: 'Bienestar recibió tu objeto HZ-0001.',
  link: '/mis-reportes/encontrados/HZ-0001',
  createdAt: '2026-11-06T14:00:00.000Z',
  readAt: null,
};

function answer(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Consultar mis avisos', () => {
  it('trae mis avisos del backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(200, [received]));

    await expect(createNotificationsService(apiFetch as ApiFetch).list()).resolves.toEqual([
      received,
    ]);
    expect(apiFetch).toHaveBeenCalledWith('/me/notifications');
  });

  it('avisa con un mensaje claro si no se pudieron cargar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(createNotificationsService(apiFetch as ApiFetch).list()).rejects.toThrow(
      'No se pudieron cargar tus avisos. Intenta nuevamente.',
    );
  });
});
describe('Marcar un aviso como abierto', () => {
  it('avisa al backend qué aviso abrió', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(204, null));

    await createNotificationsService(apiFetch as ApiFetch).markRead('aviso-1');

    expect(apiFetch).toHaveBeenCalledWith('/me/notifications/aviso-1/read', { method: 'POST' });
  });

  it('avisa con un mensaje claro si no se pudo marcar', async () => {
    const apiFetch = jest.fn().mockResolvedValue(answer(503, { error: 'Detalle' }));

    await expect(
      createNotificationsService(apiFetch as ApiFetch).markRead('aviso-1'),
    ).rejects.toThrow('No se pudo marcar el aviso como leído.');
  });
});
