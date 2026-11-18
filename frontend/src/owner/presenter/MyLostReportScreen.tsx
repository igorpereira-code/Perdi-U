import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { InfoRow } from '../../core/presenter/InfoRow';
import { Skeleton, SkeletonArea } from '../../core/presenter/Skeleton';
import { StatusChip } from '../../core/presenter/StatusChip';
import { WelfareCard } from '../../core/presenter/WelfareCard';
import type { FoundItemCatalogs, FoundItemsService } from '../../finder/data/foundItemsService';
import { SeeMatchesLink } from '../../matching/presenter/SeeMatchesLink';
import type { LostReportPayload } from '../data/lostReportsService';
import type { MyLostReport, MyLostReportsService } from '../data/myLostReportsService';
import { formatDay } from '../logic/formatDay';
import { LostReportForm } from './LostReportForm';

type MyLostReportScreenProps = {
  myLostReportsService: Pick<MyLostReportsService, 'getMine' | 'getEditable' | 'update' | 'close'>;
  foundItemsService: Pick<FoundItemsService, 'getCatalogs'>;
};

type ReportToEdit = { initial: LostReportPayload; catalogs: FoundItemCatalogs };

type ScreenState = { status: 'loading' } | { status: 'missing' } | { status: 'failed' } | { status: 'ready'; report: MyLostReport };

const BACK_LINK = 'inline-flex text-sm font-semibold text-blue-500';

/** How many data rows are shown in gray while the report loads. */
const SKELETON_ROWS = 3;

/** The shape of the report detail while it loads: code, description and data rows. */
function MyLostReportSkeleton() {
  return (
    <SkeletonArea label="Cargando tu reporte…">
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="mx-auto h-8 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
          {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonArea>
  );
}

/** Detail of one of the owner's lost reports. */
export function MyLostReportScreen({ myLostReportsService, foundItemsService }: MyLostReportScreenProps) {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });
  const [reportToEdit, setReportToEdit] = useState<ReportToEdit | null>(null);
  const [isOpeningEdit, setIsOpeningEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  async function openEdit() {
    setIsOpeningEdit(true);
    setEditError(null);
    try {
      const [initial, catalogs] = await Promise.all([
        myLostReportsService.getEditable(code),
        foundItemsService.getCatalogs(),
      ]);
      setReportToEdit({ initial, catalogs });
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'No se pudo cargar el reporte para editar.');
    } finally {
      setIsOpeningEdit(false);
    }
  }

  async function closeReport() {
    setIsClosing(true);
    setCloseError(null);
    try {
      await myLostReportsService.close(code);
      setIsConfirmingClose(false);
      setReloadCount((count) => count + 1);
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : 'No se pudo cerrar el reporte.');
    } finally {
      setIsClosing(false);
    }
  }

  async function saveChanges(changes: LostReportPayload) {
    await myLostReportsService.update(code, changes);
    navigate(`/mis-reportes/${code}/coincidencias`);
  }

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
  }, [myLostReportsService, code, reloadCount]);

  if (reportToEdit) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <LostReportForm
          catalogs={reportToEdit.catalogs}
          edit={{ initial: reportToEdit.initial, onSave: saveChanges }}
        />
        <Button variant="outline" className="w-full" onClick={() => setReportToEdit(null)}>
          Volver al detalle
        </Button>
      </div>
    );
  }
  if (state.status === 'loading') {
    return <MyLostReportSkeleton />;
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
      {editError && (
        <div role="alert">
          <Alert>{editError}</Alert>
        </div>
      )}
      <Button
        variant="outline"
        className="w-full"
        isLoading={isOpeningEdit}
        loadingText="Cargando reporte…"
        onClick={openEdit}
      >
        Editar reporte
      </Button>
      {closeError && (
        <div role="alert">
          <Alert>{closeError}</Alert>
        </div>
      )}
      {isConfirmingClose ? (
        <section className="space-y-3 rounded-2xl border border-neutral-200 p-4" aria-labelledby="close-report-title">
          <h2 id="close-report-title" className="font-semibold">
            ¿Ya encontraste tu objeto?
          </h2>
          <p className="text-sm">Si cierras el reporte, ya no recibirás coincidencias ni podrás editarlo.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsConfirmingClose(false)} disabled={isClosing}>
              Conservar reporte
            </Button>
            <Button onClick={closeReport} isLoading={isClosing} loadingText="Cerrando reporte…">
              Confirmar cierre
            </Button>
          </div>
        </section>
      ) : (
        <Button
          className="w-full"
          onClick={() => {
            setCloseError(null);
            setIsConfirmingClose(true);
          }}
        >
          Ya lo encontré
        </Button>
      )}
      <WelfareCard />
    </article>
  );
}