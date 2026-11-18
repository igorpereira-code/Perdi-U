import request from 'supertest';
import { createApp } from '../../app';
import { SAMPLE_USERS } from '../../core/sampleUsers';
import type { FoundItemCatalogs, FoundItemsRepository } from '../../finder/data/foundItemsRepository';
import type { ValidLostReport } from '../logic/validateLostReport';
import type {
  EditableLostReport,
  MyLostReport,
  MyLostReportsRepository,
} from '../data/myLostReportsRepository';

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
    findEditable: jest.fn(),
    updateMine: jest.fn(),
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

describe('Ver el detalle de mi reporte (GET /my-lost-reports/:code)', () => {
  it('muestra el detalle de un reporte propio', async () => {
    const myLostReports = fakeReports([keys]);

    const res = await request(createApp({ myLostReports })).get('/my-lost-reports/pr-0007');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ code: 'PR-0007', dateFrom: '2026-10-17', dateTo: '2026-10-18' });
    expect(myLostReports.findMine).toHaveBeenCalledWith(SAMPLE_USERS.ana.id, 'PR-0007');
  });

  it('no muestra un reporte que no existe o que es de otra persona', async () => {
    const myLostReports = fakeReports([]);

    const res = await request(createApp({ myLostReports })).get('/my-lost-reports/PR-0001');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este reporte.' });
  });
});

const catalogs: FoundItemCatalogs = {
  categories: [
    { id: 47, name: 'Llaves' },
    { id: 48, name: 'Electrónicos' },
  ],
  places: [
    { id: 83, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 216, name: 'Aula A-12' }] },
    { id: 98, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
  ],
};
const foundItems = { getCatalogs: jest.fn().mockResolvedValue(catalogs) } as unknown as FoundItemsRepository;

const editableKeys: EditableLostReport = {
  description: 'Llaves con llavero azul',
  categoryId: 47,
  places: [
    { placeId: 83, classroomId: 216 },
    { placeId: 98, classroomId: null },
  ],
  placeDescription: 'Fui de la biblioteca al bloque A',
  dateFrom: new Date('2026-10-17T00:00:00.000Z'),
  dateTo: new Date('2026-10-18T00:00:00.000Z'),
};

const changes = {
  description: 'Llaves con llavero rojo',
  categoryId: 47,
  places: [{ placeId: 98, classroomId: null }],
  placeDescription: null,
  dateFrom: '2026-10-16',
  dateTo: '2026-10-18',
};

/** Only Ana owns PR-0007. */
function editableReports(): jest.Mocked<MyLostReportsRepository> {
  const isAnasKeys = (ownerId: string, code: string) =>
    ownerId === SAMPLE_USERS.ana.id && code === 'PR-0007';
  return {
    listMine: jest.fn(),
    findMine: jest.fn(),
    findEditable: jest.fn(async (ownerId: string, code: string) =>
      isAnasKeys(ownerId, code) ? editableKeys : null,
    ),
    updateMine: jest.fn(async (ownerId: string, code: string, _changes: ValidLostReport) =>
      isAnasKeys(ownerId, code),
    ),
  };
}

describe('Editar un reporte de pérdida (GET /my-lost-reports/:code/edit, PATCH /my-lost-reports/:code)', () => {
  it('devuelve los datos del reporte como los llena el formulario', async () => {
    const myLostReports = editableReports();

    const res = await request(createApp({ myLostReports, foundItems })).get(
      '/my-lost-reports/PR-0007/edit',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      description: 'Llaves con llavero azul',
      categoryId: 47,
      places: [
        { placeId: 83, classroomId: 216 },
        { placeId: 98, classroomId: null },
      ],
      placeDescription: 'Fui de la biblioteca al bloque A',
      dateFrom: '2026-10-17',
      dateTo: '2026-10-18',
    });
    expect(myLostReports.findEditable).toHaveBeenCalledWith(SAMPLE_USERS.ana.id, 'PR-0007');
  });

  it('no deja abrir para editar el reporte de otra persona', async () => {
    const myLostReports = editableReports();

    const res = await request(createApp({ myLostReports, foundItems }))
      .get('/my-lost-reports/PR-0007/edit')
      .set('x-sample-user', 'luis');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este reporte.' });
    expect(myLostReports.findEditable).toHaveBeenCalledWith(SAMPLE_USERS.luis.id, 'PR-0007');
  });

  it('guarda los cambios validados del reporte', async () => {
    const myLostReports = editableReports();

    const res = await request(createApp({ myLostReports, foundItems }))
      .patch('/my-lost-reports/PR-0007')
      .send(changes);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: true });
    expect(myLostReports.updateMine).toHaveBeenCalledWith(SAMPLE_USERS.ana.id, 'PR-0007', {
      description: 'Llaves con llavero rojo',
      categoryId: 47,
      places: [{ placeId: 98, classroomId: null }],
      placeDescription: null,
      dateFrom: new Date('2026-10-16T00:00:00.000Z'),
      dateTo: new Date('2026-10-18T00:00:00.000Z'),
    });
  });

  it('no guarda los cambios si los datos no son válidos', async () => {
    const myLostReports = editableReports();

    const res = await request(createApp({ myLostReports, foundItems }))
      .patch('/my-lost-reports/PR-0007')
      .send({ ...changes, description: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Revisa los datos del reporte.');
    expect(myLostReports.updateMine).not.toHaveBeenCalled();
  });

  it('no guarda cambios en el reporte de otra persona', async () => {
    const myLostReports = editableReports();

    const res = await request(createApp({ myLostReports, foundItems }))
      .patch('/my-lost-reports/PR-0007')
      .set('x-sample-user', 'luis')
      .send(changes);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este reporte.' });
  });
});
