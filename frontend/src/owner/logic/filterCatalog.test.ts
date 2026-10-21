import type { CatalogItem } from '../data/catalogService';
import { filterCatalog } from './filterCatalog';

const base = { place: 'Biblioteca', placeReference: null, foundAt: '2026-10-18T12:15:00.000Z', hasPhoto: false };
const backpack: CatalogItem = { ...base, code: 'HZ-0007', description: 'Mochila negra con llavero', category: 'Mochilas y bolsos' };
const thermos: CatalogItem = { ...base, code: 'HZ-0008', description: 'Termo metálico azul', category: 'Botellas y termos' };
const phone: CatalogItem = { ...base, code: 'HZ-0009', description: 'Celular con funda negra', category: 'Electrónicos' };
const items = [backpack, thermos, phone];

describe('Buscar objetos por palabras clave', () => {
  it('muestra todos los objetos cuando no se escribió nada', () => {
    expect(filterCatalog(items, { query: '  ' })).toEqual(items);
  });

  it('muestra los objetos que tienen todas las palabras escritas', () => {
    expect(filterCatalog(items, { query: 'mochila negra' })).toEqual([backpack]);
  });

  it('no distingue mayúsculas ni tildes', () => {
    expect(filterCatalog(items, { query: 'TERMO METALICO' })).toEqual([thermos]);
    expect(filterCatalog(items, { query: 'electronicos' })).toEqual([phone]);
  });

  it('no muestra nada si ningún objeto tiene esas palabras', () => {
    expect(filterCatalog(items, { query: 'paraguas' })).toEqual([]);
  });
});