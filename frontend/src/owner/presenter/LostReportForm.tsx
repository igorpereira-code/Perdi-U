import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';

type LostReportFormProps = {
  catalogs: FoundItemCatalogs;
};

export function LostReportForm(_props: LostReportFormProps) {
  return (
    <form aria-labelledby="lost-report-title" className="mx-auto max-w-lg space-y-5" noValidate>
      <h1 id="lost-report-title" className="text-lg font-semibold text-blue-700">
        Reportar objeto perdido
      </h1>
    </form>
  );
}