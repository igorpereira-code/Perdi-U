import { db } from '../../core/data/prisma';
import type { ValidLostReport } from '../logic/validateLostReport';
import { prismaMyLostReportsRepository } from './prismaMyLostReportsRepository';

// Datos simulados: ninguna prueba consulta ni escribe en Supabase.
jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const changes: ValidLostReport = {
  description: 'Llaves con llavero rojo',
  categoryId: 47,
  places: [{ placeId: 98, classroomId: null }],
  placeDescription: null,
  dateFrom: new Date('2026-10-16T00:00:00.000Z'),
  dateTo: new Date('2026-10-18T00:00:00.000Z'),
};

function mockDatabase(report: { id: string } | null, remainingMatches = 0) {
  const transaction = {
    lostReport: {
      findFirst: jest.fn().mockResolvedValue(report),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    lostReportPlace: { deleteMany: jest.fn() },
    match: { deleteMany: jest.fn(), count: jest.fn().mockResolvedValue(remainingMatches) },
  };
  jest.mocked(db).mockReturnValue({
    $transaction: jest.fn((operation) => operation(transaction)),
  } as unknown as ReturnType<typeof db>);
  return transaction;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('Coincidencias actualizadas al editar un reporte de pérdida', () => {
  it('al guardar los cambios quita las coincidencias sugeridas sin responder, para recalcularlas', async () => {
    const transaction = mockDatabase({ id: 'report-1' });

    await expect(
      prismaMyLostReportsRepository.updateMine('owner-1', 'PR-0007', changes),
    ).resolves.toBe(true);

    expect(transaction.match.deleteMany).toHaveBeenCalledWith({
      where: { lostReportId: 'report-1', status: 'SUGGESTED' },
    });
  });

  it('si ya no le quedan coincidencias por revisar, el reporte vuelve a estar buscando', async () => {
    const transaction = mockDatabase({ id: 'report-1' });

    await prismaMyLostReportsRepository.updateMine('owner-1', 'PR-0007', changes);

    expect(transaction.lostReport.updateMany).toHaveBeenCalledWith({
      where: { id: 'report-1', status: 'HAS_MATCHES' },
      data: { status: 'SEARCHING' },
    });
  });

  it('si tiene un objeto que pasará a recoger, conserva esa coincidencia y su estado', async () => {
    const transaction = mockDatabase({ id: 'report-1' }, 1);

    await prismaMyLostReportsRepository.updateMine('owner-1', 'PR-0007', changes);

    expect(transaction.match.deleteMany).toHaveBeenCalledWith({
      where: { lostReportId: 'report-1', status: 'SUGGESTED' },
    });
    expect(transaction.lostReport.updateMany).not.toHaveBeenCalled();
  });

  it('no toca ninguna coincidencia si el reporte no es suyo', async () => {
    const transaction = mockDatabase(null);

    await expect(
      prismaMyLostReportsRepository.updateMine('owner-2', 'PR-0007', changes),
    ).resolves.toBe(false);

    expect(transaction.match.deleteMany).not.toHaveBeenCalled();
    expect(transaction.lostReport.update).not.toHaveBeenCalled();
  });
});
