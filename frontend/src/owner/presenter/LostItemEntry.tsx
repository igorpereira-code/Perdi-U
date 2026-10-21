import { Search } from 'lucide-react';

type LostItemEntryProps = { onClick: () => void };

/** Home option to start a lost item report. */
export function LostItemEntry({ onClick }: LostItemEntryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-neutral-0 hover:bg-blue-500"
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      Perdí un objeto
    </button>
  );
}