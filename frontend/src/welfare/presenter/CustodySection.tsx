import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { WelfareFoundItemView } from '@shared/welfare';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { MatchesService } from '../../matching/data/matchesService';
import { formatMatchCount } from '../../matching/logic/formatMatchCount';
import { PublishButton } from '../../matching/presenter/PublishButton';
import type { WelfareService } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';
import { buildReceptionDraft, type ReceptionDraft } from './welfarePresenter';

type CustodySectionProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
  catalogs: FoundItemCatalogs | null;
  receivedItems: WelfareFoundItemView[];
  deliveredCodes: string[];
  onStartDelivery: (item: WelfareFoundItemView) => void;
};

export function CustodySection({ welfareService, matchesService, catalogs, receivedItems, deliveredCodes, onStartDelivery }: CustodySectionProps) {
  const [items, setItems] = useState<WelfareFoundItemView[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceptionDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publicationResults, setPublicationResults] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setHasError(false);
    setItems((current) => current?.length ? current : null);
    try {
      const loaded = await welfareService.listInOffice();
      setItems((current) => {
        if (current === null) {
          return loaded;
        }
        const currentCodes = new Set(current.map((item) => item.code));
        return [...loaded.filter((item) => !currentCodes.has(item.code)), ...current];
      });
    } catch {
      setHasError(true);
    }
  }, [welfareService]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    setItems((current) => {
      const available = (current ?? []).filter((item) => !deliveredCodes.includes(item.code));
      const codes = new Set(available.map((item) => item.code));
      return [...receivedItems.filter((item) => !codes.has(item.code) && !deliveredCodes.includes(item.code)), ...available];
    });
  }, [deliveredCodes, receivedItems]);

  function updateItem(code: string, update: (item: WelfareFoundItemView) => WelfareFoundItemView) {
    setItems((current) => current?.map((item) => item.code === code ? update(item) : item) ?? current);
  }

  async function toggleVisibility(item: WelfareFoundItemView) {
    const visibility = item.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    try {
      await welfareService.setPublishedVisibility(item.code, visibility);
      updateItem(item.code, (current) => ({ ...current, visibility }));
    } catch {
      setMessage('No pudimos cambiar la visibilidad del objeto');
    }
  }

  function startEdit(item: WelfareFoundItemView) {
    setEditingCode(item.code);
    setDraft(buildReceptionDraft(item));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editingCode || !draft || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await welfareService.updatePublishedItem(editingCode, { ...draft, foundAt: new Date(draft.foundAt).toISOString() });
      updateItem(editingCode, () => updated);
      setEditingCode(null);
      setDraft(null);
    } catch {
      setMessage('No pudimos guardar los cambios del objeto');
    } finally {
      setIsSaving(false);
    }
  }

  const visibleItems = items?.filter((item) => !deliveredCodes.includes(item.code));

  return (
    <>
      <WelfareSectionHeader title="Objetos en custodia" subtitle="Objetos recibidos en la oficina. Publícalos para que la comunidad los vea." />
      {message && <div className="mb-4"><Alert>{message}</Alert></div>}
      {hasError && <div className="mb-4"><LoadErrorAlert message="No pudimos cargar los objetos en la oficina" onRetry={() => void load()} /></div>}
      {items === null ? hasError ? null : <SkeletonList rows={4} label="Cargando objetos en la oficina..." /> : visibleItems?.length === 0 ? <EmptyState title="No hay objetos en la oficina" text="No quedan objetos bajo custodia." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleItems?.map((item) => {
            const isEditing = editingCode === item.code && draft;
            return <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
              <Thumb category={item.category} photoUrl={item.photoUrl} />
              <div className="min-w-0 flex-1">
                <strong className="font-mono text-blue-700">{item.code}</strong>
                <p className="text-sm text-neutral-700">{item.description}</p>
                <div className="mt-2"><StatusChip status={item.status} /></div>
                <p className="mt-1 text-xs text-neutral-500">{item.status === 'PUBLISHED' ? item.visibility === 'VISIBLE' ? 'Visible para la comunidad' : 'Oculto para la comunidad' : 'No publicado'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status === 'IN_CUSTODY' && <PublishButton itemCode={item.code} matchesService={matchesService} onPublished={(result) => { setPublicationResults((current) => ({ ...current, [item.code]: result.matchCount })); updateItem(item.code, (current) => ({ ...current, status: 'PUBLISHED', visibility: result.visibility })); }} />}
                  {item.status === 'PUBLISHED' && <><Button onClick={() => void toggleVisibility(item)} variant="outline">{item.visibility === 'VISIBLE' ? 'Ocultar de la comunidad' : 'Mostrar a la comunidad'}</Button><Button onClick={() => startEdit(item)} variant="outline">Editar datos</Button></>}
                  <Button onClick={() => onStartDelivery(item)} variant="outline">Registrar entrega</Button>
                </div>
                {publicationResults[item.code] !== undefined && <div role="status" className="mt-3 rounded-xl bg-success-50 p-2 text-sm text-success-700"><p className="font-medium">{item.visibility === 'VISIBLE' ? 'Publicado: la comunidad ya puede ver este objeto.' : 'Publicado como oculto para la comunidad.'}</p><p>{formatMatchCount(publicationResults[item.code])}</p></div>}
                {isEditing && <form onSubmit={save} className="mt-4 space-y-3 rounded-xl bg-neutral-50 p-3">
                  <label className="block text-sm font-medium">Descripción publicada<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1 w-full rounded-xl border border-neutral-300 p-2" required /></label>
                  <label className="block text-sm font-medium">Categoría publicada<select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: Number(event.target.value) })} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3">{(catalogs?.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className="block text-sm font-medium">Lugar publicado<select value={draft.placeId} onChange={(event) => setDraft({ ...draft, placeId: Number(event.target.value), classroomId: null })} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3">{(catalogs?.places ?? []).map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
                  <label className="block text-sm font-medium">Referencia publicada<input value={draft.placeReference ?? ''} onChange={(event) => setDraft({ ...draft, placeReference: event.target.value || null })} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 px-3" /></label>
                  <label className="block text-sm font-medium">Fecha publicada<input type="datetime-local" value={draft.foundAt} onChange={(event) => setDraft({ ...draft, foundAt: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 px-3" required /></label>
                  <div className="flex gap-2"><Button type="submit" isLoading={isSaving} loadingText="Guardando…">Guardar cambios</Button><Button type="button" variant="outline" onClick={() => { setEditingCode(null); setDraft(null); }}>Cancelar</Button></div>
                </form>}
              </div>
            </article>;
          })}
        </div>
      )}
    </>
  );
}
