import { useEffect, useState } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import type { FoundItemCatalogs } from '../data/foundItemsService';
import type { FoundItemsService } from '../data/foundItemsService';
import { FoundItemForm } from './FoundItemForm';

export function FoundItemScreen({ foundItemsService }: { foundItemsService: FoundItemsService }) {
  const [catalogs, setCatalogs] = useState<FoundItemCatalogs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isRequestActive = true;
    setCatalogs(null);
    setError(null);
    foundItemsService.getCatalogs()
      .then((loadedCatalogs) => { if (isRequestActive) { setCatalogs(loadedCatalogs); } })
      .catch((failure: unknown) => {
        if (isRequestActive) { setError(failure instanceof Error ? failure.message : 'No se pudieron cargar las categorías y ubicaciones.'); }
      });
    return () => { isRequestActive = false; };
  }, [foundItemsService, retryCount]);

  if (error) {
    return <div className="mx-auto max-w-lg space-y-4">
      <div role="alert"><Alert>{error}</Alert></div>
      <Button onClick={() => setRetryCount((previousRetryCount) => previousRetryCount + 1)}>Reintentar</Button>
    </div>;
  }
  if (!catalogs) {
    return <p role="status" className="text-sm text-neutral-500">Cargando categorías y ubicaciones…</p>;
  }
  return <FoundItemForm catalogs={catalogs} onCreate={foundItemsService.create} />;
}
