import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { FoundItemForm } from '../../finder/presenter/FoundItemForm';
import { SkeletonList } from '../../core/presenter/Skeleton';
import type { WelfareService } from '../data/welfareService';

type RegisterFoundItemSectionProps = {
  catalogs: FoundItemCatalogs | null;
  welfareService: WelfareService;
};

export function RegisterFoundItemSection({ catalogs, welfareService }: RegisterFoundItemSectionProps) {
  if (!catalogs) {
    return <SkeletonList label="Cargando formulario" rows={4} />;
  }

  return (
    <FoundItemForm
      catalogs={catalogs}
      onCreate={welfareService.registerFoundItem}
      title="Registrar objeto"
      submitLabel="Registrar objeto"
      submittingLabel="Registrando objeto…"
      skipReview
      renderConfirmation={(code) => (
        <section className="mx-auto max-w-lg space-y-4">
          <h2 className="text-lg font-semibold text-blue-700">Objeto registrado</h2>
          <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
            Código del objeto <strong className="block text-2xl">{code}</strong>
          </p>
          <p className="text-sm text-neutral-700">
            El objeto quedó en custodia y está listo para publicarse.
          </p>
        </section>
      )}
    />
  );
}
