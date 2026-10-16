import type { MatchView } from '@shared/matching';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Thumb } from '../../core/presenter/Thumb';

type MatchesPageProps = {
  reportCode: string;
  matches: MatchView[];
};

export function MatchesPage({ reportCode, matches }: MatchesPageProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay objetos parecidos"
        text={`Tu reporte ${reportCode} seguirá activo. Vuelve a revisarlo más adelante.`}
      />
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">
        Objetos parecidos a tu reporte {reportCode}
      </h1>
      <p className="text-sm text-neutral-500">
        Te mostramos objetos parecidos al tuyo. Revisa si alguno es tuyo.
      </p>
      <ul className="space-y-3">
        {matches.map(({ id, foundItem }) => (
          <li
            key={id}
            className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-3"
          >
            <Thumb category={foundItem.category} photoUrl={foundItem.photoUrl} />
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-neutral-900">{foundItem.description}</p>
              <p className="text-xs font-semibold text-blue-700">{foundItem.code}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
