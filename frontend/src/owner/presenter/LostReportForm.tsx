import { useState } from 'react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { getCategoryIcon } from '../../core/presenter/CategoryIcon';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';

type ChosenPlace = { placeId: number; classroomId: number | null };

type LostReportFormProps = {
  catalogs: FoundItemCatalogs;
};

const CHIP = 'rounded-full border px-3.5 py-1.5 text-sm transition';
const CHIP_ON = 'border-blue-700 bg-blue-700 text-neutral-0';
const CHIP_OFF = 'border-neutral-300 bg-neutral-0 text-neutral-700 hover:border-blue-300';

export function LostReportForm({ catalogs }: LostReportFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [places, setPlaces] = useState<ChosenPlace[]>([]);

  function togglePlace(placeId: number) {
    setPlaces((current) =>
      current.some((place) => place.placeId === placeId)
        ? current.filter((place) => place.placeId !== placeId)
        : [...current, { placeId, classroomId: null }],
    );
  }

  function chooseClassroom(placeId: number, classroomId: string) {
    setPlaces((current) =>
      current.map((place) =>
        place.placeId === placeId ? { placeId, classroomId: classroomId ? Number(classroomId) : null } : place,
      ),
    );
  }

  return (
    <form aria-labelledby="lost-report-title" className="mx-auto max-w-lg space-y-5" noValidate>
      <h1 id="lost-report-title" className="text-lg font-semibold text-blue-700">
        Reportar objeto perdido
      </h1>
      <Field id="lost-report-description" label="Descripción de tu objeto">
        <textarea
          id="lost-report-description"
          rows={4}
          className={INPUT_CLASSES}
          placeholder="Ej. Llaves con llavero rojo de la universidad"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">Categoría</legend>
        <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-3 gap-2">
          {catalogs.categories.map((option) => {
            const Icon = getCategoryIcon(option.name);
            const selected = category === String(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(String(option.id))}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-center text-xs leading-tight transition ${
                  selected ? 'border-blue-700 bg-blue-50 font-semibold text-blue-700' : CHIP_OFF
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {option.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">
          ¿Dónde pudo perderlo? <span className="font-normal text-neutral-500">(opcional, puedes elegir varios)</span>
        </legend>
        <div role="group" aria-label="Lugares donde pudo perderlo" className="flex flex-wrap gap-2">
          {catalogs.places.map((place) => {
            const selected = places.some((chosen) => chosen.placeId === place.id);
            return (
              <button
                key={place.id}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePlace(place.id)}
                className={`${CHIP} ${selected ? CHIP_ON : CHIP_OFF}`}
              >
                {place.name}
              </button>
            );
          })}
        </div>
        {places.map((chosen) => {
          const place = catalogs.places.find((option) => option.id === chosen.placeId);
          if (!place || place.type !== 'BLOCK' || place.classrooms.length === 0) {
            return null;
          }
          return (
            <Field key={place.id} id={`lost-report-classroom-${place.id}`} label={`Aula en ${place.name}`} optional>
              <select
                id={`lost-report-classroom-${place.id}`}
                className={INPUT_CLASSES}
                value={chosen.classroomId ?? ''}
                onChange={(event) => chooseClassroom(place.id, event.target.value)}
              >
                <option value="">Cualquier aula</option>
                {place.classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </Field>
          );
        })}
      </fieldset>
    </form>
  );
}