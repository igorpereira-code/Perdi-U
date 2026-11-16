import { Router, type RequestHandler } from 'express';
import type { CatalogChanges, ManagedPlace, PlaceType } from '@shared/admin';
import { requireRole } from '../../core/currentUser';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';
import {
  cleanCatalogName,
  isNameTaken,
  MAX_CLASSROOM_NAME_LENGTH,
  MAX_PLACE_NAME_LENGTH,
  validateCatalogName,
} from '../logic/catalogName';
import { readCatalogChanges } from '../logic/readCatalogChanges';

const SAVE_PLACE_ERROR = 'No se pudo guardar el lugar. Intenta nuevamente.';
const SAVE_CLASSROOM_ERROR = 'No se pudo guardar el aula. Intenta nuevamente.';
const TAKEN_PLACE_NAME = 'Ya existe un lugar con ese nombre.';
const TAKEN_CLASSROOM_NAME = 'Este bloque ya tiene un aula con ese nombre.';
const PLACE_NOT_FOUND = 'No encontramos este lugar.';
const PLACE_TYPES: PlaceType[] = ['BLOCK', 'SPACE'];

type RejectedChange = { status: number; error: string };

function isPlaceType(value: unknown): value is PlaceType {
  return PLACE_TYPES.includes(value as PlaceType);
}

function namesExcept(items: { id: number; name: string }[], editedId?: number): string[] {
  return items.filter((item) => item.id !== editedId).map((item) => item.name);
}

/** The block that has this classroom. */
function findClassroomPlace(places: ManagedPlace[], classroomId: number) {
  return places.find((place) => place.classrooms.some(({ id }) => id === classroomId));
}

function findPlaceUpdateProblem(
  places: ManagedPlace[],
  placeId: number,
  changes: CatalogChanges,
): RejectedChange | null {
  if (!places.some((place) => place.id === placeId)) {
    return { status: 404, error: PLACE_NOT_FOUND };
  }
  if (changes.name && isNameTaken(changes.name, namesExcept(places, placeId))) {
    return { status: 409, error: TAKEN_PLACE_NAME };
  }
  return null;
}

function findNewClassroomProblem(
  place: ManagedPlace | undefined,
  name: string,
): RejectedChange | null {
  if (!place) {
    return { status: 404, error: PLACE_NOT_FOUND };
  }
  if (place.type !== 'BLOCK') {
    return { status: 409, error: 'Solo los bloques tienen aulas.' };
  }
  if (isNameTaken(name, namesExcept(place.classrooms))) {
    return { status: 409, error: TAKEN_CLASSROOM_NAME };
  }
  return null;
}

function findClassroomUpdateProblem(
  place: ManagedPlace | undefined,
  classroomId: number,
  changes: CatalogChanges,
): RejectedChange | null {
  if (!place) {
    return { status: 404, error: 'No encontramos esta aula.' };
  }
  if (changes.name && isNameTaken(changes.name, namesExcept(place.classrooms, classroomId))) {
    return { status: 409, error: TAKEN_CLASSROOM_NAME };
  }
  return null;
}

/** Blocks and spaces of the campus, and the classrooms of each block. */
export function createAdminPlacesRouter(adminCatalog: AdminCatalogRepository): Router {
  const router = Router();

  async function listPlaces(): Promise<ManagedPlace[]> {
    return (await adminCatalog.listCatalogs()).places;
  }

  const createPlace: RequestHandler = async (req, res) => {
    const name = cleanCatalogName(req.body?.name);
    const nameError = validateCatalogName(name, MAX_PLACE_NAME_LENGTH);
    if (nameError || !isPlaceType(req.body?.type)) {
      res.status(400).json({ error: nameError ?? 'Elige si es un bloque o un espacio.' });
      return;
    }
    try {
      if (isNameTaken(name, namesExcept(await listPlaces()))) {
        res.status(409).json({ error: TAKEN_PLACE_NAME });
        return;
      }
      res.status(201).json(await adminCatalog.createPlace({ name, type: req.body.type }));
    } catch {
      res.status(503).json({ error: SAVE_PLACE_ERROR });
    }
  };

  const updatePlace: RequestHandler = async (req, res) => {
    const placeId = Number(req.params.id);
    const result = readCatalogChanges(req.body, MAX_PLACE_NAME_LENGTH);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      const problem = findPlaceUpdateProblem(await listPlaces(), placeId, result.changes);
      if (problem) {
        res.status(problem.status).json({ error: problem.error });
        return;
      }
      res.json(await adminCatalog.updatePlace(placeId, result.changes));
    } catch {
      res.status(503).json({ error: SAVE_PLACE_ERROR });
    }
  };

  const createClassroom: RequestHandler = async (req, res) => {
    const placeId = Number(req.params.id);
    const name = cleanCatalogName(req.body?.name);
    const nameError = validateCatalogName(name, MAX_CLASSROOM_NAME_LENGTH);
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }
    try {
      const place = (await listPlaces()).find(({ id }) => id === placeId);
      const problem = findNewClassroomProblem(place, name);
      if (problem) {
        res.status(problem.status).json({ error: problem.error });
        return;
      }
      res.status(201).json(await adminCatalog.createClassroom(placeId, name));
    } catch {
      res.status(503).json({ error: SAVE_CLASSROOM_ERROR });
    }
  };

  const updateClassroom: RequestHandler = async (req, res) => {
    const classroomId = Number(req.params.id);
    const result = readCatalogChanges(req.body, MAX_CLASSROOM_NAME_LENGTH);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      const place = findClassroomPlace(await listPlaces(), classroomId);
      const problem = findClassroomUpdateProblem(place, classroomId, result.changes);
      if (problem) {
        res.status(problem.status).json({ error: problem.error });
        return;
      }
      res.json(await adminCatalog.updateClassroom(classroomId, result.changes));
    } catch {
      res.status(503).json({ error: SAVE_CLASSROOM_ERROR });
    }
  };

  router.post('/admin/places', requireRole('ADMIN'), createPlace);
  router.patch('/admin/places/:id', requireRole('ADMIN'), updatePlace);
  router.post('/admin/places/:id/classrooms', requireRole('ADMIN'), createClassroom);
  router.patch('/admin/classrooms/:id', requireRole('ADMIN'), updateClassroom);

  return router;
}
