import { useEffect, useState } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import type { FoundItemCatalogs, FoundItemsService } from '../../finder/data/foundItemsService';
import type { LostReportsService } from '../data/lostReportsService';
import { LostReportForm } from './LostReportForm';

type LostReportScreenProps = {
  foundItemsService: Pick<FoundItemsService, 'getCatalogs'>;
  lostReportsService: LostReportsService;
};

/** Loads the categories and places, then shows the lost report form. */
export function LostReportScreen({ foundItemsService, lostReportsService }: LostReportScreenProps) {
  const [catalogs, setCatalogs] = useState<FoundItemCatalogs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalogs(null);
    setError(null);
    foundItemsService
      .getCatalogs()
      .then((data) => {
        if (active) {
          setCatalogs(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('No se pudieron cargar las categorías y los lugares. Intenta nuevamente.');
        }
      });
    return () => {
      active = false;
    };
  }, [foundItemsService, attempt]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div role="alert"><Alert>{error}</Alert></div>
        <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
      </div>
    );
  }
  if (!catalogs) {
    return <p role="status" className="text-sm text-neutral-500">Cargando categorías y lugares…</p>;
  }
  return <LostReportForm catalogs={catalogs} onCreate={lostReportsService.create} />;
}