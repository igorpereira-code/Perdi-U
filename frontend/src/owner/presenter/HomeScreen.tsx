import { useState } from 'react';
import { HandHeart, Search, MapPin, PackageSearch } from 'lucide-react';
import { Button } from '../../core/presenter/Button';
import { INPUT_CLASSES } from '../../core/presenter/Field';

const CATEGORIES = [
  'Electrónicos',
  'Mochilas y bolsos',
  'Ropa y accesorios',
  'Llaves',
  'Botellas y termos',
  'Útiles y libros',
  'Documentos y carnets',
];

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showExplore, setShowExplore] = useState(false);

  const filteredObjects = recentFoundObjects
    .filter((item) => item.status !== 'DELIVERED')
    .filter((item) => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });

  return (
    <main className="p-4 space-y-6 max-w-lg mx-auto">
      
      {/* TARJETAS DE ACCIÓN PRINCIPALES */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateToFound}
          className="flex flex-col items-start p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:border-blue-400 transition text-left"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-[#facc15] text-blue-950 rounded-[14px] mb-4">
            <HandHeart className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-blue-950 mb-1 text-[15px]">Encontré un objeto</h3>
          <p className="text-[13px] text-neutral-500 leading-tight">Repórtalo y llévalo a Bienestar</p>
        </button>

        <button
          onClick={onNavigateToLost}
          className="flex flex-col items-start p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:border-blue-400 transition text-left"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-[#14407a] text-white rounded-[14px] mb-4">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-blue-950 mb-1 text-[15px]">Perdí un objeto</h3>
          <p className="text-[13px] text-neutral-500 leading-tight">Búsqueda inteligente asistida por IA</p>
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-neutral-900 text-sm">Oficina de objetos perdidos</h2>
        <div className="flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-sm text-neutral-900">Bienestar Estudiantil – Bloque A, planta baja</p>
            <p className="text-xs text-neutral-500 mt-0.5">Lunes a viernes, 08:00 a 18:00</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowExplore(!showExplore)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" />
          {showExplore ? 'Ocultar objetos publicados' : 'Explorar objetos publicados'}
        </Button>

        {showExplore && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="space-y-2">
              <input
                type="search"
                aria-label="Buscar objetos"
                className={INPUT_CLASSES}
                placeholder="Buscar objetos (ej. mochila negra)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                aria-label="Filtrar por categoría"
                className={INPUT_CLASSES}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {filteredObjects.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">
                {searchQuery || selectedCategory
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
          </div>
        )}
      </section>
    </main>
  );
}
