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

export function FoundObjectDetailPage({ object, onBack }: FoundObjectDetailPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Detalle del objeto" onBack={onBack} />

      <main className="p-4 max-w-lg mx-auto space-y-5">
        {object.photoUrl ? (
          <div className="w-full h-64 bg-neutral-200 rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-200">
            <img
              src={object.photoUrl}
              alt={object.description}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 border border-neutral-200 text-sm">
            Sin foto de referencia
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Código de objeto
            </span>
            <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              {object.code}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Descripción
            </h2>
            <p className="text-neutral-900 font-medium text-base">{object.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Categoría
              </span>
              <span className="text-sm font-medium text-neutral-800">{object.category}</span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Fecha encontrado
              </span>
              <span className="text-sm font-medium text-neutral-800">
                {object.foundDate ?? 'No especificada'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
              Lugar donde fue hallado
            </span>
            <span className="text-sm font-medium text-neutral-800">
              {object.place ?? 'Campus universitario'}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}