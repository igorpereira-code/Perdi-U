import { LoaderCircle } from 'lucide-react';

type LoadingStateProps = {
  /** What is loading, e.g. "Cargando tus reportes…". */
  text: string;
};

/** Shown while a screen or a list is loading. Same look in the whole app. */
export function LoadingState({ text }: LoadingStateProps) {
  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-500"
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" aria-hidden="true" />
      {text}
    </p>
  );
}
