import type { MatchView } from '@shared/matching';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Thumb } from '../../core/presenter/Thumb';
import { WelfareCard } from '../../core/presenter/WelfareCard';

type MatchesPageProps = {
  reportCode: string;
  matches: MatchView[];
  onPickUp: (matchId: string) => void;
  onDismiss: (matchId: string) => void;
};

function PickUpInstructions({ reportCode }: { reportCode: string }) {
  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-success-50 p-2 text-sm font-medium text-success-700">
        Pasarás a recoger este objeto
      </p>
      <WelfareCard />
      <p className="text-sm text-neutral-700">
        Lleva el código de tu reporte {reportCode} para recogerlo.
      </p>
    </div>
  );
}

type MatchCardProps = {
  match: MatchView;
  reportCode: string;
  onPickUp: () => void;
  onDismiss: () => void;
};

function MatchCard({ match, reportCode, onPickUp, onDismiss }: MatchCardProps) {
  const { foundItem } = match;
  return (
    <li className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-3">
      <div className="flex gap-3">
        <Thumb category={foundItem.category} photoUrl={foundItem.photoUrl} />
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-neutral-900">{foundItem.description}</p>
          <p className="text-xs font-semibold text-blue-700">{foundItem.code}</p>
        </div>
      </div>
      {match.status === 'WILL_PICK_UP' ? (
        <PickUpInstructions reportCode={reportCode} />
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            No es mío
          </Button>
          <Button onClick={onPickUp} className="flex-1">
            Pasaré a recoger
          </Button>
        </div>
      )}
    </li>
  );
}

export function MatchesPage({ reportCode, matches, onPickUp, onDismiss }: MatchesPageProps) {
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
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            reportCode={reportCode}
            onPickUp={() => onPickUp(match.id)}
            onDismiss={() => onDismiss(match.id)}
          />
        ))}
      </ul>
    </section>
  );
}
