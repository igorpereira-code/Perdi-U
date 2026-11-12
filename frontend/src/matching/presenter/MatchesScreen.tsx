import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import type { MatchView } from '@shared/matching';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { SkeletonArea, SkeletonCard } from '../../core/presenter/Skeleton';
import type { MatchesService } from '../data/matchesService';
import { MatchesPage, type PendingAnswer } from './MatchesPage';

/** Loads the matches of the report in the address (/mis-reportes/:code/coincidencias) and shows them. */
export function MatchesScreen({ matchesService }: { matchesService: MatchesService }) {
  const { code = '' } = useParams();
  // undefined = still loading; null = the report does not exist or is not the user's.
  const [matches, setMatches] = useState<MatchView[] | null | undefined>(undefined);
  const [hasFailed, setHasFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pendingAnswer, setPendingAnswer] = useState<PendingAnswer | null>(null);
  const [failedMatchId, setFailedMatchId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setMatches(undefined);
    setHasFailed(false);
    matchesService
      .getMatches(code)
      .then((loadedMatches) => {
        if (isActive) {
          setMatches(loadedMatches);
        }
      })
      .catch(() => {
        if (isActive) {
          setHasFailed(true);
        }
      });
    return () => {
      isActive = false;
    };
  }, [matchesService, code, loadAttempt]);

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
      <div className="space-y-3">
        <div role="alert">
          <Alert>No se pudieron cargar los objetos parecidos. Intenta nuevamente.</Alert>
        </div>
        <Button onClick={() => setLoadAttempt((value) => value + 1)}>Reintentar</Button>
      </div>
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
