import {
  Archive,
  ClipboardList,
  FileSearch,
  HandCoins,
  Inbox,
  PackageCheck,
  PackagePlus,
} from 'lucide-react';
import type { WelfareSection } from './welfarePresenter';

type WelfareNavigationProps = {
  activeSection: WelfareSection;
  counts: Partial<Record<WelfareSection, number>>;
  onSelect: (section: WelfareSection) => void;
};

const entries = [
  { id: 'reports', label: 'Reportes de pérdida', icon: FileSearch },
  { id: 'requests', label: 'Solicitudes de hallazgo', icon: Inbox },
  { id: 'register', label: 'Registrar objeto', icon: PackagePlus },
  { id: 'custody', label: 'Objetos en custodia', icon: Archive },
  { id: 'pickups', label: 'Recojos pendientes', icon: HandCoins },
  { id: 'delivery', label: 'Registrar entrega', icon: PackageCheck },
  { id: 'deliveries', label: 'Entregas realizadas', icon: ClipboardList },
] satisfies Array<{ id: WelfareSection; label: string; icon: typeof Inbox }>;

export function WelfareNavigation({ activeSection, counts, onSelect }: WelfareNavigationProps) {
  return (
    <aside className="md:w-64 md:shrink-0">
      <h1 className="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase md:block">
        Panel de Bienestar
      </h1>
      <nav
        aria-label="Secciones de Bienestar"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0"
      >
        {entries.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeSection === id}
            onClick={() => onSelect(id)}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              activeSection === id
                ? 'bg-blue-50 text-blue-500'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="flex-1 text-left whitespace-nowrap">{label}</span>
            {!!counts[id] && (
              <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-blue-700">
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
