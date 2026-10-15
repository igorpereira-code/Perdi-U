import { getStatusDisplay, type Status, type StatusTone } from '../logic/status';

// Presentation only: colors for each tone. The meaning comes from logic/status.ts
const TONE_CLASSES: Record<StatusTone, string> = {
  waiting: 'bg-warning-50 text-warning-700',
  info: 'bg-blue-100 text-blue-500',
  published: 'bg-blue-500 text-neutral-0',
  highlight: 'bg-yellow-500 text-blue-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  done: 'bg-success-50 text-success-700',
};

export function StatusChip({ status }: { status: Status }) {
  const { label, tone } = getStatusDisplay(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
