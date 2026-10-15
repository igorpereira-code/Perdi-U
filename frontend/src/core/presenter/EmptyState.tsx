import { Inbox, type LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  text: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, text, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-0 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-300">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="font-semibold text-blue-700">{title}</h2>
      <p className="max-w-xs text-sm text-neutral-500">{text}</p>
    </div>
  );
}
