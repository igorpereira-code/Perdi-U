import {
  FOUND_ITEM_STATUS_LABEL,
  LOST_REPORT_STATUS_LABEL,
  type FoundItemStatus,
  type LostReportStatus,
} from '@shared/statuses';

type Status = FoundItemStatus | LostReportStatus;

const LABEL: Record<Status, string> = { ...FOUND_ITEM_STATUS_LABEL, ...LOST_REPORT_STATUS_LABEL };

const COLOR: Record<Status, string> = {
  PENDING_DROP_OFF: 'bg-warning-50 text-warning-700',
  IN_CUSTODY: 'bg-blue-100 text-blue-500',
  PUBLISHED: 'bg-blue-500 text-neutral-0',
  DELIVERED: 'bg-success-50 text-success-700',
  SEARCHING: 'bg-neutral-100 text-neutral-700',
  HAS_MATCHES: 'bg-yellow-500 text-blue-700',
  PENDING_PICKUP: 'bg-warning-50 text-warning-700',
  RECOVERED: 'bg-success-50 text-success-700',
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${COLOR[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}
