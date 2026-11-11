import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import type { FoundItemCatalogs, FoundItemPayload, FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { FoundItemForm } from './FoundItemForm';
import { FoundItemSummary } from './FoundItemSummary';

function ReportDetails({ code, foundItemsService }: { code: string; foundItemsService: FoundItemsService }) {
  const navigate = useNavigate();
  const [report, setReport] = useState<MyFoundItem | null | undefined>(undefined);
  const [hasFailed, setHasFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [edit, setEdit] = useState<{ initial: FoundItemPayload; catalogs: FoundItemCatalogs } | null>(null);
  const [isOpeningEdit, setIsOpeningEdit] = useState(false);
  const [editError, setEditError] = useState('');

  async function openEdit() {
    setIsOpeningEdit(true);
    setEditError('');
    try {
      const [initial, catalogs] = await Promise.all([
        foundItemsService.getEditable(code), foundItemsService.getCatalogs(),
      ]);
      setEdit({ initial, catalogs });
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'No se pudo cargar el reporte para editar.');
    } finally {
      setIsOpeningEdit(false);
    }
  }

  useEffect(() => {
    let isRequestActive = true;
    setReport(undefined);
    setHasFailed(false);
    foundItemsService.getMineByCode(code)
      .then((loadedReport) => { if (isRequestActive) { setReport(loadedReport); } })
      .catch(() => { if (isRequestActive) { setHasFailed(true); } });
    return () => { isRequestActive = false; };
  }, [foundItemsService, code, retryCount]);

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <BackHeader title="Detalle del reporte" onBack={() => navigate('/mis-reportes')} />
      {hasFailed ? (
        <div className="space-y-3">
          <div role="alert"><Alert>No se pudo cargar el reporte. Intenta nuevamente.</Alert></div>
          <Button onClick={() => setRetryCount((previousRetryCount) => previousRetryCount + 1)}>Reintentar</Button>
        </div>
      ) : report === undefined ? (
        <p role="status" className="text-sm text-neutral-500">Cargando el reporte…</p>
      ) : report === null ? (
        <EmptyState title="No encontramos este reporte" text="Revisa que el código corresponda a uno de tus objetos encontrados." />
      ) : edit ? (
        <>
          <FoundItemForm catalogs={edit.catalogs} edit={{ initial: edit.initial, onSave: async (changes) => {
            await foundItemsService.updatePending(code, changes);
            setEdit(null);
            setRetryCount((count) => count + 1);
          } }} />
          <Button onClick={() => setEdit(null)}>Volver al detalle</Button>
        </>
      ) : (
        <article className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
          <FoundItemSummary report={report} foundItemsService={foundItemsService} />
          {report.status === 'PENDING_DROP_OFF' && (
            <Button onClick={openEdit} isLoading={isOpeningEdit} loadingText="Cargando reporte…">Editar reporte</Button>
          )}
          {editError && <div role="alert"><Alert>{editError}</Alert></div>}
        </article>
      )}
    </section>
  );
}

export function MyFoundItemScreen({ foundItemsService }: { foundItemsService: FoundItemsService }) {
  const { code = '' } = useParams();
  return <ReportDetails key={code} code={code} foundItemsService={foundItemsService} />;
}
