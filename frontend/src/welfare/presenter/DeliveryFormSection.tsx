import type { FormEvent } from 'react';
import { PackageCheck } from 'lucide-react';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import type { DeliveryInput } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';

type DeliveryFormSectionProps = {
  draft: DeliveryInput | null;
  isDelivering: boolean;
  onChange: (field: keyof DeliveryInput, value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function DeliveryFormSection({ draft, isDelivering, onChange, onSubmit }: DeliveryFormSectionProps) {
  return (
    <>
      <WelfareSectionHeader
        title="Registrar entrega"
        subtitle="Verifica la propiedad en persona antes de registrar la entrega."
      />
      {draft ? (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
          <Field id="delivery-item-code" label="Código del objeto a entregar">
            <input id="delivery-item-code" className={`${INPUT_CLASSES} font-mono uppercase`} value={draft.foundItemCode} onChange={(event) => onChange('foundItemCode', event.target.value)} />
          </Field>
          <Field id="delivery-report-code" label="Código del reporte (opcional)">
            <input id="delivery-report-code" className={`${INPUT_CLASSES} font-mono uppercase`} value={draft.lostReportCode ?? ''} onChange={(event) => onChange('lostReportCode', event.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="delivery-recipient-name" label="Nombre de quien recibe">
              <input id="delivery-recipient-name" className={INPUT_CLASSES} value={draft.recipientName} onChange={(event) => onChange('recipientName', event.target.value)} />
            </Field>
            <Field id="delivery-recipient-code" label="Código universitario">
              <input id="delivery-recipient-code" className={INPUT_CLASSES} value={draft.recipientUniversityCode} onChange={(event) => onChange('recipientUniversityCode', event.target.value)} />
            </Field>
          </div>
          <Field id="delivery-recipient-email" label="Correo institucional">
            <input id="delivery-recipient-email" type="email" className={INPUT_CLASSES} value={draft.recipientEmail} onChange={(event) => onChange('recipientEmail', event.target.value)} />
          </Field>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-blue-700">
            Al confirmar, el objeto pasará a <b>Entregado</b>, dejará de verse en el catálogo y el reporte vinculado quedará como <b>Recuperado</b>.
          </div>
          <Button type="submit" isLoading={isDelivering} loadingText="Registrando entrega…">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            Confirmar entrega
          </Button>
        </form>
      ) : (
        <EmptyState title="Selecciona un objeto" text="Elige un objeto en custodia o un recojo pendiente para registrar su entrega." />
      )}
    </>
  );
}
