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
    foundItem.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    lostReport.count.mockResolvedValue(9);
    delivery.count.mockResolvedValue(4);

    await expect(prismaStatisticsRepository.countUsage()).resolves.toEqual({
      foundItems: 12,
      lostReports: 9,
      deliveredItems: 4,
      unclaimedItems: 3,
    });
  });

  it('sin rango de fechas cuenta todo', async () => {
    await prismaStatisticsRepository.countUsage();

    expect(foundItem.count).toHaveBeenCalledWith({ where: { createdAt: undefined } });
    expect(lostReport.count).toHaveBeenCalledWith({ where: { createdAt: undefined } });
    expect(delivery.count).toHaveBeenCalledWith({ where: { deliveredAt: undefined } });
  });

  it('con un rango, cuenta solo lo reportado y entregado en esos días', async () => {
    const time = {
      gte: new Date('2026-11-01T04:00:00.000Z'),
      lt: new Date('2026-12-01T04:00:00.000Z'),
    };

    await prismaStatisticsRepository.countUsage({ from: '2026-11-01', to: '2026-11-30' });

    expect(foundItem.count).toHaveBeenCalledWith({ where: { createdAt: time } });
    expect(lostReport.count).toHaveBeenCalledWith({ where: { createdAt: time } });
    expect(delivery.count).toHaveBeenCalledWith({ where: { deliveredAt: time } });
  });

  it('cuenta los objetos en custodia que nadie reclamó, sin importar las fechas', async () => {
    await prismaStatisticsRepository.countUsage({ from: '2026-11-01', to: '2026-11-30' });

    expect(foundItem.count).toHaveBeenCalledWith({
      where: {
        status: { in: ['IN_CUSTODY', 'PUBLISHED'] },
        matches: { none: { status: 'WILL_PICK_UP' } },
      },
    });
  });
});
