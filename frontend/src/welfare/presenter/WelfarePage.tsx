import { useEffect, useState, type FormEvent } from 'react';
import type { WelfareFoundItemView, WelfarePendingPickupView } from '@shared/welfare';
import type { WelfareService } from '../data/welfareService';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { InfoRow } from '../../core/presenter/InfoRow';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { MatchesService } from '../../matching/data/matchesService';
import { PublishButton } from '../../matching/presenter/PublishButton';

type WelfarePageProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
};

export function WelfarePage({ welfareService, matchesService }: WelfarePageProps) {
  const [pendingPickups, setPendingPickups] = useState<WelfarePendingPickupView[] | null>(null);
  const [items, setItems] = useState<WelfareFoundItemView[] | null>(null);
  const [inOfficeItems, setInOfficeItems] = useState<WelfareFoundItemView[] | null>(null);
  const [publishedCodes, setPublishedCodes] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<WelfareFoundItemView | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    welfareService
      .listPendingPickups()
      .then(setPendingPickups)
      .catch(() => setPendingPickups([]));
  }, [welfareService]);

  useEffect(() => {
    welfareService
      .listPending()
      .then(setItems)
      .catch(() => {
        setItems([]);
        setMessage('No pudimos cargar los objetos pendientes');
      });
  }, [welfareService]);

  useEffect(() => {
    welfareService
      .listInOffice()
      .then((loadedItems) =>
        setInOfficeItems((current) => {
          if (current === null) {
            return loadedItems;
          }
          const currentCodes = new Set(current.map((item) => item.code));
          return [...loadedItems.filter((item) => !currentCodes.has(item.code)), ...current];
        }),
      )
      .catch(() => setInOfficeItems((current) => current ?? []));
  }, [welfareService]);

  async function search(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await welfareService.findByCode(code);
      if (result.status === 'FOUND') {
        setSelected(result.item);
        return;
      }
      setSelected(null);
      setMessage(
        result.status === 'NOT_FOUND'
          ? 'No encontramos un objeto con ese código'
          : 'Este objeto ya fue recibido',
      );
    } catch {
      setMessage('No pudimos buscar el objeto');
    }
  }

  async function receive() {
    if (!selected || receiving) {
      return;
    }
    setReceiving(true);
    setMessage(null);
    try {
      const result = await welfareService.receive(selected.code);
      if (result.status !== 'FOUND') {
        setMessage('Este objeto ya fue recibido');
        return;
      }
      setItems((current) => current?.filter((item) => item.code !== selected.code) ?? []);
      setInOfficeItems((current) => [...(current ?? []), result.item]);
      setSelected(null);
      setMessage('Objeto recibido y puesto en custodia');
    } catch {
      setMessage('No pudimos confirmar la recepción');
    } finally {
      setReceiving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-blue-700">Panel de Bienestar</h1>
      <form onSubmit={search} className="flex items-end gap-3">
        <div className="flex-1">
          <Field id="found-item-code" label="Código del objeto">
            <input id="found-item-code" className={INPUT_CLASSES} value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
        </div>
        <Button type="submit">Buscar</Button>
      </form>
      {message && <Alert>{message}</Alert>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Recojos pendientes</h2>
        {pendingPickups === null ? (
          <p>Cargando recojos pendientes...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingPickups.map((pickup) => (
              <article key={pickup.matchId} className="space-y-1 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                <strong>{pickup.owner.name}</strong>
                <p>{pickup.owner.email}</p>
                <p>Reporte: <span>{pickup.report.code}</span></p>
                <p>Objeto: <span>{pickup.foundItem.code}</span></p>
                <p>{pickup.foundItem.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Objetos pendientes de recepción</h2>
        {items === null ? (
          <p>Cargando objetos pendientes...</p>
        ) : items.length === 0 ? (
          <EmptyState title="No hay objetos pendientes" text="No quedan objetos por recibir en la oficina." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                <Thumb category={item.category} photoUrl={item.photoUrl} />
                <div><strong>{item.code}</strong><p>{item.description}</p><StatusChip status={item.status} /></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Objetos en la oficina</h2>
        {inOfficeItems === null ? (
          <p>Cargando objetos en la oficina...</p>
        ) : inOfficeItems.length === 0 ? (
          <EmptyState title="No hay objetos en la oficina" text="No quedan objetos bajo custodia." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {inOfficeItems.map((item) => {
              const displayedStatus = publishedCodes.has(item.code) ? 'PUBLISHED' : item.status;
              return (
                <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                  <Thumb category={item.category} photoUrl={item.photoUrl} />
                  <div>
                    <strong>{item.code}</strong>
                    <p>{item.description}</p>
                    <StatusChip status={displayedStatus} />
                    <p>{displayedStatus === 'PUBLISHED' ? 'Publicado' : 'No publicado'}</p>
                    {item.status === 'IN_CUSTODY' && (
                      <PublishButton
                        itemCode={item.code}
                        matchesService={matchesService}
                        onPublished={() =>
                          setPublishedCodes((current) => new Set(current).add(item.code))
                        }
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
          <h2 className="text-lg font-semibold text-blue-700">Detalle del objeto</h2>
          <dl>
            <InfoRow label="Código" value={selected.code} />
            <InfoRow label="Descripción" value={selected.description} />
            <InfoRow label="Categoría" value={selected.category} />
            <InfoRow label="Lugar" value={selected.place} />
            {selected.classroom && <InfoRow label="Aula" value={selected.classroom} />}
            {selected.finder && <><InfoRow label="Hallador" value={selected.finder.name} /><InfoRow label="Correo" value={selected.finder.email} /></>}
          </dl>
          <Button onClick={receive} disabled={receiving} className="mt-4">
            Confirmar recepción
          </Button>
        </section>
      )}
    </main>
  );
}
