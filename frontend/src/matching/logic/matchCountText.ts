/** What Bienestar reads after publishing: how many lost reports look like the item. */
export function matchCountText(count: number): string {
  if (count === 0) {
    return 'Por ahora ningún reporte de pérdida se parece a este objeto.';
  }
  if (count === 1) {
    return '1 reporte de pérdida se parece a este objeto.';
  }
  return `${count} reportes de pérdida se parecen a este objeto.`;
}
