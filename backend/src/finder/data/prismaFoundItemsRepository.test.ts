import { db } from '../../core/data/prisma';
import type { NewFoundItem } from './foundItemsRepository';
import { prismaFoundItemsRepository } from './prismaFoundItemsRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const categoryFindMany = jest.fn();
const placeFindMany = jest.fn();
const foundItemCreate = jest.fn();
const foundItemFindUnique = jest.fn();
const foundItemFindMany = jest.fn();
const foundItemFindFirst = jest.fn();
const item: NewFoundItem = {
  description: 'Llaves con llavero azul',
  categoryId: 47,
  placeId: 83,
  classroomId: 216,
  placeReference: 'Sobre la mesa',
  foundAt: new Date('2026-10-18T12:15:00.000Z'),
  finderId: 'ea15a345-993c-4b15-a4e4-630b5de1584e',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(db).mockReturnValue({
    category: { findMany: categoryFindMany },
    place: { findMany: placeFindMany },
    foundItem: { create: foundItemCreate, findUnique: foundItemFindUnique,
      findMany: foundItemFindMany, findFirst: foundItemFindFirst },
  } as unknown as ReturnType<typeof db>);
});

describe('Mis reportes mediante Prisma', () => {
  it('consulta un detalle por código y hallador en la misma consulta sin exponer su ruta privada', async () => {
    foundItemFindFirst.mockResolvedValue({ code: 'HZ-7325', description: 'Llaves azules',
      category: { name: 'Llaves' }, foundAt: item.foundAt, photoUrl: 'usuario/foto.png',
      status: 'PENDING_DROP_OFF', receivedAt: null });

    await expect(prismaFoundItemsRepository.getMineByCode(item.finderId, 'HZ-7325')).resolves.toEqual({
      code: 'HZ-7325', description: 'Llaves azules', category: 'Llaves', foundAt: item.foundAt,
      hasPhoto: true, status: 'PENDING_DROP_OFF', receivedAt: null,
    });
    expect(foundItemFindFirst).toHaveBeenCalledWith({
      where: { finderId: item.finderId, code: 'HZ-7325' },
      select: { code: true, description: true, category: { select: { name: true } }, foundAt: true,
        photoUrl: true, status: true, receivedAt: true },
    });
  });

  it('devuelve null cuando no existe un reporte propio con ese código', async () => {
    foundItemFindFirst.mockResolvedValue(null);

    await expect(prismaFoundItemsRepository.getMineByCode(item.finderId, 'HZ-9999')).resolves.toBeNull();
  });

  it('propaga el error de consulta del detalle sin inventar un reporte', async () => {
    foundItemFindFirst.mockRejectedValue(new Error('Sin conexión'));

    await expect(prismaFoundItemsRepository.getMineByCode(item.finderId, 'HZ-7325')).rejects.toThrow('Sin conexión');
  });

  it('filtra por hallador sin excluir estados ni limitar la cantidad de reportes', async () => {
    const reports = [{ code: 'HZ-7325', description: 'Llaves azules', category: { name: 'Llaves' },
      foundAt: item.foundAt, photoUrl: 'usuario/foto.png', status: 'PENDING_DROP_OFF', receivedAt: null }];
    foundItemFindMany.mockResolvedValue(reports);

    await expect(prismaFoundItemsRepository.listMine(item.finderId)).resolves.toEqual([
      { code: 'HZ-7325', description: 'Llaves azules', category: 'Llaves', foundAt: item.foundAt,
        hasPhoto: true, status: 'PENDING_DROP_OFF', receivedAt: null },
    ]);
    expect(foundItemFindMany).toHaveBeenCalledWith({
      where: { finderId: item.finderId },
      select: { code: true, description: true, category: { select: { name: true } }, foundAt: true,
        photoUrl: true, status: true, receivedAt: true },
      orderBy: [{ createdAt: 'desc' }, { code: 'desc' }],
    });
  });

  it.each([null, 'usuario/foto.png'])('devuelve categoría y fecha sin exponer la ruta privada %s', async (photoUrl) => {
    foundItemFindMany.mockResolvedValue([{ code: 'HZ-7325', description: 'Llaves azules',
      category: { name: 'Llaves' }, foundAt: item.foundAt, photoUrl, status: 'PENDING_DROP_OFF', receivedAt: null }]);

    const reports = await prismaFoundItemsRepository.listMine(item.finderId);

    expect(reports).toEqual([{ code: 'HZ-7325', description: 'Llaves azules',
      category: 'Llaves', foundAt: item.foundAt, hasPhoto: photoUrl !== null, status: 'PENDING_DROP_OFF', receivedAt: null }]);
    expect(reports[0]).not.toHaveProperty('photoUrl');
  });

  it('conserva el estado real y la fecha de recepción de todos los reportes', async () => {
    const receivedAt = new Date('2026-10-19T14:30:00.000Z');
    const statuses = ['PENDING_DROP_OFF', 'IN_CUSTODY', 'PUBLISHED', 'DELIVERED'] as const;
    const records = statuses.map((status, index) => ({ code: `HZ-732${index}`,
      description: 'Llaves azules', category: { name: 'Llaves' }, foundAt: item.foundAt,
      photoUrl: null, status, receivedAt: status === 'PENDING_DROP_OFF' ? null : receivedAt }));
    foundItemFindMany.mockResolvedValue(records);

    const reports = await prismaFoundItemsRepository.listMine(item.finderId);

    expect(reports).toEqual(records.map(({ category, photoUrl: _photo, ...record }) => ({
      ...record, category: category.name, hasPhoto: false,
    })));
  });
});

describe('Datos para autorizar la consulta de fotografías', () => {
  it('obtiene propietario, estado, visibilidad y ruta por código sin generar una URL', async () => {
    const photo = { finderId: item.finderId, photoUrl: 'usuario/archivo.png', status: 'PENDING_DROP_OFF', visibility: 'VISIBLE' };
    foundItemFindUnique.mockResolvedValue(photo);

    await expect(prismaFoundItemsRepository.getPhotoByCode('HZ-7325')).resolves.toEqual(photo);
    expect(foundItemFindUnique).toHaveBeenCalledWith({
      where: { code: 'HZ-7325' },
      select: { finderId: true, photoUrl: true, status: true, visibility: true },
    });
  });
});

describe('Catálogos de Finder mediante Prisma', () => {
  it('consulta categorías, lugares y aulas activos conservando sus identificadores reales', async () => {
    const categories = [{ id: 47, name: 'Llaves' }];
    const places = [{
      id: 83,
      name: 'Bloque A',
      type: 'BLOCK',
      classrooms: [{ id: 216, name: 'Aula A-12' }],
    }];
    categoryFindMany.mockResolvedValue(categories);
    placeFindMany.mockResolvedValue(places);

    await expect(prismaFoundItemsRepository.getCatalogs()).resolves.toEqual({ categories, places });
    expect(categoryFindMany).toHaveBeenCalledWith({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    expect(placeFindMany).toHaveBeenCalledWith({
      where: { active: true },
      select: {
        id: true,
        name: true,
        type: true,
        classrooms: {
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  });
});

describe('Registro de un hallazgo mediante Prisma', () => {
  it('omite el código para usar PostgreSQL y devuelve exactamente la respuesta de Prisma', async () => {
    const created = { code: 'HZ-7321', status: 'PENDING_DROP_OFF' };
    foundItemCreate.mockResolvedValue(created);

    await expect(prismaFoundItemsRepository.create(item)).resolves.toEqual(created);
    expect(foundItemCreate).toHaveBeenCalledWith({
      data: { ...item, status: 'PENDING_DROP_OFF' },
      select: { code: true, status: true },
    });
    const data = foundItemCreate.mock.calls[0][0].data;
    for (const field of ['id', 'code', 'publishedAt', 'publishedById', 'receivedAt', 'receivedById']) {
      expect(data).not.toHaveProperty(field);
    }
  });

  it('acepta un reporte sin aula, referencia ni fotografía', async () => {
    foundItemCreate.mockResolvedValue({ code: 'HZ-7322', status: 'PENDING_DROP_OFF' });

    await prismaFoundItemsRepository.create({ ...item, classroomId: null, placeReference: null });

    expect(foundItemCreate.mock.calls[0][0].data).toMatchObject({
      classroomId: null,
      placeReference: null,
      status: 'PENDING_DROP_OFF',
    });
    expect(foundItemCreate.mock.calls[0][0].data).not.toHaveProperty('photoUrl');
  });

  it('descarta código y estado externos incluso si llegan como propiedades adicionales', async () => {
    foundItemCreate.mockResolvedValue({ code: 'HZ-7324', status: 'PENDING_DROP_OFF' });
    const untrusted = { ...item, code: 'HZ-0000', status: 'PUBLISHED', publishedById: item.finderId };

    await prismaFoundItemsRepository.create(untrusted);

    const data = foundItemCreate.mock.calls[0][0].data;
    expect(data.status).toBe('PENDING_DROP_OFF');
    expect(data).not.toHaveProperty('code');
    expect(data).not.toHaveProperty('publishedById');
  });

  it('conserva una ruta de fotografía proporcionada internamente por Storage', async () => {
    foundItemCreate.mockResolvedValue({ code: 'HZ-7323', status: 'PENDING_DROP_OFF' });

    await prismaFoundItemsRepository.create({ ...item, photoUrl: 'usuario/archivo.jpg' });

    expect(foundItemCreate.mock.calls[0][0].data.photoUrl).toBe('usuario/archivo.jpg');
  });

  it('propaga el error de guardado sin devolver un código inventado', async () => {
    const error = new Error('Base de datos no disponible');
    foundItemCreate.mockRejectedValue(error);

    await expect(prismaFoundItemsRepository.create(item)).rejects.toBe(error);
  });
});
