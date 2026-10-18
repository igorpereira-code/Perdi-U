import { useState } from 'react';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { PhotoInput } from '../../core/presenter/PhotoInput';
import { isBlank } from '../../core/logic/validation';

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

export type LostReportSubmitData = {
  description: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  places: PlaceSelection[];
  placeDescription?: string;
  photo?: File | null;
};

type NewLostReportPageProps = {
  onBack: () => void;
  onSubmit?: (data: LostReportSubmitData) => void;
  availablePlaces?: CampusPlace[];
};

export function NewLostReportPage({
  onBack,
  onSubmit,
  availablePlaces = DEFAULT_CAMPUS_PLACES,
}: NewLostReportPageProps) {
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [places, setPlaces] = useState<PlaceSelection[]>([{ placeId: '', classroomId: '' }]);
  const [placeDescription, setPlaceDescription] = useState('');

  const [errors, setErrors] = useState<{
    description?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      description?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};

    if (isBlank(description)) {
      newErrors.description = 'La descripción es obligatoria';
    }
    if (isBlank(category)) {
      newErrors.category = 'La categoría es obligatoria';
    }
    if (isBlank(dateFrom)) {
      newErrors.dateFrom = 'La fecha inicial es obligatoria';
    }
    if (isBlank(dateTo)) {
      newErrors.dateTo = 'La fecha final es obligatoria';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSubmit?.({
      description,
      category,
      dateFrom,
      dateTo,
      places: places.filter((p) => p.placeId !== ''),
      placeDescription: isBlank(placeDescription) ? undefined : placeDescription,
      photo,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Reportar objeto perdido" onBack={onBack} />
      <main className="p-4 max-w-lg mx-auto">
        <form aria-label="Reporte de pérdida" className="space-y-4" onSubmit={handleSubmit}>
          <Field id="description" label="Descripción" error={errors.description}>
            <textarea
              id="description"
              rows={3}
              className={INPUT_CLASSES}
              placeholder="Ej. Mochila negra con un llavero..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
            />
          </Field>

          <Field id="category" label="Categoría" error={errors.category}>
            <select
              id="category"
              className={INPUT_CLASSES}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors({ ...errors, category: undefined });
              }}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="dateFrom" label="Fecha desde" error={errors.dateFrom}>
              <input
                id="dateFrom"
                type="date"
                className={INPUT_CLASSES}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  if (errors.dateFrom) setErrors({ ...errors, dateFrom: undefined });
                }}
              />
            </Field>

            <Field id="dateTo" label="Fecha hasta" error={errors.dateTo}>
              <input
                id="dateTo"
                type="date"
                className={INPUT_CLASSES}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  if (errors.dateTo) setErrors({ ...errors, dateTo: undefined });
                }}
              />
            </Field>
          </div>

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

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full">
              Enviar reporte
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}