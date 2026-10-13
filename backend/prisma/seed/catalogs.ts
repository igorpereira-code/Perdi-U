import type { PlaceType } from '@prisma/client';

// TODO: replace with the real campus list when Bienestar confirms it
export const CATEGORIES = [
  'Electrónicos',
  'Mochilas y bolsos',
  'Ropa y accesorios',
  'Llaves',
  'Botellas y termos',
  'Útiles y libros',
  'Documentos y carnets',
  'Otros',
];

export const PLACES: {
  name: string;
  type: PlaceType;
  classrooms?: string[];
}[] = [
  { name: 'Bloque A', type: 'BLOCK', classrooms: ['Aula A-12', 'Aula A-22', 'Aula A-310'] },
  { name: 'Bloque B', type: 'BLOCK', classrooms: ['Aula B-12', 'Aula B-22'] },
  { name: 'Bloque C', type: 'BLOCK', classrooms: ['Aula C-12', 'Aula C-22'] },
  { name: 'Biblioteca', type: 'SPACE' },
  { name: 'Terraza', type: 'SPACE' },
  { name: 'Sophie\'s', type: 'SPACE' },
  { name: '11:11', type: 'SPACE' },
  { name: 'Canchas deportivas', type: 'SPACE' },
  { name: 'Parqueo', type: 'SPACE' },
];
