import { PackageSearch } from 'lucide-react';
import { BackHeader } from '../../core/presenter/BackHeader';

export type LostReportSummary = {
  id: string;
  code: string;
  description: string;
  status: string;
};

type MyLostReportsPageProps = {
  reports: LostReportSummary[];
  onBack: () => void;
  onSelectReport?: (report: LostReportSummary) => void;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SEARCHING: { label: 'Buscando', className: 'bg-[#e6ebf3] text-[#0f2a52]' },
  WITH_MATCHES: { label: 'Con coincidencias', className: 'bg-[#fef3c7] text-[#92400e]' },
  PENDING_PICKUP: { label: 'Pendiente de recojo', className: 'bg-[#14407a] text-white' },
  RECOVERED: { label: 'Recuperado', className: 'bg-[#d9f5e3] text-[#14532d]' },
};

export function MyLostReportsPage({ reports, onBack, onSelectReport }: MyLostReportsPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Mis reportes de pérdida" onBack={onBack} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {reports.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            No tienes reportes de pérdida activos.
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.status] || {
                label: report.status,
                className: 'bg-[#e6ebf3] text-[#0f2a52]',
              };

              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport?.(report)}
                  className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-2xl cursor-pointer hover:border-[#14407a] transition"
                >
                  <div className="flex items-center justify-center w-12 h-12 flex-shrink-0 rounded-xl bg-[#eaf1fb] text-[#2a6bb5]">
                    <PackageSearch className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-mono text-neutral-500">
                      {report.code}
                    </span>
                    <h3 className="text-sm font-semibold text-[#0f2a52] truncate">
                      {report.description}
                    </h3>
                  </div>

                  <span
                    className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
