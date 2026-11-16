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
