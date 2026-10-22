import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { EmptyState } from '../../core/presenter/EmptyState';
import { InfoRow } from '../../core/presenter/InfoRow';
import { WelfareCard } from '../../core/presenter/WelfareCard';
import type { FoundItemsService } from '../../finder/data/foundItemsService';
import { formatReportDate } from '../../finder/logic/formatReportDate';
import { FoundItemPhoto } from '../../finder/presenter/FoundItemPhoto';
import type { CatalogItem, CatalogService } from '../data/catalogService';

type CatalogItemScreenProps = {
  catalogService: Pick<CatalogService, 'getByCode'>;
  foundItemsService: Pick<FoundItemsService, 'getPhotoUrl'>;
};

type ScreenState = { status: 'loading' } | { status: 'missing' } | { status: 'failed' } | { status: 'ready'; item: CatalogItem };

const BACK_LINK = 'inline-flex text-sm font-semibold text-blue-500';

/** Detail of a published found item. */
export function CatalogItemScreen({ catalogService, foundItemsService }: CatalogItemScreenProps) {
  const { code = '' } = useParams();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    catalogService
      .getByCode(code)
      .then((item) => {
        if (active) {
          setState(item ? { status: 'ready', item } : { status: 'missing' });
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
  }, [catalogService, code]);

  if (state.status === 'loading') {
    return <p role="status" className="text-sm text-neutral-500">Cargando el objeto…</p>;
  }
  if (state.status === 'failed') {
    return (
      <div role="alert" className="mx-auto max-w-lg">
        <Alert>No se pudo cargar el objeto. Intenta nuevamente.</Alert>
      </div>
    );
  }
  if (state.status === 'missing') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <EmptyState
          title="No encontramos este objeto"
          text="Puede que ya haya sido entregado a su dueño o que el código no sea correcto."
        />
        <Link to="/" className={BACK_LINK}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { item } = state;
  return (
    <article className="mx-auto max-w-lg space-y-4">
      <Link to="/" className={BACK_LINK}>
        Volver al inicio
      </Link>
      <h1 className="text-lg font-semibold text-blue-700">Detalle del objeto</h1>
      <div className="flex gap-3">
        <FoundItemPhoto report={item} foundItemsService={foundItemsService} />
        <p className="min-w-0 break-words text-base text-neutral-900">{item.description}</p>
      </div>
      <dl className="rounded-2xl border border-neutral-200 bg-neutral-0 px-4">
        <InfoRow label="Código" value={item.code} />
        <InfoRow label="Categoría" value={item.category} />
        <InfoRow label="Lugar" value={item.place} />
        {item.placeReference && <InfoRow label="Referencia" value={item.placeReference} />}
        <InfoRow label="Fecha" value={formatReportDate(item.foundAt)} />
      </dl>
      <section aria-labelledby="ask-welfare-title" className="space-y-2">
        <h2 id="ask-welfare-title" className="text-base font-semibold text-blue-700">
          ¿Es tuyo?
        </h2>
        <p className="text-sm text-neutral-700">
          Acércate a Bienestar Estudiantil con el código {item.code} para preguntar por él.
        </p>
        <WelfareCard />
      </section>
    </article>
  );
}