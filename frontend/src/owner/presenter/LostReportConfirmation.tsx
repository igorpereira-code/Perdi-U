import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { BackHeader } from '../../core/presenter/BackHeader';
import { Button } from '../../core/presenter/Button';
import { StatusChip } from '../../core/presenter/StatusChip';
import { SeeMatchesLink } from '../../matching/presenter/SeeMatchesLink';

type LostReportConfirmationProps = {
  reportCode: string;
  onGoHome: () => void;
};

export function LostReportConfirmation({ reportCode, onGoHome }: LostReportConfirmationProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <BackHeader title="Reporte de pérdida" onBack={onGoHome} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Aviso de éxito */}
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#d9f5e3] text-[#14532d] text-sm"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>Reporte enviado correctamente</span>
        </div>

        {/* Código del reporte */}
        <section className="p-6 bg-white border border-neutral-200 rounded-2xl text-center space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            ID de tu reporte
          </p>
          <span className="block text-4xl font-mono font-bold tracking-wider text-[#14407a]">
            {reportCode}
          </span>
          <p className="text-sm text-neutral-500">
            Guarda este código para hacerle seguimiento a tu objeto.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span>Estado:</span>
            <StatusChip status="SEARCHING" />
          </div>
        </section>

        {/* Aviso de privacidad */}
        <div className="flex items-start gap-3 p-4 bg-[#fffbe0] border border-[#fde68a] rounded-2xl text-sm text-[#0f2a52]">
          <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Tu reporte es privado: solo lo ven tú y Bienestar Estudiantil. Quedará activo aunque
            todavía no aparezca tu objeto, y el sistema te notificará cuando haya coincidencias.
          </p>
        </div>

        <SeeMatchesLink reportCode={reportCode} />

        <Button variant="outline" className="w-full" onClick={onGoHome}>
          Volver al inicio
        </Button>
      </main>
    </div>
  );
}
