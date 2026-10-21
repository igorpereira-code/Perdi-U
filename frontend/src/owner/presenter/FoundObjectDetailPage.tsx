import {
  Smartphone,
  Backpack,
  Shirt,
  KeyRound,
  CupSoda,
  BookOpen,
  IdCard,
  Package,
  MapPin,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { BackHeader } from '../../core/presenter/BackHeader';

export type FoundObjectDetail = {
  id: string;
  code: string;
  description: string;
  category: string;
  place?: string;
  foundDate?: string;
  photoUrl?: string;
};

type FoundObjectDetailPageProps = {
  object: FoundObjectDetail;
  onBack: () => void;
};

// Solo visual: ícono que se muestra cuando el objeto no tiene foto
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electrónicos: Smartphone,
  'Mochilas y bolsos': Backpack,
  'Ropa y accesorios': Shirt,
  Llaves: KeyRound,
  'Botellas y termos': CupSoda,
  'Útiles y libros': BookOpen,
  'Documentos y carnets': IdCard,
};

export function FoundObjectDetailPage({ object, onBack }: FoundObjectDetailPageProps) {
  const CategoryIcon = CATEGORY_ICONS[object.category] ?? Package;

  const rows = [
    { label: 'Categoría', value: object.category, mono: false },
    { label: 'Lugar', value: object.place ?? 'Campus universitario', mono: false },
    { label: 'Fecha', value: object.foundDate ?? 'No especificada', mono: false },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Detalle del objeto" onBack={onBack} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {object.photoUrl ? (
          <div className="w-full h-64 bg-[#eef4fc] rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-200">
            <img
              src={object.photoUrl}
              alt={object.description}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-[#eef4fc] rounded-2xl flex items-center justify-center text-[#2a6bb5]">
            <CategoryIcon className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">Sin foto de referencia</span>
          </div>
        )}

        {/* Datos del objeto */}
        <section className="px-4 py-4 bg-white border border-neutral-200 rounded-2xl">
          <h2 className="text-lg font-bold text-[#0f2a52] mb-1">{object.description}</h2>

          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-neutral-500">ID</span>
            <span className="text-xs font-mono text-[#0f2a52]">{object.code}</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 py-2.5 border-t border-neutral-100"
            >
              <span className="text-sm text-neutral-500 flex-shrink-0">{row.label}</span>
              <span className="text-sm font-medium text-[#0f2a52] text-right">{row.value}</span>
            </div>
          ))}
        </section>

        {/* Cómo reclamarlo */}
        <section className="p-4 bg-[#fffbe0] border border-[#fde68a] rounded-2xl text-sm text-[#0f2a52]">
          <p>
            <strong>¿Es tuyo este objeto?</strong> Para reclamarlo, dirígete a la oficina de{' '}
            <strong>Bienestar Estudiantil</strong> con tu carnet o credencial universitaria
            indicando el código <span className="font-mono font-bold">{object.code}</span>.
          </p>
        </section>

        {/* Dónde queda la oficina */}
        <section className="flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-2xl">
          <div className="p-2 bg-[#eaf1fb] text-[#2a6bb5] rounded-full flex-shrink-0">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0f2a52]">
              Bienestar Estudiantil – Bloque B, planta baja
            </p>
            <p className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Lunes a viernes, 08:00 a 18:00
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
