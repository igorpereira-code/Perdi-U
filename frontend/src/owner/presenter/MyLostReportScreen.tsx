import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { EmptyState } from '../../core/presenter/EmptyState';
import { InfoRow } from '../../core/presenter/InfoRow';
import { StatusChip } from '../../core/presenter/StatusChip';
import { WelfareCard } from '../../core/presenter/WelfareCard';
import { SeeMatchesLink } from '../../matching/presenter/SeeMatchesLink';
import type { MyLostReport, MyLostReportsService } from '../data/myLostReportsService';

type MyLostReportScreenProps = {
  myLostReportsService: Pick<MyLostReportsService, 'getMine'>;
};

type ScreenState = { status: 'loading' } | { status: 'missing' } | { status: 'failed' } | { status: 'ready'; report: MyLostReport };

const BACK_LINK = 'inline-flex text-sm font-semibold text-blue-500';

/** "2026-10-17" is shown as "17/10/2026". */
function formatDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}/${month}/${year}`;
}

/** Detail of one of the owner's lost reports. */
export function MyLostReportScreen({ myLostReportsService }: MyLostReportScreenProps) {
  const { code = '' } = useParams();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    myLostReportsService
      .getMine(code)
      .then((report) => {
        if (active) {
          setState(report ? { status: 'ready', report } : { status: 'missing' });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'failed' });
        }
      });
    return () => {
      active = false;
    };
  }, [myLostReportsService, code]);

  if (state.status === 'loading') {
    return <p role="status" className="text-sm text-neutral-500">Cargando tu reporte…</p>;
  }
  if (state.status === 'failed') {
    return (
      <div role="alert" className="mx-auto max-w-lg">
        <Alert>No se pudo cargar el reporte. Intenta nuevamente.</Alert>
      </div>
    );
  }
  if (state.status === 'missing') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <EmptyState title="No encontramos este reporte" text="Revisa el código o vuelve a tu lista de reportes." />
        <Link to="/mis-perdidas" className={BACK_LINK}>
          Volver a mis reportes
        </Link>
      </div>
    );
  }

  const { report } = state;
  return (
    <article className="mx-auto max-w-lg space-y-4">
      <Link to="/mis-perdidas" className={BACK_LINK}>
        Volver a mis reportes
      </Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-lg font-semibold text-blue-700">Detalle de mi reporte</h1>
        <StatusChip status={report.status} />
      </div>
      <div className="space-y-1 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
        <p className="text-sm text-neutral-700">Código de tu reporte</p>
        <p className="font-mono text-2xl font-bold text-blue-700">{report.code}</p>
        <p className="text-sm text-neutral-700">Muestra este código en Bienestar Estudiantil para recoger tu objeto.</p>
      </div>
      <p className="break-words text-base text-neutral-900">{report.description}</p>
      <dl className="rounded-2xl border border-neutral-200 bg-neutral-0 px-4">
        <InfoRow label="Categoría" value={report.category} />
        <InfoRow label="Lugares" value={report.places.length > 0 ? report.places.join(', ') : 'Sin lugares indicados'} />
        {report.placeDescription && <InfoRow label="Por dónde" value={report.placeDescription} />}
        <InfoRow label="Fechas" value={`Del ${formatDay(report.dateFrom)} al ${formatDay(report.dateTo)}`} />
      </dl>
      <SeeMatchesLink reportCode={report.code} />
      <WelfareCard />
    </article>
  );
}