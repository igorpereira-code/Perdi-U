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
  SEARCHING: { label: 'Buscando', className: 'bg-[#e6ebf3] text-[#0f2a52]' },
  WITH_MATCHES: { label: 'Con coincidencias', className: 'bg-[#fef3c7] text-[#92400e]' },
  PENDING_PICKUP: { label: 'Pendiente de recojo', className: 'bg-[#14407a] text-white' },
  RECOVERED: { label: 'Recuperado', className: 'bg-[#d9f5e3] text-[#14532d]' },
};

export function LostReportDetailPage({ report, onBack }: LostReportDetailPageProps) {
  const statusConfig = STATUS_CONFIG[report.status] || {
    label: report.status,
    className: 'bg-[#e6ebf3] text-[#0f2a52]',
  };

  const rows = [
    { label: 'Descripción', value: report.description },
    { label: 'Categoría', value: report.category },
    { label: 'Lugar', value: report.place },
    { label: 'Fecha de pérdida', value: report.date },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Reporte de pérdida" onBack={onBack} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Código del reporte */}
        <section className="p-6 bg-white border border-neutral-200 rounded-2xl text-center space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            ID de tu reporte
          </p>
          <span className="block text-4xl font-mono font-bold tracking-wider text-[#14407a]">
            {report.code}
          </span>
          <p className="text-sm text-neutral-600">Muestra este código en Bienestar Estudiantil</p>
        </section>

        {/* Datos del reporte */}
        <section className="px-4 py-2 bg-white border border-neutral-200 rounded-2xl">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-neutral-500">Estado</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
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
      </main>
    </div>
  );
}
