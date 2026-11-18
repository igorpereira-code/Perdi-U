/** Shows whether a category, place or classroom can still be chosen when reporting. */
export function ActiveChip({ active }: { active: boolean }) {
  return active ? (
    <span className="shrink-0 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
      Activo
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
      Desactivado
    </span>
  );
}
