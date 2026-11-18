import { useState, type FormEvent } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { getCategoryIcon } from '../../core/presenter/CategoryIcon';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { FoundItemPhotoPicker } from '../../finder/presenter/FoundItemPhotoPicker';
import type { LostReportCreated, LostReportPayload, LostReportsService } from '../data/lostReportsService';
import { validateLostReportForm, type LostReportFormErrors } from '../logic/validateLostReportForm';
import { LostReportConfirmation } from './LostReportConfirmation';
import { LostReportReview } from './LostReportReview';

type ChosenPlace = { placeId: number; classroomId: number | null };

type LostReportFormProps = {
  catalogs: FoundItemCatalogs;
  onCreate?: LostReportsService['create'];
  /** Edits an existing report: it comes filled, without photo or summary, and saves directly. */
  edit?: { initial: LostReportPayload; onSave: (changes: LostReportPayload) => Promise<void> };
};

const CHIP = 'rounded-full border px-3.5 py-1.5 text-sm transition';
const CHIP_ON = 'border-blue-700 bg-blue-700 text-neutral-0';
const CHIP_OFF = 'border-neutral-300 bg-neutral-0 text-neutral-700 hover:border-blue-300';

/** "Bloque A – Aula A-12", the same way the rest of the app names a place. */
function describePlaces(catalogs: FoundItemCatalogs, chosen: ChosenPlace[]): string[] {
  return chosen.map(({ placeId, classroomId }) => {
    const place = catalogs.places.find((option) => option.id === placeId);
    const classroom = place?.classrooms.find((option) => option.id === classroomId);
    return classroom ? `${place?.name} – ${classroom.name}` : (place?.name ?? '');
  });
}

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

export function LostReportForm({ catalogs, onCreate, edit }: LostReportFormProps) {
  const initial = edit?.initial;
  const [description, setDescription] = useState(initial?.description ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [category, setCategory] = useState(initial ? String(initial.categoryId) : '');
  const [places, setPlaces] = useState<ChosenPlace[]>(initial?.places ?? []);
  const [placeDescription, setPlaceDescription] = useState(initial?.placeDescription ?? '');
  const [placeUnknown, setPlaceUnknown] = useState(
    initial !== undefined && initial.places.length === 0 && !initial.placeDescription,
  );
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? '');
  const [errors, setErrors] = useState<LostReportFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<LostReportCreated | null>(null);
  const [reportToReview, setReportToReview] = useState<LostReportPayload | null>(null);

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

  /** Checks the data. A new report goes to the summary; an edited one is saved directly. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateLostReportForm({ description, category, dateFrom, dateTo });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || (!onCreate && !edit)) {
      return;
    }
    const report: LostReportPayload = {
      description: description.trim(),
      categoryId: Number(category),
      places: placeUnknown ? [] : places,
      placeDescription: placeUnknown ? null : placeDescription.trim() || null,
      dateFrom,
      dateTo,
    };
    if (!edit) {
      setReportToReview(report);
      return;
    }
    setSubmitting(true);
    try {
      await edit.onSave(report);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  /** The report is only sent when the owner confirms the summary. */
  async function handleConfirm() {
    if (!reportToReview || !onCreate) {
      return;
    }
    setSubmitting(true);
    try {
      setCreated(await onCreate(reportToReview, photo));
    } catch (error) {
      setReportToReview(null);
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar tu reporte. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <LostReportConfirmation code={created.code} />;
  }

  return (
    <>
      <form
        aria-labelledby="lost-report-title"
        className="mx-auto max-w-lg space-y-5"
        noValidate
        hidden={reportToReview !== null}
        onSubmit={handleSubmit}
      >
        <h1 id="lost-report-title" className="text-lg font-semibold text-blue-700">
          {edit ? 'Editar reporte' : 'Reportar objeto perdido'}
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

          {!edit && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-neutral-700">
                Foto de referencia <span className="font-normal text-neutral-500">(opcional)</span>
              </legend>
              <FoundItemPhotoPicker photo={photo} onChange={setPhoto} />
              <p className="text-xs text-neutral-500">JPEG, PNG o WebP, máximo 5 MiB.</p>
            </fieldset>
          )}

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
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-700"
                checked={placeUnknown}
                onChange={(event) => setPlaceUnknown(event.target.checked)}
              />
              No sé dónde lo perdí
            </label>
            {!placeUnknown && (
              <>
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
              </>
            )}
          </fieldset>

          {!placeUnknown && (
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
          )}

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

          {edit ? (
            <Button
              type="submit"
              className="w-full"
              isLoading={submitting}
              loadingText="Guardando cambios…"
            >
              Guardar cambios
            </Button>
          ) : (
            <Button type="submit" className="w-full">
              Revisar reporte
            </Button>
          )}
        </fieldset>
      </form>
      {reportToReview && (
        <LostReportReview
          description={reportToReview.description}
          category={catalogs.categories.find((option) => option.id === reportToReview.categoryId)?.name ?? ''}
          places={describePlaces(catalogs, reportToReview.places)}
          placeDescription={reportToReview.placeDescription}
          dateFrom={reportToReview.dateFrom}
          dateTo={reportToReview.dateTo}
          photo={photo}
          isSubmitting={submitting}
          onEdit={() => setReportToReview(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}