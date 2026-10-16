import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import type { MatchView } from '@shared/matching';
import { EmptyState } from '../../core/presenter/EmptyState';
import type { MatchesService } from '../data/matchesService';
import { MatchesPage } from './MatchesPage';

/** Loads the matches of the report in the address (/mis-reportes/:code/coincidencias) and shows them. */
export function MatchesScreen({ matchesService }: { matchesService: MatchesService }) {
  const { code = '' } = useParams();
  // undefined = still loading; null = the report does not exist or is not the user's.
  const [matches, setMatches] = useState<MatchView[] | null | undefined>(undefined);

  useEffect(() => {
    matchesService.getMatches(code).then(setMatches);
  }, [matchesService, code]);

  if (matches === undefined) {
    return <p className="text-sm text-neutral-500">Buscando objetos parecidos…</p>;
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
  return <MatchesPage reportCode={code} matches={matches} />;
}
