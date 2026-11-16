import {
  FOUND_ITEM_STATUS_LABEL,
  LOST_REPORT_STATUS_LABEL,
  type FoundItemStatus,
  type LostReportStatus,
} from '@shared/statuses';

export type Status = FoundItemStatus | LostReportStatus;

export type StatusTone = 'waiting' | 'info' | 'published' | 'highlight' | 'neutral' | 'done';

export type StatusDisplay = { label: string; tone: StatusTone };

const STATUS_LABELS: Record<Status, string> = {
  ...FOUND_ITEM_STATUS_LABEL,
  ...LOST_REPORT_STATUS_LABEL,
};

const STATUS_TONES: Record<Status, StatusTone> = {
  PENDING_DROP_OFF: 'waiting',
  IN_CUSTODY: 'info',
  PUBLISHED: 'published',
  DELIVERED: 'done',
  SEARCHING: 'neutral',
  HAS_MATCHES: 'highlight',
  PENDING_PICKUP: 'waiting',
  RECOVERED: 'done',
};

export function getStatusDisplay(status: Status): StatusDisplay {
  return { label: STATUS_LABELS[status], tone: STATUS_TONES[status] };
}
