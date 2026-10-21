import { HandHeart } from 'lucide-react';

type FoundItemEntryProps = {
  onClick: () => void;
};

export function FoundItemEntry({ onClick }: FoundItemEntryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 text-left transition hover:border-blue-300"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500 text-blue-700">
        <HandHeart className="h-7 w-7" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-blue-700">Encontré un objeto</span>
    </button>
  );
}