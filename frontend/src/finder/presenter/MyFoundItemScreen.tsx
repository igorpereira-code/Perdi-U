import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { FoundItemSummary } from './FoundItemSummary';

function ReportDetails({ code, foundItemsService }: { code: string; foundItemsService: FoundItemsService }) {
  const navigate = useNavigate();
  const [report, setReport] = useState<MyFoundItem | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setReport(undefined);
    setFailed(false);
    foundItemsService.getMineByCode(code)
      .then((item) => { if (active) { setReport(item); } })
      .catch(() => { if (active) { setFailed(true); } });
    return () => { active = false; };
  }, [foundItemsService, code, attempt]);

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <BackHeader title="Detalle del reporte" onBack={() => navigate('/mis-reportes')} />
      {failed ? (
        <div className="space-y-3">
          <div role="alert"><Alert>No se pudo cargar el reporte. Intenta nuevamente.</Alert></div>
          <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : report === undefined ? (
        <p role="status" className="text-sm text-neutral-500">Cargando el reporte…</p>
      ) : report === null ? (
        <EmptyState title="No encontramos este reporte" text="Revisa que el código corresponda a uno de tus objetos encontrados." />
      ) : (
        <article className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
          <FoundItemSummary report={report} foundItemsService={foundItemsService} />
        </article>
      )}
    </section>
  );
}

export function MyFoundItemScreen({ foundItemsService }: { foundItemsService: FoundItemsService }) {
  const { code = '' } = useParams();
  return <ReportDetails key={code} code={code} foundItemsService={foundItemsService} />;
}
