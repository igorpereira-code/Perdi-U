import { db } from '../../core/data/prisma';
import { prismaWelfareRepository } from './prismaWelfareRepository';

jest.mock('../../core/data/prisma');

it('registra un aviso para el hallador al recibir su objeto', async () => {
  const transaction = {
    foundItem: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'item-1',
        code: 'HZ-0005',
        description: 'Llaves',
        photoUrl: null,
        placeReference: null,
        foundAt: new Date('2026-11-10T12:00:00Z'),
        status: 'IN_CUSTODY',
        visibility: 'VISIBLE',
        receivedById: 'welfare-1',
        receivedAt: new Date('2026-11-11T12:00:00Z'),
        finderId: 'finder-1',
        category: { name: 'Llaves' },
        categoryId: 1,
        place: { name: 'Bloque A' },
        placeId: 1,
        classroom: null,
        classroomId: null,
        finder: { name: 'Ana', email: 'ana@ucb.edu.bo' },
      }),
    },
    notification: { create: jest.fn().mockResolvedValue({}) },
  };
  jest.mocked(db).mockReturnValue({
    ...transaction,
    $transaction: jest.fn((operation) => operation(transaction)),
  } as unknown as ReturnType<typeof db>);

  const received = await prismaWelfareRepository.confirmPendingReception(
    'item-1',
    'welfare-1',
    new Date(),
  );

  expect(received).toEqual(expect.objectContaining({ code: 'HZ-0005', status: 'IN_CUSTODY' }));
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
  expect(foundItem.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' },
    }),
  );

  await expect(prismaWelfareRepository.findFoundItemByCode('HZ-0005')).resolves.toBeNull();
  expect(foundItem.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        code: 'HZ-0005',
        OR: [{ status: { not: 'PENDING_DROP_OFF' } }, { visibility: 'VISIBLE' }],
      },
    }),
  );
});

describe('Aviso al dueño cuando Bienestar registra la entrega de su objeto', () => {
  function mockDelivery({
    foundItem = { id: 'item-3', code: 'HZ-0003' } as object | null,
    recipient = { id: 'owner-1' } as object | null,
  } = {}) {
    const transaction = {
      foundItem: { findFirst: jest.fn().mockResolvedValue(foundItem), update: jest.fn() },
      lostReport: { findFirst: jest.fn().mockResolvedValue({ id: 'report-1' }), update: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue(recipient) },
      delivery: { create: jest.fn() },
      notification: { create: jest.fn() },
    };
    jest.mocked(db).mockReturnValue({
      $transaction: jest.fn((operation) => operation(transaction)),
    } as unknown as ReturnType<typeof db>);
    return transaction;
  }

  const delivery = {
    foundItemCode: 'HZ-0003',
    lostReportCode: 'PR-0001',
    recipientName: 'Ana Rojas',
    recipientEmail: 'ana.rojas@ucb.edu.bo',
    recipientUniversityCode: '20205678',
    registeredById: 'welfare-1',
    deliveredAt: new Date('2026-11-18T15:00:00Z'),
  };

  it('avisa al dueño que su objeto fue entregado y su reporte quedó recuperado', async () => {
    const transaction = mockDelivery();

    await expect(prismaWelfareRepository.deliver(delivery)).resolves.toEqual({
      status: 'DELIVERED',
      foundItemCode: 'HZ-0003',
    });
    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        message:
          'Bienestar Estudiantil registró la entrega de tu objeto HZ-0003. Tu reporte PR-0001 quedó como recuperado.',
        link: '/mis-perdidas/PR-0001',
      },
    });
  });

  it('también avisa cuando la entrega no tiene reporte', async () => {
    const transaction = mockDelivery();

    await prismaWelfareRepository.deliver({ ...delivery, lostReportCode: null });

    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        message: 'Bienestar Estudiantil registró la entrega de tu objeto HZ-0003.',
        link: null,
      },
    });
  });

  it('no avisa a nadie si quien recibe no tiene cuenta en la app', async () => {
    const transaction = mockDelivery({ recipient: null });

    await expect(prismaWelfareRepository.deliver(delivery)).resolves.toEqual({
      status: 'DELIVERED',
      foundItemCode: 'HZ-0003',
    });
    expect(transaction.notification.create).not.toHaveBeenCalled();
  });

  it('no avisa si la entrega no se pudo registrar', async () => {
    const transaction = mockDelivery({ foundItem: null });

    await expect(prismaWelfareRepository.deliver(delivery)).resolves.toEqual({
      status: 'ITEM_NOT_AVAILABLE',
    });
    expect(transaction.notification.create).not.toHaveBeenCalled();
  });
});
