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
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm space-y-2 cursor-pointer hover:border-blue-300 transition"
              >
                <h3 className="font-medium text-neutral-900">{report.description}</h3>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}