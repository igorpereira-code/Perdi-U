import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonArea, SkeletonCard } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { MatchesService } from '../data/matchesService';
import { MatchesPage, type PendingAnswer } from './MatchesPage';

/** Loads the matches of the report in the address (/mis-reportes/:code/coincidencias) and shows them. */
export function MatchesScreen({ matchesService }: { matchesService: MatchesService }) {
  const { code = '' } = useParams();
  const loadMatches = useCallback(() => matchesService.getMatches(code), [matchesService, code]);
  // undefined = still loading; null = the report does not exist or is not the user's.
  const { data: matches, setData: setMatches, hasFailed, retry } = useLoadedData(loadMatches);
  const [pendingAnswer, setPendingAnswer] = useState<PendingAnswer | null>(null);
  const [failedMatchId, setFailedMatchId] = useState<string | null>(null);

  async function saveAnswer(answer: PendingAnswer, onSaved: () => void) {
    setPendingAnswer(answer);
    setFailedMatchId(null);
    try {
      await (answer.action === 'pickUp'
        ? matchesService.pickUp(answer.matchId)
        : matchesService.dismiss(answer.matchId));
      onSaved();
    } catch {
      setFailedMatchId(answer.matchId);
    } finally {
      setPendingAnswer(null);
    }
  }

  function handlePickUp(matchId: string) {
    return saveAnswer({ matchId, action: 'pickUp' }, () =>
      setMatches((current) =>
        current?.map((match) =>
          match.id === matchId ? { ...match, status: 'WILL_PICK_UP' } : match,
        ),
      ),
    );
  }

  function handleDismiss(matchId: string) {
    return saveAnswer({ matchId, action: 'dismiss' }, () =>
      setMatches((current) => current?.filter((match) => match.id !== matchId)),
    );
  }

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar los objetos parecidos. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (matches === undefined) {
    return (
      <SkeletonArea label="Buscando objetos parecidos…">
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </SkeletonArea>
    );
  }
  if (matches === null) {
    return (
      <EmptyState
        icon={SearchX}
        title="No encontramos este reporte"
        text="Revisa que el código sea el de uno de tus reportes de pérdida."
      />
    );
  }
  return (
    <MatchesPage
      reportCode={code}
      matches={matches}
      onPickUp={handlePickUp}
      onDismiss={handleDismiss}
      pendingAnswer={pendingAnswer}
      failedMatchId={failedMatchId}
    />
  );
}
