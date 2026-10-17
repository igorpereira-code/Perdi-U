import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

/** Button for the lost report detail (Javi, HU-8): opens the items that look like that report. */
export function SeeMatchesLink({ reportCode }: { reportCode: string }) {
  return (
    <Link
      to={`/mis-reportes/${reportCode}/coincidencias`}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-0 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      Ver objetos parecidos
    </Link>
  );
}
