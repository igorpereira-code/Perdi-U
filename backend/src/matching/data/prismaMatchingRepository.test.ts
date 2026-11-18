import { db } from '../../core/data/prisma';
import { prismaMatchingRepository } from './prismaMatchingRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const foundItemFindMany = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  foundItemFindMany.mockResolvedValue([]);
  jest.mocked(db).mockReturnValue({
    foundItem: { findMany: foundItemFindMany },
  } as unknown as ReturnType<typeof db>);
});

describe('Objetos publicados disponibles para coincidencias', () => {
  it('incluye objetos visibles y ocultos mientras sigan publicados', async () => {
    await prismaMatchingRepository.listPublishedItems();

    expect(foundItemFindMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        categoryId: true,
        foundAt: true,
        placeId: true,
        description: true,
      },
    });
  });
});

describe('Estado del reporte, para no tratar un reporte cerrado como activo', () => {
  it('el reporte propio incluye su estado', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'report-1',
      code: 'PR-0001',
      ownerId: 'owner-1',
      categoryId: 1,
      dateFrom: new Date('2026-10-10'),
      dateTo: new Date('2026-10-11'),
      description: 'Celular Samsung',
      status: 'CLOSED',
      places: [{ placeId: 5 }],
    });
    jest.mocked(db).mockReturnValue({ lostReport: { findFirst } } as unknown as ReturnType<typeof db>);

    await expect(prismaMatchingRepository.findOwnLostReport('PR-0001', 'owner-1')).resolves.toEqual(
      expect.objectContaining({ code: 'PR-0001', status: 'CLOSED' }),
    );
  });

  it('la coincidencia propia incluye el estado de su reporte', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'match-1',
      lostReportId: 'report-1',
      lostReport: { code: 'PR-0001', status: 'CLOSED' },
      foundItem: { code: 'HZ-0001' },
    });
    jest.mocked(db).mockReturnValue({ match: { findFirst } } as unknown as ReturnType<typeof db>);

    await expect(prismaMatchingRepository.findOwnMatch('match-1', 'owner-1')).resolves.toEqual({
      id: 'match-1',
      lostReportId: 'report-1',
      lostReportCode: 'PR-0001',
      foundItemCode: 'HZ-0001',
      lostReportStatus: 'CLOSED',
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ lostReport: { select: { code: true, status: true } } }),
      }),
    );
  });
});
