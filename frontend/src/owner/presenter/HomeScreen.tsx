import { useState } from 'react';
import { Button } from '../../core/presenter/Button';
import { INPUT_CLASSES } from '../../core/presenter/Field';

export type FoundObjectSummary = {
  id: string;
  code: string;
  description: string;
  category: string;
  place?: string;
  foundDate?: string;
  status?: string;
  photoUrl?: string;
};

type HomeScreenProps = {
  onNavigateToLost?: () => void;
  onNavigateToFound?: () => void;
  recentFoundObjects?: FoundObjectSummary[];
  onSelectObject?: (item: FoundObjectSummary) => void;
};

export function HomeScreen({
  onNavigateToLost,
  onNavigateToFound,
  recentFoundObjects = [],
  onSelectObject,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObjects = recentFoundObjects.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  return (
    <main className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onNavigateToFound}>
          Encontré un objeto
        </Button>
        <Button variant="primary" onClick={onNavigateToLost}>
          Perdí un objeto
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-neutral-900 text-lg">
          Últimos objetos publicados
        </h2>

        <div>
          <input
            type="search"
            aria-label="Buscar objetos"
            className={INPUT_CLASSES}
            placeholder="Buscar objetos (ej. mochila negra)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredObjects.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">
            {searchQuery
              ? 'No se encontraron objetos que coincidan con la búsqueda.'
              : 'No hay objetos publicados recientemente.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredObjects.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectObject?.(item)}
                className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-blue-400 transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500">{item.code}</span>
                  <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-medium text-neutral-900">{item.description}</h3>
                {item.place && (
                  <p className="text-xs text-neutral-500">Lugar: {item.place}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}