import { useRef, useState, type FormEvent } from 'react';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { PhotoInput } from '../../core/presenter/PhotoInput';
import type { FoundItemCatalogs, FoundItemCreated, FoundItemsService } from '../data/foundItemsService';
import { foundAtFromForm } from '../logic/foundAtFromForm';
import { validateFoundItemForm, type FoundItemFormErrors } from '../logic/validateFoundItemForm';
import { FoundItemConfirmation } from './FoundItemConfirmation';

type FoundItemFormProps = {
  catalogs: FoundItemCatalogs;
  onCreate?: FoundItemsService['create'];
};

export function FoundItemForm({ catalogs, onCreate }: FoundItemFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [placeId, setPlaceId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [placeReference, setPlaceReference] = useState('');
  const [foundDate, setFoundDate] = useState('');
  const [foundTime, setFoundTime] = useState('');
  const [errors, setErrors] = useState<FoundItemFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<FoundItemCreated | null>(null);
  const submitLocked = useRef(false);
  const selectedPlace = catalogs.places.find((place) => String(place.id) === placeId);

  function handlePlaceChange(id: string) {
    setPlaceId(id);
    setClassroomId('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLocked.current) { return; }
    setSubmitError(null);
    const nextErrors = validateFoundItemForm({ description, category, place: placeId, foundDate });
    setErrors(nextErrors);

    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) {
        field.focus();
      }
      return;
    }
    if (!onCreate) { return; }
    submitLocked.current = true;
    setSubmitting(true);
    try {
      const result = await onCreate({
        description: description.trim(),
        categoryId: Number(category),
        placeId: Number(placeId),
        classroomId: classroomId ? Number(classroomId) : null,
        placeReference: placeReference.trim() || null,
        foundAt: foundAtFromForm(foundDate, foundTime),
      }, photo);
      setCreated(result);
    } catch (error) {
      submitLocked.current = false;
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar el reporte. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <FoundItemConfirmation code={created.code} />;
  }

  return (
    <form
      aria-labelledby="found-item-form-title"
      className="mx-auto max-w-lg space-y-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <h1 id="found-item-form-title" className="text-lg font-semibold text-blue-700">
        Reportar objeto encontrado
      </h1>
      {submitError && <div role="alert"><Alert>{submitError}</Alert></div>}
      <fieldset disabled={submitting} className="space-y-4">
      <Field id="found-item-description" label="Descripción del objeto" error={errors.description}>
        <textarea
          id="found-item-description"
          name="description"
          required
          aria-invalid={Boolean(errors.description)}
          rows={4}
          className={INPUT_CLASSES}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field id="found-item-category" label="Categoría" error={errors.category}>
        <select
          id="found-item-category"
          name="category"
          required
          aria-invalid={Boolean(errors.category)}
          className={INPUT_CLASSES}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Selecciona una categoría</option>
          {catalogs.categories.map((categoryOption) => (
            <option key={categoryOption.id} value={categoryOption.id}>
              {categoryOption.name}
            </option>
          ))}
        </select>
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">
          Fotografía <span className="font-normal text-neutral-500">(opcional)</span>
        </legend>
        <PhotoInput onChange={setPhoto} />
        <p className="text-sm text-neutral-500">JPEG, PNG o WebP, máximo 5 MiB.</p>
        {photo && <p className="text-sm text-neutral-500">{photo.name}</p>}
      </fieldset>
      <Field id="found-item-place" label="Bloque o espacio" error={errors.place}>
        <select
          id="found-item-place"
          name="place"
          required
          aria-invalid={Boolean(errors.place)}
          className={INPUT_CLASSES}
          value={placeId}
          onChange={(event) => handlePlaceChange(event.target.value)}
        >
          <option value="">Selecciona un bloque o espacio</option>
          {catalogs.places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </Field>
      {selectedPlace?.type === 'BLOCK' && (
        <Field id="found-item-classroom" label="Aula">
          <select
            id="found-item-classroom"
            name="classroom"
            className={INPUT_CLASSES}
            value={classroomId}
            onChange={(event) => setClassroomId(event.target.value)}
          >
            <option value="">Selecciona un aula</option>
            {selectedPlace.classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field id="found-item-place-reference" label="Referencia del lugar">
        <input
          id="found-item-place-reference"
          name="placeReference"
          type="text"
          maxLength={200}
          className={INPUT_CLASSES}
          value={placeReference}
          onChange={(event) => setPlaceReference(event.target.value)}
        />
      </Field>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-neutral-700">Fecha y hora del hallazgo</legend>
        <p id="found-item-found-at-help" className="text-sm text-neutral-500">
          Indica cuándo encontraste el objeto, aunque lo reportes otro día.
        </p>
        <Field id="found-item-found-date" label="Fecha del hallazgo" error={errors.foundDate}>
          <input
            id="found-item-found-date"
            name="foundDate"
            type="date"
            required
            aria-invalid={Boolean(errors.foundDate)}
            aria-describedby="found-item-found-at-help"
            className={INPUT_CLASSES}
            value={foundDate}
            onChange={(event) => setFoundDate(event.target.value)}
          />
        </Field>
        <Field id="found-item-found-time" label="Hora del hallazgo">
          <input
            id="found-item-found-time"
            name="foundTime"
            type="time"
            aria-describedby="found-item-found-at-help"
            className={INPUT_CLASSES}
            value={foundTime}
            onChange={(event) => setFoundTime(event.target.value)}
          />
        </Field>
      </fieldset>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Enviando…' : 'Reportar objeto encontrado'}
      </Button>
      </fieldset>
    </form>
  );
}
