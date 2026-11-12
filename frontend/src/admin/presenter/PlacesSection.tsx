import { useCallback } from 'react';
import { MapPin } from 'lucide-react';
import type { ManagedClassroom, ManagedPlace } from '@shared/admin';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminCatalogService } from '../data/adminCatalogService';
import { formatPlaceType } from '../logic/formatPlaceType';
import { ActiveChip } from './ActiveChip';

type PlacesSectionProps = {
  adminCatalogService: AdminCatalogService;
};

function ClassroomRow({ classroom }: { classroom: ManagedClassroom }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">{classroom.name}</span>
      <ActiveChip active={classroom.active} />
    </li>
  );
}

function PlaceCard({ place }: { place: ManagedPlace }) {
  return (
    <li className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{place.name}</p>
          <p className="text-xs text-neutral-500">{formatPlaceType(place.type)}</p>
        </div>
        <ActiveChip active={place.active} />
      </div>
      {place.classrooms.length > 0 && (
        <ul aria-label={`Aulas de ${place.name}`} className="space-y-2">
          {place.classrooms.map((classroom) => (
            <ClassroomRow key={classroom.id} classroom={classroom} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The blocks and spaces of the campus, with the classrooms of each block. */
export function PlacesSection({ adminCatalogService }: PlacesSectionProps) {
  const loadPlaces = useCallback(
    async () => (await adminCatalogService.listCatalogs()).places,
    [adminCatalogService],
  );
  const { data: places, hasFailed, retry } = useLoadedData(loadPlaces);

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar los lugares. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (places === undefined) {
    return <SkeletonList rows={4} label="Cargando lugares…" />;
  }
  if (places.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Todavía no hay lugares"
        text="Aparecerán aquí cuando los crees."
      />
    );
  }
  return (
    <ul aria-label="Lugares" className="space-y-3">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </ul>
  );
}
