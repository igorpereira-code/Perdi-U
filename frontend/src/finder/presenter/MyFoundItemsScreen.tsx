import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { FoundItemSummary } from './FoundItemSummary';

export function MyFoundItemsScreen({ foundItemsService }: { foundItemsService: FoundItemsService }) {
  const [reports, setReports] = useState<MyFoundItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setReports(null);
    setFailed(false);
    foundItemsService.listMine()
      .then((items) => { if (active) { setReports(items); } })
      .catch(() => { if (active) { setFailed(true); } });
    return () => { active = false; };
  }, [foundItemsService, attempt]);

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">Mis reportes</h1>
      <p className="text-sm text-neutral-500">Objetos que encontraste y reportaste, incluidos los pendientes de entrega.</p>
      {failed ? (
        <div className="space-y-3">
          <div role="alert"><Alert>No se pudieron cargar tus reportes. Intenta nuevamente.</Alert></div>
          <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : reports === null ? (
        <p role="status" className="text-sm text-neutral-500">Cargando tus reportes…</p>
      ) : reports.length === 0 ? (
        <EmptyState title="Todavía no reportaste objetos" text="Cuando reportes un objeto encontrado, aparecerá aquí." />
      ) : (
        <ul aria-label="Objetos reportados" className="space-y-3">
          {reports.map((report) => (
            <li key={report.code} className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
              <FoundItemSummary report={report} foundItemsService={foundItemsService} />
              <Link
                to={`/mis-reportes/encontrados/${encodeURIComponent(report.code)}`}
                aria-label={`Ver reporte ${report.code}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Ver reporte
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
