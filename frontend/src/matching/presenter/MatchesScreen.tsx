import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { MatchView } from '@shared/matching';
import type { MatchesService } from '../data/matchesService';
import { MatchesPage } from './MatchesPage';

/** Loads the matches of the report in the address (/mis-reportes/:code/coincidencias) and shows them. */
export function MatchesScreen({ matchesService }: { matchesService: MatchesService }) {
  const { code = '' } = useParams();
  const [matches, setMatches] = useState<MatchView[] | null>(null);

  useEffect(() => {
    matchesService.getMatches(code).then(setMatches);
  }, [matchesService, code]);

  if (!matches) {
    return <p className="text-sm text-neutral-500">Buscando objetos parecidos…</p>;
  }
  return <MatchesPage reportCode={code} matches={matches} />;
}
