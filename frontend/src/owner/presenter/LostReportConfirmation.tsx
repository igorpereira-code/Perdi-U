import { CircleCheck } from 'lucide-react';

/** Shown after sending a lost report. */
export function LostReportConfirmation({ code }: { code: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <CircleCheck className="mx-auto h-12 w-12 text-blue-500" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-blue-700">Reporte enviado</h1>
      <div className="rounded-2xl border border-neutral-300 bg-neutral-0 p-4">
        <p className="text-sm text-neutral-500">Código de tu reporte</p>
        <p className="font-mono text-2xl font-bold text-blue-700">{code}</p>
      </div>
    </div>
  );
}