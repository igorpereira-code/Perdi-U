import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PackageCheck, Search } from 'lucide-react';
import type { WelfareFoundItemView } from '@shared/welfare';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { InfoRow } from '../../core/presenter/InfoRow';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { WelfareService } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';
import { buildReceptionDraft, type ReceptionDraft } from './welfarePresenter';

type PendingRequestsSectionProps = {
  welfareService: WelfareService;
  catalogs: FoundItemCatalogs | null;
  onCountChange: (count: number) => void;
  onReceived: (item: WelfareFoundItemView) => void;
};

export function PendingRequestsSection({ welfareService, catalogs, onCountChange, onReceived }: PendingRequestsSectionProps) {
  const [items, setItems] = useState<WelfareFoundItemView[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [selected, setSelected] = useState<WelfareFoundItemView | null>(null);
  const [searchedCode, setSearchedCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [draft, setDraft] = useState<ReceptionDraft | null>(null);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setHasError(false);
    setItems(null);
    try {
      const loaded = await welfareService.listPending();
      setItems(loaded);
      onCountChange(loaded.length);
    } catch {
      setHasError(true);
    }
  }, [onCountChange, welfareService]);

  useEffect(() => { void load(); }, [load]);

  function select(item: WelfareFoundItemView) {
    setSelected(item);
    setDraft(buildReceptionDraft(item));
    setIsConfirmingDeletion(false);
  }

  function updateDraft<FieldName extends keyof ReceptionDraft>(field: FieldName, value: ReceptionDraft[FieldName]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (isSearching) {
      return;
    }
    setIsSearching(true);
    setMessage(null);
    try {
      const result = await welfareService.findFoundItemByCode(searchedCode);
      if (result.status === 'FOUND') {
        select(result.item);
        return;
      }
      setSelected(null);
      setDraft(null);
      setMessage(result.status === 'NOT_FOUND' ? 'No encontramos un objeto con ese código' : 'Este objeto ya fue recibido');
    } catch {
      setMessage('No pudimos buscar el objeto');
    } finally {
      setIsSearching(false);
    }
  }

  async function confirmReception() {
    if (!selected || !draft || isReceiving) {
      return;
    }
    setIsReceiving(true);
    setMessage(null);
    try {
      const result = await welfareService.confirmReception(selected.code, { ...draft, foundAt: new Date(draft.foundAt).toISOString() });
      if (result.status !== 'FOUND') {
        setMessage('Este objeto ya fue recibido');
        return;
      }
      const remaining = items?.filter((item) => item.code !== selected.code) ?? [];
      setItems(remaining);
      onCountChange(remaining.length);
      onReceived(result.item);
      setSelected(null);
      setDraft(null);
      setMessage('Objeto recibido y puesto en custodia');
    } catch {
      setMessage('No pudimos confirmar la recepción');
    } finally {
      setIsReceiving(false);
    }
  }

  async function deleteRequest() {
    if (!selected || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setMessage(null);
    try {
      if (!await welfareService.deletePending(selected.code)) {
        setMessage('La solicitud ya no está disponible para eliminar');
        return;
      }
      const remaining = items?.filter((item) => item.code !== selected.code) ?? [];
      setItems(remaining);
      onCountChange(remaining.length);
      setSelected(null);
      setDraft(null);
      setIsConfirmingDeletion(false);
      setMessage('Solicitud eliminada');
    } catch {
      setMessage('No pudimos eliminar la solicitud');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <WelfareSectionHeader title="Solicitudes de hallazgo" subtitle="Reportes privados esperando que el hallador traiga el objeto." />
      {message && <div className="mb-4"><Alert>{message}</Alert></div>}
      <form onSubmit={search} className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          <label htmlFor="found-item-code" className="sr-only">Código del objeto</label>
          <input id="found-item-code" className={`${INPUT_CLASSES} pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case`} value={searchedCode} onChange={(event) => setSearchedCode(event.target.value)} placeholder="Buscar por ID, ej. HZ-0007" disabled={isSearching} />
        </div>
        <Button type="submit" isLoading={isSearching} loadingText="Buscando…">Buscar</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          <h2 className="sr-only">Objetos pendientes de recepción</h2>
          {hasError ? <LoadErrorAlert message="No pudimos cargar los objetos pendientes" onRetry={() => void load()} /> : items === null ? <SkeletonList rows={3} label="Cargando objetos pendientes..." /> : items.length === 0 ? <EmptyState title="No hay objetos pendientes" text="No quedan objetos por recibir en la oficina." /> : items.map((item) => (
            <article key={item.code}><button type="button" onClick={() => select(item)} className={`flex w-full items-center gap-3 rounded-2xl border bg-neutral-0 p-3 text-left ${selected?.code === item.code ? 'border-blue-300 ring-2 ring-blue-300/20' : 'border-neutral-200'}`}><Thumb category={item.category} photoUrl={item.photoUrl} /><div className="min-w-0 flex-1"><p className="font-mono text-sm font-bold text-blue-700">{item.code}</p><p className="truncate text-sm text-neutral-700">{item.description}</p><p className="text-xs text-neutral-500">{item.finder?.name}</p></div><StatusChip status={item.status} /></button></article>
          ))}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <section className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-mono text-2xl font-bold text-blue-700">{selected.code}</h2><StatusChip status={selected.status} /></div>
              <Thumb category={selected.category} photoUrl={selected.photoUrl} />
              {draft && <div className="space-y-3">
                <Field id="reception-description" label="Descripción del objeto"><textarea id="reception-description" className={INPUT_CLASSES} value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} /></Field>
                <Field id="reception-category" label="Categoría del objeto"><select id="reception-category" className={INPUT_CLASSES} value={draft.categoryId} onChange={(event) => updateDraft('categoryId', Number(event.target.value))}>{(catalogs?.categories ?? [{ id: selected.categoryId, name: selected.category }]).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
                <Field id="reception-place" label="Lugar del hallazgo"><select id="reception-place" className={INPUT_CLASSES} value={draft.placeId} onChange={(event) => { updateDraft('placeId', Number(event.target.value)); updateDraft('classroomId', null); }}>{(catalogs?.places ?? [{ id: selected.placeId, name: selected.place, type: 'SPACE' as const, classrooms: [] }]).map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></Field>
                <Field id="reception-found-at" label="Fecha del hallazgo"><input id="reception-found-at" type="datetime-local" className={INPUT_CLASSES} value={draft.foundAt} onChange={(event) => updateDraft('foundAt', event.target.value)} /></Field>
              </div>}
              <dl>{selected.classroom && <InfoRow label="Aula" value={selected.classroom} />}{selected.finder && <><InfoRow label="Hallador" value={selected.finder.name} /><InfoRow label="Correo" value={selected.finder.email} /></>}</dl>
              <Button onClick={confirmReception} isLoading={isReceiving} loadingText="Confirmando recepción…" className="w-full" disabled={!draft}><PackageCheck className="h-4 w-4" aria-hidden="true" />Confirmar recepción</Button>
              {isConfirmingDeletion ? <Alert><p className="mb-3">¿Confirmas que el objeto nunca llegó a la oficina?</p><div className="flex flex-wrap gap-2"><Button onClick={() => void deleteRequest()} isLoading={isDeleting} loadingText="Eliminando…">Sí, eliminar</Button><Button variant="outline" onClick={() => setIsConfirmingDeletion(false)} disabled={isDeleting}>Cancelar</Button></div></Alert> : <Button variant="outline" onClick={() => setIsConfirmingDeletion(true)} className="w-full">Eliminar solicitud</Button>}
            </section>
          ) : <EmptyState title="Selecciona una solicitud" text="Busca el ID que te muestra el hallador para ver el detalle." />}
        </div>
      </div>
    </>
  );
}
