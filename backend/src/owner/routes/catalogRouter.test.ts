import request from 'supertest';
import { createApp } from '../../app';
import type { CatalogItem, CatalogRepository } from '../data/catalogRepository';

// Datos simulados: ninguna prueba consulta ni escribe en Supabase.
const backpack: CatalogItem = {
  code: 'HZ-0007',
  description: 'Mochila negra con llavero',
  category: 'Mochilas y bolsos',
  place: 'Bloque A – Aula A-12',
  placeReference: 'Debajo de una silla',
  foundAt: new Date('2026-10-18T12:15:00.000Z'),
  hasPhoto: true,
  status: 'PUBLISHED',
  visibility: 'VISIBLE',
};

function fakeCatalog(items: CatalogItem[]): jest.Mocked<CatalogRepository> {
  return {
    listPublished: jest.fn().mockResolvedValue(items),
    findByCode: jest.fn(async (code: string) => items.find((item) => item.code === code) ?? null),
  };
}

describe('Ver los objetos publicados (GET /catalog)', () => {
  it('muestra los objetos publicados aunque el usuario no tenga reportes de pérdida', async () => {
    const catalog = fakeCatalog([backpack]);

    const res = await request(createApp({ catalog })).get('/catalog');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        code: 'HZ-0007',
        description: 'Mochila negra con llavero',
        category: 'Mochilas y bolsos',
        place: 'Bloque A – Aula A-12',
        placeReference: 'Debajo de una silla',
        foundAt: '2026-10-18T12:15:00.000Z',
        hasPhoto: true,
      },
    ]);
  });

  it('pide iniciar sesión cuando no hay sesión', async () => {
    const catalog = fakeCatalog([backpack]);

    const res = await request(createApp({ catalog, allowSampleUsers: false })).get('/catalog');

    expect(res.status).toBe(401);
    expect(catalog.listPublished).not.toHaveBeenCalled();
  });

  it('responde con un error comprensible si no se pudieron cargar', async () => {
    const catalog = fakeCatalog([]);
    catalog.listPublished.mockRejectedValue(new Error('Detalle interno de Prisma'));

    const res = await request(createApp({ catalog })).get('/catalog');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'No se pudieron cargar los objetos encontrados. Intenta nuevamente.' });
  });
});

describe('Los objetos entregados no aparecen (GET /catalog)', () => {
  it('no muestra los objetos ya entregados ni los ocultos', async () => {
    const delivered: CatalogItem = { ...backpack, code: 'HZ-0008', status: 'DELIVERED', visibility: 'HIDDEN' };
    const hidden: CatalogItem = { ...backpack, code: 'HZ-0009', visibility: 'HIDDEN' };
    const inCustody: CatalogItem = { ...backpack, code: 'HZ-0010', status: 'IN_CUSTODY' };
    const catalog = fakeCatalog([backpack, delivered, hidden, inCustody]);

    const res = await request(createApp({ catalog })).get('/catalog');

    expect(res.status).toBe(200);
    expect(res.body.map((item: { code: string }) => item.code)).toEqual(['HZ-0007']);
  });
});