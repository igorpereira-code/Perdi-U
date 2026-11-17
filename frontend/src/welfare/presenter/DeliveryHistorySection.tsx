import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { WelfareDeliveryView } from '@shared/welfare';
import { EmptyState } from '../../core/presenter/EmptyState';
import { INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import type { WelfareService } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';
import { formatDate } from './welfarePresenter';

export function DeliveryHistorySection({ welfareService }: { welfareService: WelfareService }) {
  const [deliveries, setDeliveries] = useState<WelfareDeliveryView[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState('');

  const loadDeliveries = useCallback(async () => {
    setHasError(false);
    setDeliveries(null);
    try {
      setDeliveries(await welfareService.listDeliveries());
    } catch {
      setHasError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = deliveries?.filter((delivery) =>
    [delivery.foundItem.code, delivery.recipient.name, delivery.recipient.email].some((value) =>
      value.toLocaleLowerCase().includes(normalizedSearch),
    ),
  );

  return (
    <>
      <WelfareSectionHeader title="Entregas realizadas" subtitle="Consulta quién recibió cada objeto y cuándo fue entregado." />
      <label className="mb-4 block max-w-xl">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Buscar por código, nombre o correo</span>
        <div className="relative">
          <Search aria-hidden="true" className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input type="search" aria-label="Buscar entregas" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. HZ-0008, Luis o correo@ucb.edu.bo" className={`${INPUT_CLASSES} pl-10`} />
        </div>
      </label>
      {hasError ? (
        <LoadErrorAlert message="No pudimos cargar las entregas realizadas" onRetry={() => void loadDeliveries()} />
      ) : deliveries === null ? (
        <SkeletonList rows={3} label="Cargando entregas realizadas..." />
      ) : deliveries.length === 0 ? (
        <EmptyState title="Todavía no hay entregas realizadas" text="Cuando se registre una entrega, aparecerá en este historial." />
      ) : filtered?.length === 0 ? (
        <EmptyState title="No encontramos entregas" text="Prueba con otro código, nombre o correo institucional." />
      ) : (
        <div className="space-y-3">
          {filtered?.map((delivery) => (
            <article key={`${delivery.foundItem.code}-${delivery.deliveredAt}`} className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-mono text-blue-700">{delivery.foundItem.code}</strong>
                  <span className="text-sm text-neutral-700">{delivery.foundItem.description}</span>
                </div>
                <p className="mt-2 font-medium text-neutral-800">{delivery.recipient.name}</p>
                <p className="truncate text-sm text-neutral-500">{delivery.recipient.email}</p>
                <p className="text-xs text-neutral-500">Código universitario: {delivery.recipient.universityCode}</p>
              </div>
              <time dateTime={delivery.deliveredAt} className="text-sm font-medium text-neutral-600 sm:text-right">{formatDate(delivery.deliveredAt)}</time>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
