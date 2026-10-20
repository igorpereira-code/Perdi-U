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
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SEARCHING: { label: 'Buscando', className: 'bg-neutral-100 text-neutral-700' },
  WITH_MATCHES: { label: 'Con coincidencias', className: 'bg-yellow-100 text-yellow-800' },
  PENDING_PICKUP: { label: 'Pendiente de recojo', className: 'bg-blue-100 text-blue-800' },
  RECOVERED: { label: 'Recuperado', className: 'bg-green-100 text-green-800' },
};

export function MyLostReportsPage({ reports, onBack }: MyLostReportsPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Mis reportes de pérdida" onBack={onBack} />
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {reports.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            No tienes reportes de pérdida activos.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.status] || { 
                label: report.status, 
                className: 'bg-neutral-100 text-neutral-700' 
              };

              return (
                <div 
                  key={report.id} 
                  className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm space-y-2 cursor-pointer hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-blue-700">
                      {report.code}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="font-medium text-neutral-900">{report.description}</h3>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}