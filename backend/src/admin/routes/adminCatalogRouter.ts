import { Router, type RequestHandler } from 'express';
import type { CatalogChanges } from '@shared/admin';
import { requireRole } from '../../core/currentUser';
import type { AdminCatalogRepository } from '../data/adminCatalogRepository';
import {
  cleanCatalogName,
  isNameTaken,
  MAX_CATEGORY_NAME_LENGTH,
  validateCatalogName,
} from '../logic/catalogName';
import { readCatalogChanges } from '../logic/readCatalogChanges';
import { createAdminPlacesRouter } from './adminPlacesRouter';

const SAVE_CATEGORY_ERROR = 'No se pudo guardar la categoría. Intenta nuevamente.';
const TAKEN_CATEGORY_NAME = 'Ya existe una categoría con ese nombre.';

type RejectedChange = { status: number; error: string };

export function createAdminCatalogRouter(adminCatalog: AdminCatalogRepository): Router {
  const router = Router();

  const listCatalogs: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      res.json(await adminCatalog.listCatalogs());
    } catch {
      res.status(503).json({
        error: 'No se pudieron cargar las categorías y lugares. Intenta nuevamente.',
      });
    }
  };

  /** Names of the categories, leaving out the one being edited. */
  async function listOtherCategoryNames(editedCategoryId?: number): Promise<string[]> {
    const { categories } = await adminCatalog.listCatalogs();
    return categories
      .filter((category) => category.id !== editedCategoryId)
      .map((category) => category.name);
  }

  async function categoryExists(categoryId: number): Promise<boolean> {
    const { categories } = await adminCatalog.listCatalogs();
    return categories.some((category) => category.id === categoryId);
  }

  const createCategory: RequestHandler = async (req, res) => {
    const name = cleanCatalogName(req.body?.name);
    const nameError = validateCatalogName(name, MAX_CATEGORY_NAME_LENGTH);
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }
    try {
      if (isNameTaken(name, await listOtherCategoryNames())) {
        res.status(409).json({ error: TAKEN_CATEGORY_NAME });
        return;
      }
      res.status(201).json(await adminCatalog.createCategory(name));
    } catch {
      res.status(503).json({ error: SAVE_CATEGORY_ERROR });
    }
  };

  /** Why the category cannot take these changes, or null if it can. */
  async function findCategoryUpdateProblem(
    categoryId: number,
    changes: CatalogChanges,
  ): Promise<RejectedChange | null> {
    if (!(await categoryExists(categoryId))) {
      return { status: 404, error: 'No encontramos esta categoría.' };
    }
    if (changes.name && isNameTaken(changes.name, await listOtherCategoryNames(categoryId))) {
      return { status: 409, error: TAKEN_CATEGORY_NAME };
    }
    return null;
  }

  const updateCategory: RequestHandler = async (req, res) => {
    const categoryId = Number(req.params.id);
    const result = readCatalogChanges(req.body, MAX_CATEGORY_NAME_LENGTH);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    try {
      const problem = await findCategoryUpdateProblem(categoryId, result.changes);
      if (problem) {
        res.status(problem.status).json({ error: problem.error });
        return;
      }
      res.json(await adminCatalog.updateCategory(categoryId, result.changes));
    } catch {
      res.status(503).json({ error: SAVE_CATEGORY_ERROR });
    }
  };

  router.get('/admin/catalogs', requireRole('ADMIN'), listCatalogs);
  router.post('/admin/categories', requireRole('ADMIN'), createCategory);
  router.patch('/admin/categories/:id', requireRole('ADMIN'), updateCategory);
  router.use(createAdminPlacesRouter(adminCatalog));

  return router;
}
