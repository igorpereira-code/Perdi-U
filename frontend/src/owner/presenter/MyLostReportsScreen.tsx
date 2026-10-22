import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { StatusChip } from '../../core/presenter/StatusChip';
import type { MyLostReport, MyLostReportsService } from '../data/myLostReportsService';

type MyLostReportsScreenProps = {
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
};

/** The owner's lost reports, newest first. */
export function MyLostReportsScreen({ myLostReportsService }: MyLostReportsScreenProps) {
  const [reports, setReports] = useState<MyLostReport[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setReports(null);
    setFailed(false);
    myLostReportsService
      .listMine()
      .then((data) => {
        if (active) {
          setReports(data);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [myLostReportsService, attempt]);

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">Mis reportes de pérdida</h1>
      {failed ? (
        <div className="space-y-3">
          <div role="alert">
            <Alert>No se pudieron cargar tus reportes. Intenta nuevamente.</Alert>
          </div>
          <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : reports === null ? (
        <p role="status" className="text-sm text-neutral-500">
          Cargando tus reportes…
        </p>
      ) : reports.length === 0 ? (
        <EmptyState
          title="Todavía no reportaste objetos perdidos"
          text="Cuando reportes un objeto perdido, aparecerá aquí con su código y su estado."
        />
      ) : (
        <ul aria-label="Mis reportes de pérdida" className="space-y-3">
          {reports.map((report) => (
            <li key={report.code} className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-blue-700">{report.code}</p>
                <StatusChip status={report.status} />
              </div>
              <p className="break-words text-sm text-neutral-900">{report.description}</p>
              <p className="text-sm text-neutral-500">{report.category}</p>
              <Link
                to={`/mis-perdidas/${encodeURIComponent(report.code)}`}
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