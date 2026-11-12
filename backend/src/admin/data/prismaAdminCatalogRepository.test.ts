import { db } from '../../core/data/prisma';
import { prismaAdminCatalogRepository } from './prismaAdminCatalogRepository';

jest.mock('../../core/data/prisma', () => ({ db: jest.fn() }));

const category = { findMany: jest.fn(), create: jest.fn(), update: jest.fn() };
const place = { findMany: jest.fn(), create: jest.fn(), update: jest.fn() };
const classroom = { create: jest.fn(), update: jest.fn() };

beforeEach(() => {
  jest
    .mocked(db)
    .mockReturnValue({ category, place, classroom } as unknown as ReturnType<typeof db>);
});

describe('Categorías y lugares guardados en la base de datos', () => {
  it('pide todas las categorías, activas y desactivadas, ordenadas por nombre', async () => {
    await prismaAdminCatalogRepository.listCatalogs();

    expect(category.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, active: true },
      orderBy: { name: 'asc' },
    });
  });

  it('pide todos los lugares con sus aulas, activos y desactivados, ordenados por nombre', async () => {
    await prismaAdminCatalogRepository.listCatalogs();

    expect(place.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        classrooms: { select: { id: true, name: true, active: true }, orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  });

  it('devuelve las categorías y los lugares juntos', async () => {
    category.findMany.mockResolvedValue([{ id: 1, name: 'Llaves', active: true }]);
    place.findMany.mockResolvedValue([
      { id: 2, name: 'Biblioteca', type: 'SPACE', active: false, classrooms: [] },
    ]);

    const catalogs = await prismaAdminCatalogRepository.listCatalogs();

    expect(catalogs).toEqual({
      categories: [{ id: 1, name: 'Llaves', active: true }],
      places: [{ id: 2, name: 'Biblioteca', type: 'SPACE', active: false, classrooms: [] }],
    });
  });
});

describe('Guardar categorías en la base de datos', () => {
  it('crea la categoría activa', async () => {
    await prismaAdminCatalogRepository.createCategory('Audífonos');

    expect(category.create).toHaveBeenCalledWith({
      data: { name: 'Audífonos', active: true },
      select: { id: true, name: true, active: true },
    });
  });

  it('guarda los cambios de una categoría', async () => {
    await prismaAdminCatalogRepository.updateCategory(1, { name: 'Llaves de casa', active: false });

    expect(category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Llaves de casa', active: false },
      select: { id: true, name: true, active: true },
    });
  });
});

const PLACE_FIELDS = {
  id: true,
  name: true,
  type: true,
  active: true,
  classrooms: { select: { id: true, name: true, active: true }, orderBy: { name: 'asc' } },
};

describe('Guardar lugares y aulas en la base de datos', () => {
  it('crea el lugar activo', async () => {
    await prismaAdminCatalogRepository.createPlace({ name: 'Bloque C', type: 'BLOCK' });

    expect(place.create).toHaveBeenCalledWith({
      data: { name: 'Bloque C', type: 'BLOCK', active: true },
      select: PLACE_FIELDS,
    });
  });

  it('guarda los cambios de un lugar', async () => {
    await prismaAdminCatalogRepository.updatePlace(10, { active: false });

    expect(place.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { active: false },
      select: PLACE_FIELDS,
    });
  });

  it('crea el aula activa dentro de su bloque', async () => {
    await prismaAdminCatalogRepository.createClassroom(10, 'A-103');

    expect(classroom.create).toHaveBeenCalledWith({
      data: { placeId: 10, name: 'A-103', active: true },
      select: { id: true, name: true, active: true },
    });
  });

  it('guarda los cambios de un aula', async () => {
    await prismaAdminCatalogRepository.updateClassroom(100, { name: 'A-101 (laboratorio)' });

    expect(classroom.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { name: 'A-101 (laboratorio)' },
      select: { id: true, name: true, active: true },
    });
  });
});
