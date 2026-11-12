export function FoundItemCode({ code }: { code: string }) {
  return (
    <div
      role="group"
      aria-label="Código para entregar el objeto"
      className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700"
    >
      <p className="break-all font-mono text-xl font-semibold">{code}</p>
      <p className="text-sm">Muestra este código en Bienestar Estudiantil cuando entregues el objeto</p>
    </div>
  );
}
