export const MAX_CATEGORY_NAME_LENGTH = 80;

/** "  Llaves   de casa " → "Llaves de casa". Anything that is not text becomes "". */
export function cleanCatalogName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/** Why the name cannot be saved, or null if it is fine. */
export function validateCatalogName(name: string, maxLength: number): string | null {
  if (name === '') {
    return 'Escribe un nombre.';
  }
  if (name.length > maxLength) {
    return `El nombre puede tener hasta ${maxLength} caracteres.`;
  }
  return null;
}

/** "Llaves" and "llaves" are the same name. */
function toComparableName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** True if another item already uses that name, without caring about capitals or accents. */
export function isNameTaken(name: string, otherNames: string[]): boolean {
  return otherNames.some((otherName) => toComparableName(otherName) === toComparableName(name));
}
