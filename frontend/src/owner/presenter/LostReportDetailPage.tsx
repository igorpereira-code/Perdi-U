import { BackHeader } from '../../core/presenter/BackHeader';

export type LostReportDetail = {
  id: string;
  code: string;
  description: string;
  category: string;
  place: string;
  date: string;
  status: string;
};

type LostReportDetailPageProps = {
  report: LostReportDetail;
  onBack: () => void;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SEARCHING: { label: 'Buscando', className: 'bg-neutral-100 text-neutral-700' },
  WITH_MATCHES: { label: 'Con coincidencias', className: 'bg-yellow-100 text-yellow-800' },
  PENDING_PICKUP: { label: 'Pendiente de recojo', className: 'bg-blue-100 text-blue-800' },
  RECOVERED: { label: 'Recuperado', className: 'bg-green-100 text-green-800' },
};

export function LostReportDetailPage({ report, onBack }: LostReportDetailPageProps) {
  const statusConfig = STATUS_CONFIG[report.status] || {
    label: report.status,
    className: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Detalle de tu reporte" onBack={onBack} />

      <main className="p-4 max-w-lg mx-auto space-y-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Código de reporte
            </span>
            <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              {report.code}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Descripción
            </h2>
            <p className="text-neutral-900 font-medium text-base">{report.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Estado actual
              </span>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Categoría
              </span>
              <span className="text-sm font-medium text-neutral-800">{report.category}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Fecha de pérdida
              </span>
              <span className="text-sm font-medium text-neutral-800">{report.date}</span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Lugar
              </span>
              <span className="text-sm font-medium text-neutral-800">{report.place}</span>
            </div>
          </div>
        </div>

        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm font-semibold text-blue-900">
            Muestra este código en Bienestar Estudiantil
          </p>
          <div className="bg-white border-2 border-blue-200 py-4 px-6 rounded-xl inline-block shadow-sm">
            <span className="text-3xl font-mono font-bold text-blue-700 tracking-widest">
              {report.code}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}