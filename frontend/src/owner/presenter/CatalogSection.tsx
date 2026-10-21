import { useEffect, useState } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import type { FoundItemsService } from '../../finder/data/foundItemsService';
import { formatReportDate } from '../../finder/logic/formatReportDate';
import { FoundItemPhoto } from '../../finder/presenter/FoundItemPhoto';
import type { CatalogItem, CatalogService } from '../data/catalogService';

type CatalogSectionProps = {
  catalogService: Pick<CatalogService, 'list'>;
  foundItemsService: Pick<FoundItemsService, 'getPhotoUrl'>;
};

function CatalogCard({ item, foundItemsService }: { item: CatalogItem } & Pick<CatalogSectionProps, 'foundItemsService'>) {
  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <FoundItemPhoto report={item} foundItemsService={foundItemsService} />
      <div className="min-w-0 space-y-1">
        <p className="break-words text-sm font-medium text-neutral-900">{item.description}</p>
        <p className="text-sm text-neutral-500">
          {item.category} · {item.place}
        </p>
        <p className="text-xs text-neutral-500">
          {item.code} · Encontrado el <time dateTime={item.foundAt}>{formatReportDate(item.foundAt)}</time>
        </p>
      </div>
    </div>
  );
}

/** Home section with the found items that Bienestar published. */
export function CatalogSection({ catalogService, foundItemsService }: CatalogSectionProps) {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setItems(null);
    setFailed(false);
    catalogService
      .list()
      .then((data) => {
        if (active) {
          setItems(data);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [catalogService, attempt]);


  return (
    <section aria-labelledby="catalog-title" className="space-y-3">
      <div className="space-y-1">
        <h2 id="catalog-title" className="text-base font-semibold text-blue-700">
          Objetos encontrados
        </h2>
        <p className="text-sm text-neutral-500">Últimos objetos que Bienestar Estudiantil tiene en su oficina.</p>
      </div>

      {failed ? (
        <div className="space-y-3">
          <div role="alert">
            <Alert>No se pudieron cargar los objetos encontrados. Intenta nuevamente.</Alert>
          </div>
          <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : items === null ? (
        <p role="status" className="text-sm text-neutral-500">
          Cargando objetos encontrados…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Todavía no hay objetos publicados"
          text="Cuando Bienestar publique un objeto encontrado, aparecerá aquí."
        />
      ) : (
        <ul aria-label="Objetos encontrados" className="space-y-3">
          {items.map((item) => (
            <li key={item.code}>
              <CatalogCard item={item} foundItemsService={foundItemsService} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}