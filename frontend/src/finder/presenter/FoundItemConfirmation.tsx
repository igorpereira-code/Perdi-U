import { Alert } from '../../core/presenter/Alert';
import { WelfareCard } from '../../core/presenter/WelfareCard';

export function FoundItemConfirmation({ code }: { code: string }) {
  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-blue-700">Reporte registrado</h1>
      <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
        Tu código de reporte es <strong className="block text-2xl">{code}</strong>
      </p>
      <p className="text-sm text-neutral-700">Lleva el objeto a Bienestar Estudiantil.</p>
      <p className="text-sm text-neutral-700">Muestra el código {code} al entregar el objeto.</p>
      <Alert>
        <div className="space-y-2">
          <p>No entregues el objeto directamente a su dueño. Debes llevarlo a Bienestar Estudiantil</p>
          <p>Tu reporte permanecerá privado hasta que entregues el objeto a Bienestar Estudiantil y se confirme su recepción.</p>
        </div>
      </Alert>
      <WelfareCard />
    </section>
  );
}
