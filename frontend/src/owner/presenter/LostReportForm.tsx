import { useState, type FormEvent } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { getCategoryIcon } from '../../core/presenter/CategoryIcon';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import type { LostReportCreated, LostReportsService } from '../data/lostReportsService';
import { validateLostReportForm, type LostReportFormErrors } from '../logic/validateLostReportForm';
import { LostReportConfirmation } from './LostReportConfirmation';

type ChosenPlace = { placeId: number; classroomId: number | null };

type LostReportFormProps = {
  catalogs: FoundItemCatalogs;
  onCreate?: LostReportsService['create'];
};

const CHIP = 'rounded-full border px-3.5 py-1.5 text-sm transition';
const CHIP_ON = 'border-blue-700 bg-blue-700 text-neutral-0';
const CHIP_OFF = 'border-neutral-300 bg-neutral-0 text-neutral-700 hover:border-blue-300';

function FieldError({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-danger-700">
      {text}
    </p>
  );
}

export function LostReportForm({ catalogs, onCreate }: LostReportFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [places, setPlaces] = useState<ChosenPlace[]>([]);
  const [placeDescription, setPlaceDescription] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [errors, setErrors] = useState<LostReportFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<LostReportCreated | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateLostReportForm({ description, category, dateFrom, dateTo });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !onCreate) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await onCreate(
        {
          description: description.trim(),
          categoryId: Number(category),
          places,
          placeDescription: placeDescription.trim() || null,
          dateFrom,
          dateTo,
        },
        null,
      );
      setCreated(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar tu reporte. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <LostReportConfirmation code={created.code} />;
  }

  return (
    <form aria-labelledby="lost-report-title" className="mx-auto max-w-lg space-y-5" noValidate onSubmit={handleSubmit}>
      <h1 id="lost-report-title" className="text-lg font-semibold text-blue-700">
        Reportar objeto perdido
      </h1>
      {submitError && <div role="alert"><Alert>{submitError}</Alert></div>}

      <fieldset disabled={submitting} className="space-y-5">
        <Field id="lost-report-description" label="Descripción de tu objeto" error={errors.description}>
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
          <FieldError text={errors.category} />
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

        <Field id="lost-report-place-description" label="¿Por dónde pudo perderlo?" optional>
          <input
            id="lost-report-place-description"
            type="text"
            maxLength={300}
            className={INPUT_CLASSES}
            placeholder="Ej. Fui de la biblioteca a la cafetería"
            value={placeDescription}
            onChange={(event) => setPlaceDescription(event.target.value)}
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-700">¿Entre qué fechas pudo perderlo?</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field id="lost-report-date-from" label="Desde" error={errors.dateFrom}>
              <input
                id="lost-report-date-from"
                type="date"
                className={INPUT_CLASSES}
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </Field>
            <Field id="lost-report-date-to" label="Hasta" error={errors.dateTo}>
              <input
                id="lost-report-date-to"
                type="date"
                className={INPUT_CLASSES}
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <Button type="submit" className="w-full">
          {submitting ? 'Enviando…' : 'Enviar reporte'}
        </Button>
      </fieldset>
    </form>
  );
}