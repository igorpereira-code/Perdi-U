import { useState } from 'react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';

type LostReportFormProps = {
  catalogs: FoundItemCatalogs;
};

export function LostReportForm(_props: LostReportFormProps) {
  const [description, setDescription] = useState('');

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
    </form>
  );
}