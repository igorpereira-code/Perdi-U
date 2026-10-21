import { useEffect, useState } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { INPUT_CLASSES } from '../../core/presenter/Field';
import type { FoundItemsService } from '../../finder/data/foundItemsService';
import { formatReportDate } from '../../finder/logic/formatReportDate';
import { FoundItemPhoto } from '../../finder/presenter/FoundItemPhoto';
import type { CatalogItem, CatalogService } from '../data/catalogService';
import { filterCatalog } from '../logic/filterCatalog';

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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

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

  const categories = items ? [...new Set(items.map((item) => item.category))].sort() : [];
  const visible = items ? filterCatalog(items, { query, category }) : [];

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
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="catalog-search" className="sr-only">
                Buscar objetos
              </label>
              <input
                id="catalog-search"
                type="search"
                className={INPUT_CLASSES}
                placeholder="Buscar, por ejemplo: mochila negra"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="catalog-category" className="sr-only">
                Categoría
              </label>
              <select
                id="catalog-category"
                className={INPUT_CLASSES}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              title="No encontramos objetos con esa búsqueda"
              text="Prueba con otras palabras o con otra categoría."
            />
          ) : (
            <ul aria-label="Objetos encontrados" className="space-y-3">
              {visible.map((item) => (
                <li key={item.code}>
                  <CatalogCard item={item} foundItemsService={foundItemsService} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}