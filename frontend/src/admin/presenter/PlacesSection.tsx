import { useCallback, useId, useState, type FormEvent } from 'react';
import { MapPin } from 'lucide-react';
import type { CatalogChanges, ManagedClassroom, ManagedPlace, PlaceType } from '@shared/admin';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminCatalogService } from '../data/adminCatalogService';
import { formatPlaceType } from '../logic/formatPlaceType';
import { saveClassroomInPlace } from '../logic/saveClassroomInPlace';
import { saveInListByName } from '../logic/saveInListByName';
import { EditableItem } from './EditableItem';
import { NameForm } from './NameForm';

type PlacesSectionProps = {
  adminCatalogService: AdminCatalogService;
};

type NewPlaceFormProps = {
  onCreate: (name: string, type: PlaceType) => Promise<void>;
};

/** Name and kind (block or space) of a new place. */
function NewPlaceForm({ onCreate }: NewPlaceFormProps) {
  const nameId = useId();
  const typeId = useId();
  const [name, setName] = useState('');
  const [type, setType] = useState<PlaceType>('BLOCK');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    try {
      await onCreate(name.trim(), type);
      setName('');
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field id={nameId} label="Nuevo lugar" error={error}>
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={INPUT_CLASSES}
        />
      </Field>
      <Field id={typeId} label="Tipo">
        <select
          id={typeId}
          value={type}
          onChange={(event) => setType(event.target.value as PlaceType)}
          className={INPUT_CLASSES}
        >
          <option value="BLOCK">{formatPlaceType('BLOCK')} (tiene aulas)</option>
          <option value="SPACE">{formatPlaceType('SPACE')} (sin aulas)</option>
        </select>
      </Field>
      <Button
        type="submit"
        disabled={name.trim() === ''}
        isLoading={isSaving}
        loadingText="Agregando…"
        className="w-full"
      >
        Agregar
      </Button>
    </form>
  );
}

type ClassroomsProps = {
  place: ManagedPlace;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (classroom: ManagedClassroom, changes: CatalogChanges) => Promise<void>;
};

/** The classrooms of a block, and the box to add one more. */
function Classrooms({ place, onCreate, onUpdate }: ClassroomsProps) {
  return (
    <div className="space-y-3 border-t border-neutral-200 pt-3">
      {place.classrooms.length > 0 && (
        <ul aria-label={`Aulas de ${place.name}`} className="space-y-2">
          {place.classrooms.map((classroom) => (
            <EditableItem
              key={classroom.id}
              name={classroom.name}
              active={classroom.active}
              detail="Aula"
              onUpdate={(changes) => onUpdate(classroom, changes)}
            />
          ))}
        </ul>
      )}
      <NameForm
        label={`Nueva aula en ${place.name}`}
        submitText="Agregar aula"
        loadingText="Agregando…"
        clearAfterSubmit
        onSubmit={onCreate}
      />
    </div>
  );
}

/** The blocks and spaces of the campus, with the classrooms of each block. */
export function PlacesSection({ adminCatalogService }: PlacesSectionProps) {
  const loadPlaces = useCallback(
    async () => (await adminCatalogService.listCatalogs()).places,
    [adminCatalogService],
  );
  const { data: places, setData: setPlaces, hasFailed, retry } = useLoadedData(loadPlaces);

  function showSavedPlace(savedPlace: ManagedPlace) {
    setPlaces((current) => current && saveInListByName(current, savedPlace));
  }

  /** Waits for the classroom to be saved and shows it in its block. */
  async function showSavedClassroom(placeId: number, saving: Promise<ManagedClassroom>) {
    const savedClassroom = await saving;
    setPlaces((current) =>
      current?.map((place) =>
        place.id === placeId ? saveClassroomInPlace(place, savedClassroom) : place,
      ),
    );
  }

  async function createPlace(name: string, type: PlaceType) {
    showSavedPlace(await adminCatalogService.createPlace({ name, type }));
  }

  async function updatePlace(placeId: number, changes: CatalogChanges) {
    showSavedPlace(await adminCatalogService.updatePlace(placeId, changes));
  }

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
  return (
    <div className="space-y-4">
      <NewPlaceForm onCreate={createPlace} />
      {places.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Todavía no hay lugares"
          text="Agrega el primero con el formulario de arriba."
        />
      ) : (
        <ul aria-label="Lugares" className="space-y-3">
          {places.map((place) => (
            <EditableItem
              key={place.id}
              name={place.name}
              active={place.active}
              detail={formatPlaceType(place.type)}
              onUpdate={(changes) => updatePlace(place.id, changes)}
            >
              {place.type === 'BLOCK' && (
                <Classrooms
                  place={place}
                  onCreate={(name) =>
                    showSavedClassroom(
                      place.id,
                      adminCatalogService.createClassroom(place.id, name),
                    )
                  }
                  onUpdate={(classroom, changes) =>
                    showSavedClassroom(
                      place.id,
                      adminCatalogService.updateClassroom(classroom.id, changes),
                    )
                  }
                />
              )}
            </EditableItem>
          ))}
        </ul>
      )}
    </div>
  );
}
