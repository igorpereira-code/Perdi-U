import { useState } from 'react';
import {
  Smartphone,
  Backpack,
  Shirt,
  KeyRound,
  CupSoda,
  BookOpen,
  IdCard,
  type LucideIcon,
} from 'lucide-react';
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

// Solo visual: ícono que se muestra en cada categoría
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electrónicos: Smartphone,
  'Mochilas y bolsos': Backpack,
  'Ropa y accesorios': Shirt,
  Llaves: KeyRound,
  'Botellas y termos': CupSoda,
  'Útiles y libros': BookOpen,
  'Documentos y carnets': IdCard,
};

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
  const [places, setPlaces] = useState<PlaceSelection[]>([]);
  const [placeDescription, setPlaceDescription] = useState('');

  const [errors, setErrors] = useState<{
    description?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // Los lugares ahora se eligen con chips: tocar un chip lo agrega o lo quita.
  // Los datos resultantes (placeId + classroomId) son los mismos de antes.
  const handleTogglePlace = (placeId: string) => {
    setPlaces((prev) =>
      prev.some((p) => p.placeId === placeId)
        ? prev.filter((p) => p.placeId !== placeId)
        : [...prev, { placeId, classroomId: '' }]
    );
  };

  const handleClassroomChange = (index: number, classroomId: string) => {
    const updated = [...places];
    updated[index] = { ...updated[index], classroomId };
    setPlaces(updated);
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
      <BackHeader title="Perdí un objeto" onBack={onBack} />
      <main className="p-4 max-w-lg mx-auto">
        <form aria-label="Reporte de pérdida" className="space-y-5" onSubmit={handleSubmit}>
          <Field id="photo" label="Foto de referencia" optional>
            <PhotoInput onChange={setPhoto} />
          </Field>

          <Field id="description" label="Descripción" error={errors.description}>
            <textarea
              id="description"
              rows={4}
              className={INPUT_CLASSES}
              placeholder="Ej. Llaves con llavero rojo de la universidad"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
            />
          </Field>

          <Field id="category" label="Categoría" error={errors.category}>
            <div
              id="category"
              role="radiogroup"
              aria-label="Categoría"
              className="grid grid-cols-4 gap-2"
            >
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setCategory(cat);
                      if (errors.category) setErrors({ ...errors, category: undefined });
                    }}
                    className={`flex flex-col items-center justify-start gap-1.5 px-1 py-3 rounded-2xl border text-center text-xs leading-tight transition ${
                      isSelected
                        ? 'border-[#14407a] bg-[#eaf1fb] text-[#14407a] font-semibold'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#14407a]'
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              ¿Dónde pudiste perderlo?{' '}
              <span className="font-normal text-neutral-500">(opcional)</span>
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Lugares posibles">
              {availablePlaces.map((p) => {
                const isSelected = places.some((item) => item.placeId === String(p.id));
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleTogglePlace(String(p.id))}
                    className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                      isSelected
                        ? 'border-[#14407a] bg-[#14407a] text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#14407a]'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aula: solo aparece para los bloques seleccionados que tienen aulas */}
          {places.map((item, index) => {
            const selectedPlace = availablePlaces.find((p) => p.id === Number(item.placeId));
            const hasClassrooms =
              selectedPlace?.type === 'BLOCK' && (selectedPlace.classrooms?.length ?? 0) > 0;
            if (!selectedPlace || !hasClassrooms) return null;

            return (
              <Field
                key={item.placeId}
                id={`classroom-${index}`}
                label={`Aula en ${selectedPlace.name}`}
              >
                <select
                  id={`classroom-${index}`}
                  className={INPUT_CLASSES}
                  value={item.classroomId}
                  onChange={(e) => handleClassroomChange(index, e.target.value)}
                >
                  <option value="">Selecciona un aula</option>
                  {selectedPlace.classrooms?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            );
          })}

          <Field id="placeDescription" label="Describe por dónde pudiste extraviarlo" optional>
            <input
              id="placeDescription"
              type="text"
              className={INPUT_CLASSES}
              placeholder="Ej. Fui de la biblioteca a la cafetería"
              value={placeDescription}
              onChange={(e) => setPlaceDescription(e.target.value)}
              maxLength={300}
            />
          </Field>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              ¿Cuándo pudiste perderlo?
            </span>
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
          </div>

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
