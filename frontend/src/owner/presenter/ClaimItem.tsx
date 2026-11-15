import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../core/presenter/Button';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { MyLostReportsService } from '../data/myLostReportsService';

type ClaimItemProps = {
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
};

/** "Es mío, pasaré a recoger": lets the owner say that a published item is theirs. */
export function ClaimItem({ myLostReportsService }: ClaimItemProps) {
  const loadReports = useCallback(() => myLostReportsService.listMine(), [myLostReportsService]);
  const { data: reports, hasFailed, retry } = useLoadedData(loadReports);

  if (hasFailed) {
    return (
      <LoadErrorAlert message="No se pudieron cargar tus reportes. Intenta nuevamente." onRetry={retry} />
    );
  }
  if (!reports) {
    return <p role="status" className="text-sm text-neutral-500">Cargando tus reportes…</p>;
  }
  if (reports.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-700">
          Para pedir este objeto necesitas un reporte de pérdida.
        </p>
        <Link
          to="/reportar-perdida"
          className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700"
        >
          Reportar mi pérdida
        </Link>
      </div>
    );
  }
  return <Button className="w-full">Es mío, pasaré a recoger</Button>;
}