import { useState } from 'react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';

export function FoundItemForm() {
  const [description, setDescription] = useState('');

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
    </form>
  );
}
