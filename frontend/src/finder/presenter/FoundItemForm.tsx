import { useState } from 'react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { PhotoInput } from '../../core/presenter/PhotoInput';
import { FOUND_ITEM_CATEGORIES } from '../data/foundItemCategories';

export function FoundItemForm() {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

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
    </form>
  );
}
