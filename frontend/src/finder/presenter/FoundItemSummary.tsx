import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';
import { formatReportDate } from '../logic/formatReportDate';
import { FoundItemPhoto } from './FoundItemPhoto';
import { FoundItemReception } from './FoundItemReception';
import { FoundItemCode } from './FoundItemCode';

export function FoundItemSummary({ report, foundItemsService }: { report: MyFoundItem; foundItemsService: FoundItemsService }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <FoundItemPhoto report={report} foundItemsService={foundItemsService} />
        <div className="min-w-0 space-y-1">
          <p className="break-words text-sm text-neutral-900">{report.description}</p>
          <p className="text-sm text-neutral-500">{report.category}</p>
          <p className="text-xs text-neutral-500">
            Encontrado el <time dateTime={report.foundAt}>{formatReportDate(report.foundAt)}</time>
          </p>
        </div>
      </div>
      <FoundItemCode code={report.code} />
      <FoundItemReception status={report.status} receivedAt={report.receivedAt} />
    </div>
  );
}
