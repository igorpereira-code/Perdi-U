/** Why the chosen dates cannot be used, or null if they can. Both empty means "everything". */
export function getDateRangeError(from: string, to: string): string | null {
  if (from === '' && to === '') {
    return null;
  }
  if (from === '' || to === '') {
    return 'Elige la fecha de inicio y la de fin.';
  }
  if (from > to) {
    return 'La fecha de inicio no puede ser posterior a la de fin.';
  }
  return null;
}
