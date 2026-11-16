import { useSearchParams } from 'react-router-dom';
import {
  ChartColumn,
  ChevronDown,
  MapPin,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { SettingsService } from '../../core/data/settingsService';
import type { AdminCatalogService } from '../data/adminCatalogService';
import type { AdminUsersService } from '../data/adminUsersService';
import type { StatisticsService } from '../data/statisticsService';
import { CategoriesSection } from './CategoriesSection';
import { PlacesSection } from './PlacesSection';
import { SettingsSection } from './SettingsSection';
import { StatisticsSection } from './StatisticsSection';
import { UsersSection } from './UsersSection';

type AdminPageProps = {
  adminUsersService: AdminUsersService;
  adminCatalogService: AdminCatalogService;
  settingsService: SettingsService;
  statisticsService: StatisticsService;
};

type AdminSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'General' | 'Gestión';
  description: string;
};

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: 'estadisticas',
    label: 'Estadísticas',
    icon: ChartColumn,
    group: 'General',
    description: 'Cuántos objetos se encontraron, perdieron y entregaron con Perdi-U.',
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    icon: Settings,
    group: 'General',
    description: 'La ubicación y el horario de Bienestar, y el nivel mínimo de las coincidencias.',
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: Users,
    group: 'Gestión',
    description: 'Asigna o quita el rol de Bienestar al personal de la universidad.',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    icon: Tags,
    group: 'Gestión',
    description: 'Las categorías que se eligen al reportar un objeto.',
  },
  {
    id: 'lugares',
    label: 'Lugares',
    icon: MapPin,
    group: 'Gestión',
    description: 'Los bloques y espacios del campus, con las aulas de cada bloque.',
  },
];

const SECTION_GROUPS = ['General', 'Gestión'] as const;

type SectionMenuProps = {
  selected: AdminSection;
  onSelect: (sectionId: string) => void;
};

type SidebarItemProps = {
  section: AdminSection;
  isSelected: boolean;
  onSelect: (sectionId: string) => void;
};

function SidebarItem({ section, isSelected, onSelect }: SidebarItemProps) {
  const Icon = section.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      aria-current={isSelected ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
        isSelected ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100'
      }`}
    >
      <span
        className={`h-5 w-1 rounded-full ${isSelected ? 'bg-yellow-500' : 'bg-transparent'}`}
        aria-hidden="true"
      />
      <Icon className="h-4 w-4" aria-hidden="true" />
      {section.label}
    </button>
  );
}

/** The left panel, only on big screens. */
function AdminSidebar({ selected, onSelect }: SectionMenuProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-neutral-0 p-4 lg:block">
      <div className="sticky top-4 space-y-6">
        <p className="flex items-center gap-2 px-2 text-base font-semibold text-blue-700">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Administración
        </p>
        {SECTION_GROUPS.map((group) => (
          <nav key={group} aria-label={group} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              {group}
            </p>
            {ADMIN_SECTIONS.filter((section) => section.group === group).map((section) => (
              <SidebarItem
                key={section.id}
                section={section}
                isSelected={section.id === selected.id}
                onSelect={onSelect}
              />
            ))}
          </nav>
        ))}
      </div>
    </aside>
  );
}

/** On phones the panel does not fit, so the sections are chosen in a list. */
function SectionPicker({ selected, onSelect }: SectionMenuProps) {
  const Icon = selected.icon;
  return (
    <div className="space-y-1 lg:hidden">
      <label htmlFor="admin-section" className="text-xs font-semibold text-neutral-500">
        Sección
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-700"
          aria-hidden="true"
        />
        <select
          id="admin-section"
          value={selected.id}
          onChange={(event) => onSelect(event.target.value)}
          className="w-full appearance-none rounded-xl border border-neutral-300 bg-neutral-0 py-2.5 pr-10 pl-9 text-sm font-semibold text-blue-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300/30"
        >
          {SECTION_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {ADMIN_SECTIONS.filter((section) => section.group === group).map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function SectionHeader({ section }: { section: AdminSection }) {
  return (
    <div className="space-y-1">
      <p className="hidden text-xs font-semibold text-neutral-500 lg:block">
        Administración / {section.group}
      </p>
      <h2 className="text-xl font-semibold text-blue-700 lg:text-2xl">{section.label}</h2>
      <p className="text-sm text-neutral-500">{section.description}</p>
    </div>
  );
}

/** The Administrator's page: statistics, settings, users, categories and places. */
export function AdminPage({
  adminUsersService,
  adminCatalogService,
  settingsService,
  statisticsService,
}: AdminPageProps) {
  // The section is kept in the address (?seccion=usuarios), so reloading the page keeps it.
  const [searchParams, setSearchParams] = useSearchParams();
  const selected =
    ADMIN_SECTIONS.find((section) => section.id === searchParams.get('seccion')) ??
    ADMIN_SECTIONS[0];

  function selectSection(sectionId: string) {
    setSearchParams({ seccion: sectionId });
  }

  return (
    <div className="lg:-m-4 lg:flex lg:min-h-[calc(100vh-7rem)]">
      <AdminSidebar selected={selected} onSelect={selectSection} />
      <section className="mx-auto w-full max-w-lg space-y-5 lg:max-w-5xl lg:p-8">
        <h1 className="text-lg font-semibold text-blue-700 lg:hidden">Administración</h1>
        <SectionPicker selected={selected} onSelect={selectSection} />
        <SectionHeader section={selected} />
        {selected.id === 'estadisticas' && (
          <StatisticsSection statisticsService={statisticsService} />
        )}
        {selected.id === 'ajustes' && <SettingsSection settingsService={settingsService} />}
        {selected.id === 'usuarios' && <UsersSection adminUsersService={adminUsersService} />}
        {selected.id === 'categorias' && (
          <CategoriesSection adminCatalogService={adminCatalogService} />
        )}
        {selected.id === 'lugares' && <PlacesSection adminCatalogService={adminCatalogService} />}
      </section>
    </div>
  );
}
