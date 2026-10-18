import { Button } from '../../core/presenter/Button';
import { SeeMatchesLink } from '../../matching/presenter/SeeMatchesLink';

type LostReportConfirmationProps = {
  reportCode: string;
  onGoHome: () => void;
};

export function LostReportConfirmation({ reportCode, onGoHome }: LostReportConfirmationProps) {
  return (
    <main className="p-4 max-w-lg mx-auto text-center space-y-6 pt-10">
      <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
        ✓
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-neutral-900">Reporte registrado con éxito</h1>
        <p className="text-sm text-neutral-500">
          Guarda este código para hacerle seguimiento a tu objeto:
        </p>
      </div>

      <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm inline-block">
        <span className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
          {reportCode}
        </span>
      </div>

      <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-600 text-left">
        🔒 <strong>Reporte privado:</strong> Tu reporte es privado: solo lo ven tú y Bienestar Estudiantil.
      </div>

      <div className="pt-2">
        <SeeMatchesLink reportCode={reportCode} />
      </div>

      <div className="pt-4">
        <Button variant="outline" className="w-full" onClick={onGoHome}>
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}