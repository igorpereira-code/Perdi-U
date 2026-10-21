import { PackageSearch } from 'lucide-react';

type LostItemEntryProps = { onClick: () => void };

/** Home option to start a lost item report. */
export function LostItemEntry({ onClick }: LostItemEntryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 text-left transition hover:border-blue-300"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-neutral-0">
        <PackageSearch className="h-7 w-7" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-blue-700">Perdí un objeto</span>
    </button>
  );
}