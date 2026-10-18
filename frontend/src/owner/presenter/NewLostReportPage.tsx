import { useState } from 'react';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { PhotoInput } from '../../core/presenter/PhotoInput';

const CATEGORIES = [
  'Electrónicos',
  'Mochilas y bolsos',
  'Ropa y accesorios',
  'Llaves',
  'Botellas y termos',
  'Útiles y libros',
  'Documentos y carnets',
];

type NewLostReportPageProps = {
  onBack: () => void;
};

export function NewLostReportPage({ onBack }: NewLostReportPageProps) {
  const [description, setDescription] = useState('');
  const [_photo, setPhoto] = useState<File | null>(null);
  const [category, setCategory] = useState('');

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Reportar objeto perdido" onBack={onBack} />
      <main className="p-4 max-w-lg mx-auto">
        <form aria-label="Reporte de pérdida" className="space-y-4">
          <Field id="description" label="Descripción">
            <textarea
              id="description"
              rows={3}
              className={INPUT_CLASSES}
              placeholder="Ej. Mochila negra con un llavero..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field id="category" label="Categoría">
            <select
              id="category"
              className={INPUT_CLASSES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <Field id="photo" label="Foto de referencia" optional>
            <PhotoInput onChange={setPhoto} />
          </Field>
        </form>
      </main>
    </div>
  );
}