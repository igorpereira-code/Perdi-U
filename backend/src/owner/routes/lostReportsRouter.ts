import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export function createLostReportsRouter() {
  const router = Router();

  // POST: Crear un nuevo reporte de pérdida
  router.post('/api/lost-reports', async (req, res) => {
    try {
      // Extrae el usuario validado por el middleware de tu compañero
      const user = getCurrentUser(req);
      
      const { description, categoryId, dateFrom, dateTo, placeDescription } = req.body;

      const newReport = await prisma.lostReport.create({
        data: {
          ownerId: user.id,
          description,
          categoryId: Number(categoryId) || 1, // Fallback a categoría 1 si falla
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
          placeDescription,
          status: 'SEARCHING'
        }
      });

      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error al crear reporte:", error);
      res.status(500).json({ error: 'Error al guardar en la base de datos' });
    }
  });

  // GET: Obtener "Mis reportes"
  router.get('/api/lost-reports/me', async (req, res) => {
    try {
      const user = getCurrentUser(req);

      const reports = await prisma.lostReport.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json(reports);
    } catch (error) {
      console.error("Error al obtener reportes:", error);
      res.status(500).json({ error: 'Error al obtener tus reportes' });
    }
  });

  return router;
}