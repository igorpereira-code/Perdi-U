import request from 'supertest';
import type { UsageStatistics } from '@shared/statistics';
import type { Role } from '@shared/user';
import { createApp } from '../../app';
import type { UsersRepository } from '../../core/data/usersRepository';
import type { StatisticsRepository } from '../data/statisticsRepository';

const usage: UsageStatistics = { foundItems: 12, lostReports: 9, deliveredItems: 4 };

/** Signs in with a user of the given role. */
function setup(signedInRole: Role, statistics: Partial<StatisticsRepository> = {}) {
  const signedInUser = {
    id: 'usuario-sesion',
    name: 'Igor Pereira',
    email: 'igor.pereira@ucb.edu.bo',
    photoUrl: null,
    role: signedInRole,
    hasSeenGuide: true,
  };
  const users: UsersRepository = {
    findById: async () => signedInUser,
    create: async (profile) => ({ ...profile, hasSeenGuide: false }),
    listWelfareEmails: async () => [],
    markGuideSeen: async () => undefined,
  };
  return createApp({
    users,
    verifyToken: async () => signedInUser,
    allowSampleUsers: false,
    statistics: { countUsage: async () => usage, ...statistics },
  });
}

const getStatistics = (app: ReturnType<typeof createApp>) =>
  request(app).get('/admin/statistics').auth('token', { type: 'bearer' });

describe('Ver cuántos objetos se encontraron, perdieron y entregaron', () => {
  it('el Administrador ve las cantidades', async () => {
    const response = await getStatistics(setup('ADMIN'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ foundItems: 12, lostReports: 9, deliveredItems: 4 });
  });

  it.each(['COMMUNITY', 'WELFARE'] as const)(
    'un usuario %s no puede ver las estadísticas',
    async (role) => {
      const response = await getStatistics(setup(role));

      expect(response.status).toBe(403);
    },
  );

  it('informa con un mensaje claro si no se pudieron cargar', async () => {
    const app = setup('ADMIN', {
      countUsage: async () => {
        throw new Error('Base no disponible');
      },
    });

    const response = await getStatistics(app);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'No se pudieron cargar las estadísticas. Intenta nuevamente.',
    });
  });
});
