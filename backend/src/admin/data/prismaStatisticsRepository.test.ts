import { db } from '../../core/data/prisma';
import { prismaStatisticsRepository } from './prismaStatisticsRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const foundItem = { count: jest.fn() };
const lostReport = { count: jest.fn() };
const delivery = { count: jest.fn() };

beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(db)
    .mockReturnValue({ foundItem, lostReport, delivery } as unknown as ReturnType<typeof db>);
});

describe('Estadísticas leídas de la base de datos', () => {
  it('cuenta los objetos encontrados, los perdidos y los entregados', async () => {
    foundItem.count.mockResolvedValue(12);
    lostReport.count.mockResolvedValue(9);
    delivery.count.mockResolvedValue(4);

    await expect(prismaStatisticsRepository.countUsage()).resolves.toEqual({
      foundItems: 12,
      lostReports: 9,
      deliveredItems: 4,
    });
  });
});
