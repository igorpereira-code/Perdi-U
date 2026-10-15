import { ArrowLeft } from 'lucide-react';

type BackHeaderProps = {
  title: string;
  onBack: () => void;
};

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <header className="flex items-center gap-2 py-2">
      <button
        type="button"
        aria-label="Volver"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full text-blue-700 hover:bg-blue-50"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <h1 className="text-lg font-semibold text-blue-700">{title}</h1>
    </header>
  );
}
