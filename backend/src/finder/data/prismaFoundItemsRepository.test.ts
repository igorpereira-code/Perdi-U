import { db } from '../../core/data/prisma';
import type { NewFoundItem } from './foundItemsRepository';
import { prismaFoundItemsRepository } from './prismaFoundItemsRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const categoryFindMany = jest.fn();
const placeFindMany = jest.fn();
const foundItemCreate = jest.fn();
const foundItemFindUnique = jest.fn();
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
    foundItem: { create: foundItemCreate, findUnique: foundItemFindUnique },
  } as unknown as ReturnType<typeof db>);
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
