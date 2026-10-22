import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { MyLostReport, MyLostReportsRepository } from '../data/myLostReportsRepository';

// Datos simulados: ninguna prueba consulta ni escribe en Supabase.
const keys: MyLostReport = {
  code: 'PR-0007',
  description: 'Llaves con llavero azul',
  category: 'Llaves',
  status: 'HAS_MATCHES',
  places: ['Bloque A – Aula A-12', 'Biblioteca'],
  placeDescription: 'Fui de la biblioteca al bloque A',
  dateFrom: new Date('2026-10-17T00:00:00.000Z'),
  dateTo: new Date('2026-10-18T00:00:00.000Z'),
};

function fakeReports(reports: MyLostReport[]): jest.Mocked<MyLostReportsRepository> {
  return {
    listMine: jest.fn().mockResolvedValue(reports),
    findMine: jest.fn(async (_ownerId: string, code: string) => reports.find((report) => report.code === code) ?? null),
  };
}

describe('Ver mis reportes de pérdida (GET /my-lost-reports)', () => {
  it('devuelve solo los reportes de quien inició sesión', async () => {
    const myLostReports = fakeReports([keys]);

    const res = await request(createApp({ myLostReports })).get('/my-lost-reports');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        code: 'PR-0007',
        description: 'Llaves con llavero azul',
        category: 'Llaves',
        status: 'HAS_MATCHES',
        places: ['Bloque A – Aula A-12', 'Biblioteca'],
        placeDescription: 'Fui de la biblioteca al bloque A',
        dateFrom: '2026-10-17',
        dateTo: '2026-10-18',
      },
    ]);
    expect(myLostReports.listMine).toHaveBeenCalledWith(SAMPLE_USERS.ana.id);
  });

  it('pide iniciar sesión cuando no hay sesión', async () => {
    const myLostReports = fakeReports([keys]);

    const res = await request(createApp({ myLostReports, allowSampleUsers: false })).get('/my-lost-reports');

    expect(res.status).toBe(401);
    expect(myLostReports.listMine).not.toHaveBeenCalled();
  });

  it('responde con un error comprensible si no se pudieron cargar', async () => {
    const myLostReports = fakeReports([]);
    myLostReports.listMine.mockRejectedValue(new Error('Detalle interno de Prisma'));

    const res = await request(createApp({ myLostReports })).get('/my-lost-reports');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudieron cargar tus reportes. Intenta nuevamente.' });
  });
});