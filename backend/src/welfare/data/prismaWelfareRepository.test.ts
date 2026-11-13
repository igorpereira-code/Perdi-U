import { db } from '../../core/data/prisma';
import { prismaWelfareRepository } from './prismaWelfareRepository';

jest.mock('../../core/data/prisma');

it('registra un aviso para el hallador al recibir su objeto', async () => {
  const transaction = {
    foundItem: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ finderId: 'finder-1', code: 'HZ-0005' }),
    },
    notification: { create: jest.fn().mockResolvedValue({}) },
  };
  jest.mocked(db).mockReturnValue({
    ...transaction,
    $transaction: jest.fn((operation) => operation(transaction)),
  } as unknown as ReturnType<typeof db>);

  const received = await prismaWelfareRepository.receivePending('item-1', 'welfare-1', new Date());

  expect(received).toBe(true);
  expect(transaction.notification.create).toHaveBeenCalledWith({
    data: {
      userId: 'finder-1',
      message: 'Bienestar Estudiantil recibió el objeto de tu reporte HZ-0005.',
      link: '/mis-reportes/encontrados/HZ-0005',
    },
  });
});

it('excluye los reportes cancelados de la lista y la búsqueda de Bienestar', async () => {
  const foundItem = {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
  };
  jest.mocked(db).mockReturnValue({ foundItem } as unknown as ReturnType<typeof db>);

  await expect(prismaWelfareRepository.listPending()).resolves.toEqual([]);
  expect(foundItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' },
  }));

  await expect(prismaWelfareRepository.findByCode('HZ-0005')).resolves.toBeNull();
  expect(foundItem.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      code: 'HZ-0005',
      OR: [{ status: { not: 'PENDING_DROP_OFF' } }, { visibility: 'VISIBLE' }],
    },
  }));
});
