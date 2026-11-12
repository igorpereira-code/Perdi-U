import { StatusChip } from '../../core/presenter/StatusChip';
import type { MyFoundItem } from '../data/foundItemsService';
import { formatReportDate } from '../logic/formatReportDate';
import { wasReceivedByWelfare } from '../logic/wasReceivedByWelfare';

export function FoundItemReception({ status, receivedAt }: Pick<MyFoundItem, 'status' | 'receivedAt'>) {
  return (
    <div className="space-y-2">
      <StatusChip status={status} />
      {wasReceivedByWelfare(status) ? (
        <div className="space-y-1 text-sm text-success-700">
          <p>Recibido por Bienestar Estudiantil</p>
          {receivedAt ? (
            <p className="text-xs text-neutral-500">
              Recibido el <time dateTime={receivedAt}>{formatReportDate(receivedAt)}</time>
            </p>
          ) : <p className="text-xs text-neutral-500">Fecha de recepción no registrada.</p>}
        </div>
      ) : <p className="text-sm text-neutral-700">Bienestar Estudiantil aún no recibió el objeto.</p>}
    </div>
  );
}
