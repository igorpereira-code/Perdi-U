// Catálogo provisional basado exclusivamente en PLACES de backend/prisma/seed/catalogs.ts.
// Pendiente de validación por Bienestar Estudiantil.
// TODO: sustituir esta copia local por datos reales del backend cuando estén disponibles.
// Los nombres identifican solo selecciones locales; no representan IDs de la base de datos.
export const PROVISIONAL_FOUND_ITEM_PLACES = [
  { name: 'Bloque A', type: 'BLOCK', classrooms: ['Aula A-12', 'Aula A-22', 'Aula A-310'] },
  { name: 'Bloque B', type: 'BLOCK', classrooms: ['Aula B-12', 'Aula B-22'] },
  { name: 'Bloque C', type: 'BLOCK', classrooms: ['Aula C-12', 'Aula C-22'] },
  { name: 'Biblioteca', type: 'SPACE' },
  { name: 'Terraza', type: 'SPACE' },
  { name: 'Sophie\'s', type: 'SPACE' },
  { name: '11:11', type: 'SPACE' },
  { name: 'Canchas deportivas', type: 'SPACE' },
  { name: 'Parqueo', type: 'SPACE' },
] as const;
