import { BackHeader } from '../../core/presenter/BackHeader';

type NewLostReportPageProps = {
  onBack: () => void;
};

export function NewLostReportPage({ onBack }: NewLostReportPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Reportar objeto perdido" onBack={onBack} />
      <main className="p-4 max-w-lg mx-auto">
        <form aria-label="Reporte de pérdida" className="space-y-4">
          {/* Los campos del formulario se agregarán en los siguientes criterios */}
        </form>
      </main>
    </div>
  );
}