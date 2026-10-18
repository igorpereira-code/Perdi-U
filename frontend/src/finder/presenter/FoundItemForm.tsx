import { useState } from 'react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { PhotoInput } from '../../core/presenter/PhotoInput';
import { FOUND_ITEM_CATEGORIES } from '../data/foundItemCategories';
import { PROVISIONAL_FOUND_ITEM_PLACES } from '../data/foundItemPlaces';

export function FoundItemForm() {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [placeReference, setPlaceReference] = useState('');
  const selectedPlace = PROVISIONAL_FOUND_ITEM_PLACES.find((place) => place.name === placeName);

  function handlePlaceChange(name: string) {
    setPlaceName(name);
    setClassroomName('');
  }

  return (
    <form aria-labelledby="found-item-form-title" className="mx-auto max-w-lg space-y-4">
      <h1 id="found-item-form-title" className="text-lg font-semibold text-blue-700">
        Reportar objeto encontrado
      </h1>
      <Field id="found-item-description" label="Descripción del objeto">
        <textarea
          id="found-item-description"
          name="description"
          rows={4}
          className={INPUT_CLASSES}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field id="found-item-category" label="Categoría">
        <select
          id="found-item-category"
          name="category"
          className={INPUT_CLASSES}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Selecciona una categoría</option>
          {FOUND_ITEM_CATEGORIES.map((categoryName) => (
            <option key={categoryName} value={categoryName}>
              {categoryName}
            </option>
          ))}
        </select>
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">
          Fotografía <span className="font-normal text-neutral-500">(opcional)</span>
        </legend>
        <PhotoInput onChange={setPhoto} />
        {photo && <p className="text-sm text-neutral-500">{photo.name}</p>}
      </fieldset>
      <Field id="found-item-place" label="Bloque o espacio">
        <select
          id="found-item-place"
          name="place"
          className={INPUT_CLASSES}
          value={placeName}
          onChange={(event) => handlePlaceChange(event.target.value)}
        >
          <option value="">Selecciona un bloque o espacio</option>
          {PROVISIONAL_FOUND_ITEM_PLACES.map((place) => (
            <option key={place.name} value={place.name}>
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
            value={classroomName}
            onChange={(event) => setClassroomName(event.target.value)}
          >
            <option value="">Selecciona un aula</option>
            {selectedPlace.classrooms.map((classroom) => (
              <option key={classroom} value={classroom}>
                {classroom}
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
          className={INPUT_CLASSES}
          value={placeReference}
          onChange={(event) => setPlaceReference(event.target.value)}
        />
      </Field>
    </form>
  );
}
