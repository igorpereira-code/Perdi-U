import { useState } from 'react';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Button } from '../../core/presenter/Button';
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

export type CampusPlace = {
  id: number;
  name: string;
  type: 'BLOCK' | 'SPACE';
  classrooms?: { id: number; name: string }[];
};

export const DEFAULT_CAMPUS_PLACES: CampusPlace[] = [
  {
    id: 1,
    name: 'Bloque A',
    type: 'BLOCK',
    classrooms: [
      { id: 101, name: 'Aula 101' },
      { id: 102, name: 'Aula 102' },
      { id: 103, name: 'Aula 103' },
    ],
  },
  {
    id: 2,
    name: 'Bloque B',
    type: 'BLOCK',
    classrooms: [
      { id: 201, name: 'Aula 201' },
      { id: 202, name: 'Aula 202' },
    ],
  },
  {
    id: 3,
    name: 'Bloque C',
    type: 'BLOCK',
    classrooms: [
      { id: 301, name: 'Aula 301' },
      { id: 302, name: 'Aula 302' },
    ],
  },
  { id: 4, name: 'Biblioteca', type: 'SPACE' },
  { id: 5, name: 'Terraza', type: 'SPACE' },
  { id: 6, name: "Sophie's", type: 'SPACE' },
  { id: 7, name: '11:11', type: 'SPACE' },
  { id: 8, name: 'Canchas deportivas', type: 'SPACE' },
  { id: 9, name: 'Parqueo', type: 'SPACE' },
];

type PlaceSelection = {
  placeId: string;
  classroomId: string;
};

type NewLostReportPageProps = {
  onBack: () => void;
  availablePlaces?: CampusPlace[];
};

export function NewLostReportPage({
  onBack,
  availablePlaces = DEFAULT_CAMPUS_PLACES,
}: NewLostReportPageProps) {
  const [description, setDescription] = useState('');
  const [_photo, setPhoto] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [places, setPlaces] = useState<PlaceSelection[]>([{ placeId: '', classroomId: '' }]);
  const [placeDescription, setPlaceDescription] = useState('');

  const handlePlaceChange = (index: number, placeId: string) => {
    const updated = [...places];
    updated[index] = { placeId, classroomId: '' };
    setPlaces(updated);
  };

  const handleClassroomChange = (index: number, classroomId: string) => {
    const updated = [...places];
    updated[index] = { ...updated[index], classroomId };
    setPlaces(updated);
  };

  const handleAddPlace = () => {
    setPlaces([...places, { placeId: '', classroomId: '' }]);
  };

  const handleRemovePlace = (index: number) => {
    setPlaces(places.filter((_, i) => i !== index));
  };

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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Lugares posibles (opcional)</span>
              <Button type="button" variant="ghost" onClick={handleAddPlace}>
                + Agregar otro lugar
              </Button>
            </div>

            {places.map((item, index) => {
              const selectedPlace = availablePlaces.find((p) => p.id === Number(item.placeId));
              const hasClassrooms =
                selectedPlace?.type === 'BLOCK' && (selectedPlace.classrooms?.length ?? 0) > 0;

              return (
                <div key={index} className="p-3 bg-white rounded-lg border border-neutral-200 space-y-3">
                  <Field id={`place-${index}`} label="Bloque o espacio">
                    <select
                      id={`place-${index}`}
                      className={INPUT_CLASSES}
                      value={item.placeId}
                      onChange={(e) => handlePlaceChange(index, e.target.value)}
                    >
                      <option value="">Selecciona un bloque o espacio</option>
                      {availablePlaces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {hasClassrooms && (
                    <Field id={`classroom-${index}`} label="Aula">
                      <select
                        id={`classroom-${index}`}
                        className={INPUT_CLASSES}
                        value={item.classroomId}
                        onChange={(e) => handleClassroomChange(index, e.target.value)}
                      >
                        <option value="">Selecciona un aula</option>
                        {selectedPlace?.classrooms?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {places.length > 1 && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemovePlace(index)}
                      >
                        Quitar lugar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Field id="placeDescription" label="Referencia del lugar" optional>
            <input
              id="placeDescription"
              type="text"
              className={INPUT_CLASSES}
              placeholder="Ej. En las gradas hacia el segundo piso o cerca de las jardineras..."
              value={placeDescription}
              onChange={(e) => setPlaceDescription(e.target.value)}
              maxLength={300}
            />
          </Field>

          <Field id="photo" label="Foto de referencia" optional>
            <PhotoInput onChange={setPhoto} />
          </Field>
        </form>
      </main>
    </div>
  );
}