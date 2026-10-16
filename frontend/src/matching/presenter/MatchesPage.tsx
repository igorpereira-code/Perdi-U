import type { MatchView } from '@shared/matching';

type MatchesPageProps = {
  reportCode: string;
  matches: MatchView[];
};

export function MatchesPage({ reportCode, matches }: MatchesPageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">
        Objetos parecidos a tu reporte {reportCode}
      </h1>
      <p className="text-sm text-neutral-500">
        Te mostramos objetos parecidos al tuyo. Revisa si alguno es tuyo.
      </p>
      <ul className="space-y-3">
        {matches.map((match) => (
          <li
            key={match.id}
            className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4 text-sm text-neutral-900"
          >
            {match.foundItem.description}
          </li>
        ))}
      </ul>
    </section>
  );
}
